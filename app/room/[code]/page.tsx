"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/lib/store";
import Hand from "@/components/Hand";
import Card from "@/components/Card";
import MeldZone from "@/components/MeldZone";
import { Loader2, Trophy, AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GameRoom() {
  const { code } = useParams();
  const { gameState, setGameState, username } = useGameStore();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const router = useRouter();
  const socket = getSocket();

  useEffect(() => {
    socket.on("game:update", (state) => {
      setGameState(state);
    });

    socket.on("error", (msg) => {
      alert(msg);
    });

    return () => {
      socket.off("game:update");
      socket.off("error");
    };
  }, [socket, setGameState]);

  const toggleCardSelection = (index: number) => {
    setSelectedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleAction = (action: string, payload?: any) => {
    socket.emit(`game:${action}`, { code, ...payload });
    setSelectedCards([]);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black space-y-4">
        <Loader2 className="animate-spin text-amber-500" size={48} />
        <p className="text-zinc-500 uppercase tracking-widest text-sm">Synchronizing Table...</p>
      </div>
    );
  }

  const me = gameState.players.find((p: any) => p.id === socket.id);
  const opponent = gameState.players.find((p: any) => p.id !== socket.id);
  const isMyTurn = gameState.turnId === socket.id;

  return (
    <main className="relative min-h-screen bg-zinc-950 flex flex-col items-center justify-between p-4 pb-24 overflow-hidden">
      {/* Table Background */}
      <div className="absolute inset-4 felt-table z-0" />

      {/* Top Bar - Opponent Info */}
      <div className="z-10 w-full max-w-5xl flex justify-between items-start pt-8">
        <div className="flex flex-col items-start gap-1">
           <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${!isMyTurn ? 'bg-amber-500 text-emerald-950 border-amber-400 animate-pulse' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
            {opponent?.username || "Waiting..."}
          </div>
          <p className="text-[10px] text-zinc-500 px-2 uppercase tracking-tighter">Opponent</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 px-6 py-2 rounded-2xl backdrop-blur-md">
            <span className="text-zinc-500 text-[10px] uppercase tracking-widest mr-4">Room Code</span>
            <span className="font-mono text-amber-500 font-bold">{code}</span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-amber-500/50 text-xs font-bold uppercase tracking-widest">Draw Pile</div>
          <div className="text-2xl font-cinzel font-bold text-white">{gameState.drawPileCount}</div>
        </div>
      </div>

      {/* Game Table Area */}
      <div className="z-10 flex-1 w-full flex flex-col items-center justify-center gap-12 pt-12">
        {/* Opponent's Hand (Face down) */}
        <div className="relative rotate-180 scale-75 opacity-80">
          <Hand cards={[]} isOpponent handCount={opponent?.handCount || 0} />
        </div>

        {/* Board Melds */}
        <MeldZone 
          playerMelds={me?.melds || []} 
          opponentMelds={opponent?.melds || []}
          playerId={me?.id}
          opponentId={opponent?.id}
          onSapaw={(targetPlayerId, meldIndex) => {
             if (!isMyTurn || selectedCards.length === 0) return;
             handleAction("sapaw", { targetPlayerId, meldIndex, cardIndices: selectedCards });
          }}
        />

        {/* Play Area: Draw & Discard Piles */}
        <div className="flex items-center gap-16">
          {/* Deck Pile */}
          <div 
            className={`relative w-24 h-36 rounded-xl border-4 border-white/20 bg-zinc-900 cursor-pointer hover:border-amber-500 transition-colors ${!isMyTurn ? 'pointer-events-none' : ''}`}
            onClick={() => handleAction("draw-stock")}
          >
            <div className="absolute inset-0 bg-zinc-800 rounded-lg m-1 flex items-center justify-center">
                 <div className="text-zinc-600 font-cinzel text-xs font-bold -rotate-45">TONGITS</div>
            </div>
            {gameState.drawPileCount > 0 && (
                <div className="absolute -right-2 -top-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-emerald-950 font-bold text-xs shadow-lg">
                    {gameState.drawPileCount}
                </div>
            )}
          </div>

          {/* Discard Pile */}
          <div 
            className={`relative w-24 h-36 rounded-xl border-4 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors ${!isMyTurn ? 'pointer-events-none' : ''}`}
            onClick={() => handleAction("draw-discard")}
          >
             {gameState.discardPile.length > 0 ? (
                 <Card {...gameState.discardPile[gameState.discardPile.length - 1]} className="w-full h-full" />
             ) : (
                 <span className="text-[10px] text-white/20 uppercase tracking-widest text-center px-2">Discard Pile Empty</span>
             )}
          </div>
        </div>
      </div>

      {/* Bottom Controls - Player Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black to-transparent flex flex-wrap justify-center items-end gap-8 pb-8">
        
        {/* My Turn Banner */}
        <AnimatePresence>
            {isMyTurn && (
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="absolute bottom-60 px-8 py-2 bg-amber-500 text-emerald-900 font-black rounded-full text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse"
                >
                    Your Turn
                </motion.div>
            )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            disabled={!isMyTurn || selectedCards.length < 3}
            onClick={() => handleAction("meld", { cardIndices: selectedCards })}
            className="px-6 py-2 bg-zinc-900 border border-amber-500/30 text-amber-500 rounded-xl disabled:opacity-30 disabled:grayscale uppercase text-xs font-bold tracking-widest hover:bg-amber-500 hover:text-emerald-950 transition-all"
          >
            Meld
          </button>
          
          <button 
            disabled={!isMyTurn || selectedCards.length !== 1}
            onClick={() => handleAction("discard", { cardIndex: selectedCards[0] })}
            className="px-6 py-2 bg-red-950/30 border border-red-500/30 text-red-500 rounded-xl disabled:opacity-30 disabled:grayscale uppercase text-xs font-bold tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]"
          >
            Discard
          </button>

          <button 
            disabled={!isMyTurn || !me?.hasMelded}
            onClick={() => handleAction("call-draw")}
            className="px-8 py-2 bg-amber-500 text-emerald-950 rounded-xl disabled:opacity-30 disabled:grayscale uppercase text-xs font-black tracking-widest hover:scale-105 transition-all shadow-lg"
          >
            Call Draw
          </button>
        </div>

        {/* My Hand */}
        <div className="relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Your Points</span>
                <span className="text-xl font-bold text-amber-500">{me?.points || 0}</span>
            </div>
          <Hand 
            cards={me?.hand || []} 
            selectedIndices={selectedCards} 
            onCardClick={toggleCardSelection}
          />
        </div>
      </div>

      {/* Game Over Screen */}
      <AnimatePresence>
        {gameState.status === "ENDED" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 overflow-y-auto"
          >
            <motion.div 
                initial={{ scale: 0.5, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-zinc-900 border-2 border-amber-500 p-12 rounded-[40px] shadow-[0_0_100px_rgba(251,191,36,0.3)] text-center max-w-lg w-full"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-amber-500 flex items-center justify-center rounded-full shadow-[0_0_40px_rgba(251,191,36,0.5)]">
                        <Trophy size={48} className="text-emerald-900" />
                    </div>
                </div>
                
                <h2 className="font-cinzel text-5xl font-bold bg-gradient-to-b from-amber-200 to-amber-500 bg-clip-text text-transparent mb-2">
                    {gameState.winner?.id === socket.id ? "VICTORY!" : "DEFEAT"}
                </h2>
                
                <p className="text-zinc-500 uppercase tracking-widest text-sm mb-12">
                   Winner: <span className="text-amber-500 font-bold">{gameState.winner?.username}</span> via <span className="text-white">{gameState.roundReason}</span>
                </p>

                <div className="mb-8 space-y-2">
                    {gameState.players.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <span className={p.id === gameState.winner?.id ? "text-amber-500" : "text-zinc-500"}>
                                    {p.username}
                                </span>
                                {p.isBurned && (
                                    <span className="bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black animate-bounce">BURNED x2</span>
                                )}
                            </div>
                            <span className="font-bold text-lg">{p.points} <span className="text-[10px] text-zinc-500 uppercase">pts</span></span>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => handleAction("rematch")}
                    className="w-full btn-gold py-4 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={20} />
                    Play Again
                  </button>
                  <button 
                    onClick={() => router.push("/")}
                    className="w-full btn-outline-gold py-4 flex items-center justify-center gap-2"
                  >
                    <Home size={20} />
                    Leave Room
                  </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disconnected Overlay */}
      <AnimatePresence>
        {gameState.players.some((p: any) => !p.isConnected) && gameState.status === "PLAYING" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
          >
            <div className="bg-zinc-900 border-2 border-red-500/50 p-8 rounded-3xl text-center max-w-sm">
                <AlertCircle className="text-red-500 mx-auto mb-4 animate-pulse" size={48} />
                <h3 className="text-xl font-bold text-white mb-2">Opponent Disconnected</h3>
                <p className="text-zinc-500 text-sm mb-6">Waiting for reconnection... The room will close automatically in 60 seconds.</p>
                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 60, ease: "linear" }}
                        className="bg-red-500 h-full"
                    />
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
