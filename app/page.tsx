"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/lib/store";
import { Spade, Heart, Diamond, Club, Copy, Loader2 } from "lucide-react";

export default function Lobby() {
  const [usernameInput, setUsernameInput] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isLobbyMode, setIsLobbyMode] = useState(true); // true = landing, false = username prompt
  const [isWaiting, setIsWaiting] = useState(false);
  const { setCode, setUsername, code, setGameState } = useGameStore();
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
    });

    return () => {
      socket.off("room:joined");
      socket.off("error");
    };
  }, [socket, setCode, setGameState, router]);

  const handleCreateRoom = () => {
    if (!usernameInput) return alert("Please enter a username");
    setIsWaiting(true);
    socket.emit("room:create", { username: usernameInput });
  };

  const handleJoinRoom = () => {
    if (!usernameInput) return alert("Please enter a username");
    if (!roomCodeInput) return alert("Please enter a room code");
    setIsWaiting(true);
    socket.emit("room:join", { code: roomCodeInput, username: usernameInput });
  };

  const FloatingSuit = ({ icon: Icon, delay = 0, x = 0 }: { icon: any, delay?: number, x?: number }) => (
    <motion.div
      initial={{ y: "110vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.2, 0] }}
      transition={{ duration: 15, repeat: Infinity, delay, ease: "linear" }}
      className="absolute text-slate-800/20"
      style={{ left: `${x}%` }}
    >
      <Icon size={120} />
    </motion.div>
  );

  return (
    <main className="relative min-height-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-black">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <FloatingSuit icon={Spade} delay={0} x={10} />
        <FloatingSuit icon={Heart} delay={4} x={30} />
        <FloatingSuit icon={Diamond} delay={8} x={60} />
        <FloatingSuit icon={Club} delay={12} x={85} />
      </div>

      <div className="z-10 w-full max-w-md bg-zinc-950/80 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-cinzel text-6xl font-bold bg-gradient-to-b from-blue-200 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            TONGITS
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-sm mt-2">Premium Multiplayer</p>
        </motion.div>

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
                    className="w-full bg-zinc-900 border-b-2 border-zinc-700 p-4 pt-6 focus:border-blue-500 outline-none transition-all rounded-t-lg font-medium"
                  />
                  <label className="absolute left-4 top-1 text-[10px] text-zinc-500 uppercase tracking-tighter">Username</label>
                </div>

                <div className="flex gap-4">
                  <button onClick={handleCreateRoom} className="flex-1 btn-blue">
                    Create Room
                  </button>
                </div>

                <div className="relative flex items-center gap-4 py-4">
                  <div className="flex-1 h-px bg-zinc-800"></div>
                  <span className="text-zinc-600 text-xs uppercase">OR</span>
                  <div className="flex-1 h-px bg-zinc-800"></div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Room Code (e.g. TNG-1234)"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-900 border-b-2 border-zinc-700 p-4 pt-6 focus:border-blue-500 outline-none transition-all rounded-t-lg font-medium"
                    />
                    <label className="absolute left-4 top-1 text-[10px] text-zinc-500 uppercase tracking-tighter">Room Code</label>
                  </div>
                  <button onClick={handleJoinRoom} className="w-full btn-outline-blue">
                    Join Room
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
              <Loader2 className="animate-spin text-blue-500" size={64} />
              <div className="text-center">
                <h3 className="text-xl font-bold text-blue-200">Joining Game...</h3>
                <p className="text-zinc-500">Preparing the table</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center text-zinc-700 text-[10px] uppercase tracking-widest font-bold">
          &copy; 2026 TONGITS ONLINE • PREMIUM EDITION
        </div>
      </div>
    </main>
  );
}


