"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/lib/store";
import Hand from "@/components/Hand";
import Card from "@/components/Card";
import MeldZone from "@/components/MeldZone";
import Chat from "@/components/Chat";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { Loader2, Trophy, AlertCircle, RotateCcw, Home, Mic, MicOff, Volume2, X, Group, Ungroup } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function GameRoom() {
  const { code } = useParams();
  const { gameState, setGameState, username } = useGameStore();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [groups, setGroups] = useState<number[][]>([]);
  const [isDiscardPending, setIsDiscardPending] = useState(false);
  const router = useRouter();
  const socket = getSocket();
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isVoiceJoined, isMuted, remoteStream, joinVoice, leaveVoice, toggleMute } = useVoiceChat(code as string);

  const me = gameState?.players?.find((p: any) => p.id === socket?.id);
  const opponent = gameState?.players?.find((p: any) => p.id !== socket?.id);
  const isMyTurn = gameState?.turnId === socket?.id;

  useEffect(() => {
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
    // Find if this card is part of a group
    const group = groups.find(g => g.includes(index));
    
    if (group) {
        // If clicking a grouped card, toggles the whole group
        const groupIsSelected = group.every(idx => selectedCards.includes(idx));
        if (groupIsSelected) {
            setSelectedCards(prev => prev.filter(idx => !group.includes(idx)));
        } else {
            setSelectedCards(prev => Array.from(new Set([...prev, ...group])));
        }
    } else {
        setSelectedCards((prev) =>
          prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    }
  };

  const handleGroup = () => {
    if (selectedCards.length < 2) return;
    setGroups(prev => {
      // Remove the selected indices from any existing groups to prevent duplicates
      const cleanedGroups = prev
        .map(group => group.filter(idx => !selectedCards.includes(idx)))
        .filter(group => group.length > 1); // Remove empty or single-card groups
      
      return [...cleanedGroups, [...selectedCards]];
    });
    setSelectedCards([]);
  };

  const handleUngroup = () => {
    if (selectedCards.length === 0) return;
    setGroups(prev => prev.filter(group => !group.some(idx => selectedCards.includes(idx))));
    setSelectedCards([]);
  };

  const handleAction = (action: string, payload?: any) => {
    socket.emit(`game:${action}`, { code, ...payload });
    setSelectedCards([]);
    
    // Cleanup groups after an action (since indices will change/cards will be gone)
    // For simplicity, we just clear groups when the hand is mutated by the server
    // (Handled in useEffect below)
  };

  useEffect(() => {
    // Clear groups ONLY if the cards are actually gone from the hand
    // and if there are groups to clear.
    if (me?.hand.length !== undefined && groups.length > 0) {
      const handIndices = me.hand.map((_: any, i: number) => i);
      const isValid = groups.every(g => g.every(idx => handIndices.includes(idx)));
      if (!isValid) {
        setGroups([]);
      }
    }
  }, [me?.hand.length, groups]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black space-y-6">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="text-zinc-500 uppercase tracking-widest text-sm">Synchronizing Table...</p>
        <button 
          onClick={() => router.push("/")}
          className="mt-8 flex items-center justify-center gap-2 px-6 py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
        >
          <Home size={14} />
          Go Back
        </button>
      </div>
    );
  }


  return (
    <main className="relative min-h-screen bg-zinc-950 flex flex-col items-center overflow-x-hidden">
      {/* Table Background */}
      <div className="fixed inset-0 felt-table z-0 opacity-40" />

      {/* Header Info - Responsive Sticky */}
      <div className="sticky top-0 z-40 w-full bg-zinc-950/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between p-4 px-6 gap-4">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                {/* Back Button */}
                <button 
                  onClick={() => router.push("/")}
                  className="p-1.5 md:p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 rounded-full transition-all active:scale-95 border border-transparent hover:border-red-500/50"
                  title="Leave Game"
                >
                  <Home size={14} />
                </button>

                <div className="h-6 w-[1px] bg-white/5 mx-0.5" />

                <div className="flex flex-col items-start gap-0.5">
                    <div className={`px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${!isMyTurn ? 'bg-blue-500 text-white border-blue-400 animate-pulse' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                        {opponent?.username || "Waiting..."}
                    </div>
                    <p className="text-[8px] text-zinc-600 px-1 uppercase tracking-tighter">Opponent</p>
                </div>

                <div className="h-6 w-[1px] bg-white/5 mx-1" />

                <div className="flex flex-col items-start gap-0.5">
                    <div className="bg-zinc-900 border border-zinc-800 px-3 py-0.5 rounded-md flex items-center gap-2">
                        <span className="text-zinc-600 text-[8px] uppercase tracking-widest">ID</span>
                        <span className="font-mono text-blue-500 font-bold text-[10px]">{code}</span>
                    </div>
                </div>
            </div>
            
            {/* Voice Controls - Single Row */}
            <div className="flex items-center gap-2">
                {!isVoiceJoined ? (
                    <button 
                        onClick={joinVoice}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 p-2 rounded-full transition-all flex items-center gap-2 px-4 shadow-lg active:scale-95"
                    >
                        <Mic size={14} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Join Voice</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={toggleMute}
                            className={`p-2 rounded-full transition-all shadow-lg active:scale-95 ${isMuted ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                        >
                            {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                        </button>
                        <button 
                            onClick={leaveVoice}
                            className="bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white p-2 rounded-full transition-all shadow-lg active:scale-95"
                        >
                            <X size={14} />
                        </button>
                        {remoteStream && (
                            <div className="flex items-center gap-1 ml-2">
                                <Volume2 size={12} className="text-blue-500 animate-pulse" />
                                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Live</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-col items-end gap-0 md:gap-1">
          <div className="text-blue-500/30 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">Draw Pile</div>
          <div className="text-xl md:text-2xl font-cinzel font-bold text-white leading-none">{gameState.drawPileCount}</div>
        </div>
      </div>

      {/* Game Table Area - Flex Managed */}
      <div className="z-10 flex-1 w-full flex flex-col items-center justify-center gap-6 md:gap-12 py-8 overflow-y-auto">
        {/* Opponent's Hand (Face down) */}
        <div className="relative rotate-180 scale-50 md:scale-75 opacity-80 h-16 md:h-auto">
          <Hand cards={[]} isOpponent handCount={opponent?.handCount || 0} />
        </div>

        {/* Board Melds */}
        <MeldZone 
          playerMelds={me?.melds || []} 
          opponentMelds={opponent?.melds || []}
          playerId={me?.id}
          opponentId={opponent?.id}
          onSapaw={(targetPlayerId, meldIndex) => {
             if (!isMyTurn) return;
             if (isDiscardPending) {
                // Pick up discard and sapaw
                handleAction("draw-discard", { sapawData: { targetPlayerId, meldIndex }, cardIndices: selectedCards });
                setIsDiscardPending(false);
             } else if (selectedCards.length > 0) {
                // Sapaw from hand
                handleAction("sapaw", { targetPlayerId, meldIndex, cardIndices: selectedCards });
             }
          }}
        />

        {/* Play Area: Draw & Discard Piles */}
        <div className="flex items-center gap-6 md:gap-16">
          {/* Deck Pile */}
          <div 
            className={`relative w-12 h-20 sm:w-16 sm:h-24 md:w-24 md:h-36 rounded-xl border-2 md:border-4 border-white/20 bg-zinc-900 cursor-pointer hover:border-blue-500 transition-colors ${(!isMyTurn || gameState.hasDrawn) ? 'pointer-events-none opacity-50' : ''}`}
            onClick={() => handleAction("draw-stock")}
          >
            <div className="absolute inset-0 bg-zinc-800 rounded-lg m-0.5 md:m-1 flex items-center justify-center">
                 <div className="text-zinc-600 font-cinzel text-[8px] md:text-xs font-bold -rotate-45">TONGITS</div>
            </div>
            {gameState.drawPileCount > 0 && (
                <div className="absolute -right-2 -top-2 w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] md:text-xs shadow-lg">
                    {gameState.drawPileCount}
                </div>
            )}
          </div>

          {/* Discard Pile */}
          <div 
            className={cn(
                "relative w-12 h-20 sm:w-16 sm:h-24 md:w-24 md:h-36 rounded-xl border-2 md:border-4 transition-all duration-300 flex items-center justify-center cursor-pointer",
                isDiscardPending ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110 z-30" : "border-dashed border-white/10 hover:border-blue-500/50",
                (!isMyTurn || gameState.hasDrawn) && !isDiscardPending ? "pointer-events-none opacity-30" : ""
            )}
            onClick={() => {
                if (selectedCards.length > 0) {
                    // Try to meld with discard
                    handleAction("draw-discard", { cardIndices: selectedCards });
                } else {
                    // Toggle pending discard for Sapaw
                    setIsDiscardPending(!isDiscardPending);
                }
            }}
          >
             {gameState.discardPile.length > 0 ? (
                 <Card {...gameState.discardPile[gameState.discardPile.length - 1]} className="w-full h-full" />
             ) : (
                 <span className="text-[10px] text-white/20 uppercase tracking-widest text-center px-1">Empty</span>
             )}
             {isDiscardPending && (
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-500 text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-full animate-bounce">
                    SELECT MELD TO SAPAW
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* Bottom Controls - Player Actions - Non-absolute container */}
      <div className="z-40 w-full bg-gradient-to-t from-black via-zinc-950/90 to-transparent pt-8 pb-4 flex flex-col items-center gap-4">
        
        {/* My Turn Banner - Relative to avoid piles */}
        <AnimatePresence>
            {isMyTurn && (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="px-6 py-1.5 bg-blue-500 text-slate-900 font-black rounded-full text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(59,130,246,0.4)] animate-pulse"
                >
                    Your Turn
                </motion.div>
            )}
        </AnimatePresence>

        {/* Action Buttons - Grid on mobile */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-2 md:gap-4 w-full max-w-2xl px-4 lg:px-0">
          <button 
            disabled={!isMyTurn || selectedCards.length < 3}
            onClick={() => handleAction("meld", { cardIndices: selectedCards })}
            className="px-4 py-2.5 bg-zinc-900 border border-blue-500/30 text-blue-500 rounded-xl disabled:opacity-30 disabled:grayscale uppercase text-[10px] font-bold tracking-widest hover:bg-blue-500 hover:text-white transition-all"
          >
            Meld
          </button>
          
          <button 
            disabled={!isMyTurn || selectedCards.length !== 1}
            onClick={() => handleAction("discard", { cardIndex: selectedCards[0] })}
            className="px-4 py-2.5 bg-red-950/30 border border-red-500/30 text-red-500 rounded-xl disabled:opacity-30 disabled:grayscale uppercase text-[10px] font-bold tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]"
          >
            Discard
          </button>

          <button 
            disabled={!isMyTurn || !me?.hasMelded}
            onClick={() => handleAction("call-draw")}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-xl disabled:opacity-30 disabled:grayscale uppercase text-[10px] font-black tracking-widest hover:scale-105 transition-all shadow-lg col-span-2 md:col-span-1"
          >
            Call Draw
          </button>

          <div className="w-[1px] h-8 bg-white/10 mx-2 self-center md:block hidden" />

          {/* Grouping Controls - Nested flex */}
          <div className="grid grid-cols-2 gap-2 col-span-2 md:flex">
            <button 
                disabled={selectedCards.length < 2}
                onClick={handleGroup}
                className="flex-1 md:flex-none px-4 py-2.5 bg-zinc-800 border border-white/5 text-zinc-400 rounded-xl disabled:opacity-20 uppercase text-[9px] font-bold tracking-widest hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2"
            >
                <Group size={12} />
                Group
            </button>
            <button 
                disabled={selectedCards.length === 0}
                onClick={handleUngroup}
                className="flex-1 md:flex-none px-4 py-2.5 bg-zinc-800 border border-white/5 text-zinc-400 rounded-xl disabled:opacity-20 uppercase text-[9px] font-bold tracking-widest hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2"
            >
                <Ungroup size={12} />
                Clear
            </button>
          </div>
        </div>

        {/* My Hand - Now in flow */}
        <div className="w-full relative pb-4">
            <div className="flex flex-col items-center mb-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none">Your Points</span>
                <span className="text-lg md:text-xl font-bold text-blue-500">{me?.points || 0}</span>
            </div>
          <Hand 
            cards={me?.hand || []} 
            selectedIndices={selectedCards} 
            onCardClick={toggleCardSelection}
            groups={groups}
          />
        </div>
      </div>

      {/* Challenge Pending Overlay */}
      <AnimatePresence>
        {gameState.status === "CHALLENGE_PENDING" && gameState.pendingChallenge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border-2 border-blue-500/50 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
            >
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-blue-500" size={32} />
              </div>

              <h2 className="text-2xl font-cinzel font-black text-white mb-2 uppercase tracking-widest">
                {gameState.pendingChallenge.callerId === socket.id ? "Draw Called!" : "Challenge Issued!"}
              </h2>
              
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                {gameState.pendingChallenge.callerId === socket.id 
                  ? "You have called a Draw. Waiting for your opponent to decide whether to Fold or Challenge your points."
                  : "Your opponent has called a Draw! You must now decide: Fold and lose the round, or Challenge their points to see who has the lowest hand."}
              </p>

              {gameState.pendingChallenge.callerId !== socket.id ? (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleAction("respond-challenge", { response: 'FOLD' })}
                    className="py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl uppercase text-xs font-black tracking-widest transition-all border border-white/5"
                  >
                    Fold
                  </button>
                  <button 
                    onClick={() => handleAction("respond-challenge", { response: 'CHALLENGE' })}
                    className="py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-xl uppercase text-xs font-black tracking-widest transition-all shadow-lg"
                  >
                    Challenge
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                  <span className="text-[10px] text-blue-500 uppercase font-black tracking-[0.2em] animate-pulse">
                    Waiting for Opponent...
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                className="bg-zinc-900 border-2 border-blue-500 p-12 rounded-[40px] shadow-[0_0_100px_rgba(59,130,246,0.3)] text-center max-w-lg w-full"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-blue-500 flex items-center justify-center rounded-full shadow-[0_0_40px_rgba(59,130,246,0.5)]">
                        <Trophy size={48} className="text-slate-900" />
                    </div>
                </div>
                
                <h2 className="font-cinzel text-5xl font-bold bg-gradient-to-b from-blue-200 to-blue-500 bg-clip-text text-transparent mb-2">
                    {gameState.winner?.id === socket.id ? "VICTORY!" : "DEFEAT"}
                </h2>
                
                <p className="text-zinc-500 uppercase tracking-widest text-sm mb-12">
                   Winner: <span className="text-blue-500 font-bold">{gameState.winner?.username}</span> via <span className="text-white">{gameState.roundReason}</span>
                </p>

                <div className="mb-8 space-y-2">
                    {gameState.players.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <span className={p.id === gameState.winner?.id ? "text-blue-500" : "text-zinc-500"}>
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
                    className="w-full btn-blue py-4 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={20} />
                    Play Again
                  </button>
                  <button 
                    onClick={() => router.push("/")}
                    className="w-full btn-outline-blue py-4 flex items-center justify-center gap-2"
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
      <audio ref={audioRef} autoPlay />
      <Chat roomCode={code as string} username={username || "Player"} />
    </main>
  );
}

