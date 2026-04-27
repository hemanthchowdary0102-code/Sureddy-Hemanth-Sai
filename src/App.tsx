import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Music, Trophy, RotateCcw, Volume2 } from 'lucide-react';

// --- Constants & Types ---

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const BASE_SPEED = 150;

interface Point {
  x: number;
  y: number;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
  color: string;
}

const TRACKS: Track[] = [
  {
    id: 1,
    title: "Cyber City Drift",
    artist: "AI Synth Voyager",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400",
    color: "rgba(6, 182, 212, 1)" // cyan-500
  },
  {
    id: 2,
    title: "Neon Heartbeat",
    artist: "Neural Beats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=400",
    color: "rgba(236, 72, 153, 1)" // pink-500
  },
  {
    id: 3,
    title: "Vapor Trails",
    artist: "Digital Echo",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=400",
    color: "rgba(168, 85, 247, 1)" // purple-500
  }
];

// --- Snake Game Component ---

const SnakeGame = ({ onScoreUpdate }: { onScoreUpdate: (score: number) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const lastDirection = useRef(INITIAL_DIRECTION);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastDirection.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameOver(false);
    setScore(0);
    onScoreUpdate(0);
    setGameActive(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (lastDirection.current.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (lastDirection.current.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (lastDirection.current.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (lastDirection.current.x === 0) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver]);

  useEffect(() => {
    if (isGameOver || !gameActive) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = { x: prev[0].x + direction.x, y: prev[0].y + direction.y };
        lastDirection.current = direction;

        // Collision Check (Wall)
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          return prev;
        }

        // Collision Check (Self)
        if (prev.some(segment => segment.x === head.x && segment.y === head.y)) {
          setIsGameOver(true);
          return prev;
        }

        const newSnake = [head, ...prev];
        
        // Food Check
        if (head.x === food.x && head.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);
          onScoreUpdate(newScore);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, Math.max(80, BASE_SPEED - Math.floor(score / 50) * 5));
    return () => clearInterval(interval);
  }, [direction, food, isGameOver, score, gameActive, generateFood, onScoreUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear Canvas
    ctx.fillStyle = '#00000066';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Subtle)
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw Food
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.shadowBlur = isHead ? 20 : 10;
      ctx.shadowColor = '#00f3ff';
      ctx.fillStyle = '#00f3ff';
      
      const padding = 1;
      ctx.fillRect(
        segment.x * cellSize + padding,
        segment.y * cellSize + padding,
        cellSize - padding * 2,
        cellSize - padding * 2
      );
    });

    // Reset shadow for next frame
    ctx.shadowBlur = 0;
  }, [snake, food]);

  return (
    <div className="relative group overflow-hidden w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={480}
        height={480}
        className="max-w-full max-h-full"
      />
      
      {!gameActive && !isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="px-8 py-3 bg-cyan-400 text-black rounded-full font-bold shadow-[0_0_20px_rgba(0,243,255,0.5)] flex items-center gap-2 uppercase tracking-widest text-sm"
          >
            <Play size={18} fill="currentColor" />
            Initialize System
          </motion.button>
          <p className="mt-4 text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase">WASD to Move // Space to Pause</p>
        </div>
      )}

      {isGameOver && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl"
        >
          <h2 className="text-4xl font-black text-pink-500 mb-2 tracking-tighter italic">SYSTEM COLLAPSE</h2>
          <p className="text-zinc-500 mb-6 font-mono text-sm tracking-widest uppercase">Score Payload: {score}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="px-8 py-3 border border-cyan-400 text-cyan-400 rounded-full font-bold flex items-center gap-2 hover:bg-cyan-400 hover:text-black transition-all uppercase tracking-widest text-sm"
          >
            <RotateCcw size={18} />
            Reboot
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    const handleEnded = () => skipForward();
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('ended', handleEnded);
      const updateProgress = () => {
        setProgress((audio.currentTime / audio.duration) * 100 || 0);
      };
      audio.addEventListener('timeupdate', updateProgress);
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('timeupdate', updateProgress);
      };
    }
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const skipForward = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setProgress(0);
  };

  const skipBack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setProgress(0);
  };

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) setHighScore(newScore);
  };

  return (
    <div className="min-h-screen bg-[#020205] text-zinc-100 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-[1100px] h-full md:h-[750px] grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4">
        
        {/* Header Block */}
        <header className="col-span-12 row-span-1 bento-card flex items-center justify-between px-8 neon-border-cyan">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f3ff]"></div>
            <span className="text-xl font-bold tracking-tighter uppercase italic">
              Neon<span className="text-cyan-400">Synth</span> OS <span className="text-xs font-normal opacity-50 ml-2">v1.2.4</span>
            </span>
          </div>
          <div className="flex gap-10 text-sm uppercase tracking-widest font-semibold">
            <div className="flex flex-col items-end">
              <span className="text-zinc-500 text-[9px] font-bold">Session Score</span>
              <span className="text-cyan-400 text-lg font-bold">{score.toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false })}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-zinc-500 text-[9px] font-bold">Neural Record</span>
              <span className="text-pink-500 text-lg font-bold">{highScore.toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false })}</span>
            </div>
          </div>
        </header>

        {/* Snake Game Block */}
        <main className="col-span-12 md:col-span-8 row-span-4 bento-card p-2 neon-border-cyan relative overflow-hidden bg-black/40">
           <SnakeGame onScoreUpdate={handleScoreUpdate} />
           <div className="absolute bottom-6 left-6 hidden md:flex gap-4">
            <div className="bg-black/60 px-4 py-2 rounded-full border border-white/10 text-[10px] text-zinc-400 font-bold tracking-widest">WASD TO MOVE</div>
            <div className="bg-black/60 px-4 py-2 rounded-full border border-white/10 text-[10px] text-zinc-400 font-bold tracking-widest">SPACE TO PAUSE</div>
          </div>
        </main>

        {/* Music Player Block */}
        <section className="col-span-12 md:col-span-4 row-span-3 bento-card p-8 neon-border-pink flex flex-col items-center justify-center gap-6">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-cyan-600 via-purple-600 to-pink-500 p-1 relative group">
            <div className="w-full h-full rounded-xl bg-zinc-900 flex items-center justify-center overflow-hidden">
               <img 
                src={currentTrack.cover} 
                alt={currentTrack.title} 
                className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-2 border-pink-400/20 rounded-full flex items-center justify-center">
                   <div className={`w-12 h-12 border border-pink-400/40 rounded-full flex items-center justify-center ${isPlaying ? 'animate-ping' : ''}`}>
                      <div className="w-3 h-3 bg-pink-500 rounded-full shadow-[0_0_15px_#ff00ff]"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <motion.h2 
              key={currentTrack.title}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold tracking-tight text-white"
              style={{ textShadow: '0 0 10px rgba(255, 0, 255, 0.3)' }}
            >
              {currentTrack.title}
            </motion.h2>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">{currentTrack.artist} // SYNC_ACTIVE</p>
          </div>

          <div className="w-full space-y-2">
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-pink-500 shadow-[0_0_10px_#ff00ff]"
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
              <span>0% LOAD</span>
              <span>100% SYNC</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={skipBack} className="text-zinc-500 hover:text-white transition-colors">
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-pink-500 flex items-center justify-center text-black shadow-lg shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={skipForward} className="text-zinc-500 hover:text-white transition-colors">
              <SkipForward size={20} fill="currentColor" />
            </button>
          </div>
        </section>

        {/* Up Next / Playlist Block */}
        <section className="col-span-12 md:col-span-4 row-span-2 bento-card p-6 neon-border-cyan flex flex-col gap-4 overflow-hidden">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.3em]">Neural Library</span>
          <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            {TRACKS.map((t, i) => (
              <button 
                key={t.id}
                onClick={() => {
                  setCurrentTrackIndex(i);
                  setIsPlaying(true);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                  i === currentTrackIndex 
                  ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400' 
                  : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 ${i === currentTrackIndex ? 'p-0.5 bg-cyan-400/50' : ''}`}>
                    <img src={t.cover} className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold truncate max-w-[120px]">{t.title}</div>
                    <div className="text-[8px] uppercase tracking-wider opacity-50">{t.artist}</div>
                  </div>
                </div>
                {i === currentTrackIndex && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f3ff]" />}
              </button>
            ))}
          </div>
        </section>

        {/* Footer Block */}
        <footer className="col-span-12 row-span-1 bento-card flex items-center justify-center gap-4 md:gap-16 text-[8px] md:text-[10px] uppercase font-bold tracking-[0.4em] text-zinc-600 px-4 text-center">
          <span className="hidden sm:inline">SYSTEM_READY</span>
          <span className="text-cyan-400/60 flex items-center gap-2">
             CORE_TEMP: <span className="text-zinc-300">42°C</span>
          </span>
          <span className="text-pink-400/60 flex items-center gap-2">
             SNAKE_LATENCY: <span className="text-zinc-300">{Math.max(80, BASE_SPEED - Math.floor(score / 50) * 5)}MS</span>
          </span>
          <span className="hidden sm:inline">BITRATE: 320KBPS</span>
          <span className="text-zinc-400">ENCRYPTION: RSA-4096</span>
        </footer>

        {/* Hidden Audio */}
        <audio ref={audioRef} src={currentTrack.url} />
      </div>
    </div>
  );
}
