"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/lib/store";
import { Spade, Heart, Diamond, Club, Loader2 } from "lucide-react";

export default function Lobby() {
  const [usernameInput, setUsernameInput] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const { setCode, setUsername, setGameState } = useGameStore();
  const router = useRouter();
  const socket = getSocket();

  useEffect(() => {
    socket.on("room:joined", ({ code, game }) => {
      setCode(code);
      setGameState(game);
      router.push(`/room/${code}`);
    });

    socket.on("error", (msg) => {
      alert(msg);
      setIsWaiting(false);
      // If auto-rejoin fails, clear storage
      localStorage.removeItem("tongits_room");
      localStorage.removeItem("tongits_user");
    });

    // Auto-rejoin check
    const savedRoom = localStorage.getItem("tongits_room");
    const savedUser = localStorage.getItem("tongits_user");
    if (savedRoom && savedUser && !isWaiting) {
      setUsernameInput(savedUser);
      setRoomCodeInput(savedRoom);
      setUsername(savedUser);
      setIsWaiting(true);
      socket.emit("room:join", { code: savedRoom, username: savedUser });
    }

    return () => {
      socket.off("room:joined");
      socket.off("error");
    };
  }, [socket, setCode, setGameState, setUsername, router]);

  const handleCreateRoom = () => {
    if (!usernameInput) return alert("Please enter a username");
    setUsername(usernameInput);
    setIsWaiting(true);
    socket.emit("room:create", { username: usernameInput });
  };

  const handleJoinRoom = () => {
    if (!usernameInput) return alert("Please enter a username");
    if (!roomCodeInput) return alert("Please enter a room code");
    setUsername(usernameInput);
    setIsWaiting(true);
    socket.emit("room:join", { code: roomCodeInput, username: usernameInput });
  };

  const FloatingSuit = ({ icon: Icon, delay = 0, x = 0 }: { icon: any, delay?: number, x?: number }) => (
    <motion.div
      initial={{ y: "110vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.2, 0] }}
      transition={{ duration: 15, repeat: Infinity, delay, ease: "linear" }}
      className="absolute text-pink-500/20"
      style={{ left: `${x}%` }}
    >
      <Icon size={120} />
    </motion.div>
  );

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden font-pixelify">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <FloatingSuit icon={Spade} delay={0} x={10} />
        <FloatingSuit icon={Heart} delay={4} x={30} />
        <FloatingSuit icon={Diamond} delay={8} x={60} />
        <FloatingSuit icon={Club} delay={12} x={85} />
      </div>

      <div className="z-10 w-full max-w-md bg-white/90 border-4 border-black p-8 shadow-[8px_8px_0_0_#ff1493] backdrop-blur-sm">
        <div className="text-center mb-12 animate-pop-in">
          <h1 className="font-press-start text-4xl font-bold bg-gradient-to-b from-pink-400 to-pink-700 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(255,20,147,0.2)] leading-tight">
            TONGITS
          </h1>
          <p className="text-pink-600 uppercase tracking-widest text-[10px] mt-4 font-press-start">Pixel Elite Edition</p>
        </div>

        <AnimatePresence mode="wait">
          {!isWaiting ? (
            <motion.div
              key="inputs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter Username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-pink-50/50 border-2 border-pink-200 p-4 pt-6 focus:border-pink-500 outline-none transition-all font-medium text-pink-900 placeholder-pink-200"
                  />
                  <label className="absolute left-4 top-1 text-[8px] text-pink-400 uppercase tracking-tighter font-press-start">Player Name</label>
                </div>

                <div className="flex gap-4">
                  <button onClick={handleCreateRoom} className="flex-1 btn-pink">
                    Create Table
                  </button>
                </div>

                <div className="relative flex items-center gap-4 py-4">
                  <div className="flex-1 h-[2px] bg-pink-100"></div>
                  <span className="text-pink-300 text-[10px] font-press-start">OR</span>
                  <div className="flex-1 h-[2px] bg-pink-100"></div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Room Code"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      className="w-full bg-pink-50/50 border-2 border-pink-200 p-4 pt-6 focus:border-pink-500 outline-none transition-all font-medium text-pink-900 placeholder-pink-200"
                    />
                    <label className="absolute left-4 top-1 text-[8px] text-pink-400 uppercase tracking-tighter font-press-start">Insert Code</label>
                  </div>
                  <button onClick={handleJoinRoom} className="w-full btn-outline-pink">
                    Join Table
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-6"
            >
              <Loader2 className="animate-spin text-pink-500" size={64} />
              <div className="text-center font-press-start">
                <h3 className="text-sm font-bold text-pink-600 animate-pulse">BOOTING GAME...</h3>
                <p className="text-pink-300 text-[8px] mt-4 uppercase tracking-widest">Initializing sync protocol</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center text-pink-200 text-[8px] uppercase tracking-widest font-black leading-relaxed font-press-start">
          &copy; 2026 TONGITS ONLINE<br />POWERED BY PINK PIXEL ENGINE
        </div>
      </div>
    </main>
  );
}




