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
import { Loader2, Trophy, AlertCircle, RotateCcw, Home, Mic, MicOff, Volume2, X, Group, Ungroup, Copy, Check, Music, Music2, ArrowDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BGM_PLAYLIST = [
  "/mp3/Roulette Voltage.mp3",
  "/mp3/Roulette Voltage (1).mp3",
  "/mp3/Spade Static.mp3"
];

export default function GameRoom() {
  const { code } = useParams();
  const { gameState, setGameState, username } = useGameStore();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [groups, setGroups] = useState<number[][]>([]);
  const [isDiscardPending, setIsDiscardPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const router = useRouter();
  const socket = getSocket();
  const audioRef = useRef<HTMLAudioElement>(null);
  const bgmRef = useRef<HTMLAudioElement>(null);
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
    if (bgmRef.current && !isMusicMuted) {
        bgmRef.current.play().catch(() => {
            console.log("Autoplay waiting for interaction");
        });
    }
  }, [currentTrackIndex, isMusicMuted]);

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
    const group = groups.find(g => g.includes(index));
    
    if (group) {
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
      const cleanedGroups = prev
        .map(group => group.filter(idx => !selectedCards.includes(idx)))
        .filter(group => group.length > 1);
      
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
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(code as string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-6 font-pixelify">
        <Loader2 className="animate-spin text-pink-500" size={48} />
        <p className="text-pink-600 uppercase tracking-widest text-xs font-press-start">SYNCING PIXELS...</p>
        <button 
          onClick={() => router.push("/")}
          className="mt-8 flex items-center justify-center gap-2 px-6 py-3 border-2 border-pink-200 text-pink-400 hover:text-pink-600 hover:bg-pink-50 rounded-none text-[10px] font-press-start uppercase tracking-widest transition-all"
        >
          <Home size={14} />
          Abort
        </button>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-x-hidden font-pixelify select-none transition-colors duration-500">
      {/* Table Background */}
      <div className="fixed inset-0 felt-table z-0 opacity-80" />

      {/* Header Info */}
      <div className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b-2 border-pink-100 flex items-center justify-between p-4 px-6 gap-4">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push("/")}
                  className="p-2 bg-pink-50 hover:bg-red-50 text-pink-400 hover:text-red-500 border border-pink-100 transition-all active:scale-95"
                  title="Leave Table"
                >
                  <Home size={16} />
                </button>

                <div className="h-8 w-[1px] bg-pink-100 mx-0.5" />

                <div className="flex flex-col items-start gap-0.5">
                    <div className={cn(
                        "px-3 py-1 text-[8px] font-press-start uppercase tracking-widest border-2",
                        !isMyTurn ? 'bg-pink-500 text-white border-pink-400 animate-pulse' : 'bg-pink-50 text-pink-200 border-pink-100'
                    )}>
                        {opponent?.username || "Waiting..."}
                    </div>
                </div>

                <button 
                    onClick={handleCopyId}
                    className="hidden sm:flex bg-pink-50/50 border-2 border-pink-100 px-3 py-1 items-center gap-2 hover:bg-pink-100 transition-all active:scale-95 group"
                >
                    <span className="text-pink-200 text-[8px] uppercase font-press-start group-hover:text-pink-500">
                        {copied ? "COPIED" : "ID"}
                    </span>
                    <span className="font-press-start text-pink-500 text-[8px]">{code}</span>
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-pink-300 group-hover:text-pink-600" />}
                </button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button 
                    onClick={handleCopyId}
                    className="flex sm:hidden bg-pink-50/50 border-2 border-pink-100 px-3 py-2 items-center gap-2 hover:bg-pink-100 transition-all active:scale-95 group h-[38px]"
                >
                    <span className="text-pink-200 text-[8px] uppercase font-press-start">
                        {copied ? "COPIED" : "ID"}
                    </span>
                    <span className="font-press-start text-pink-500 text-[8px]">{code}</span>
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-pink-300" />}
                </button>
                {!isVoiceJoined ? (
                    <button 
                        onClick={joinVoice}
                        className="bg-pink-50 hover:bg-pink-100 text-pink-500 p-2 border-2 border-pink-100 transition-all flex items-center gap-2 px-4 active:scale-95"
                    >
                        <Mic size={12} />
                        <span className="text-[8px] uppercase font-press-start">Voice</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={toggleMute}
                            className={cn("p-2 border-2 transition-all active:scale-95", isMuted ? 'bg-red-500 border-red-400 text-white' : 'bg-pink-500 border-pink-400 text-white')}
                        >
                            {isMuted ? <MicOff size={12} /> : <Mic size={12} />}
                        </button>
                        <button 
                            onClick={leaveVoice}
                            className="bg-white border-2 border-pink-200 text-pink-200 hover:text-red-500 hover:bg-red-50 p-2 transition-all active:scale-95"
                        >
                            <X size={12} />
                        </button>
                        {remoteStream && (
                            <div className="flex items-center gap-1 ml-2">
                                <Volume2 size={10} className="text-pink-500 animate-pulse" />
                                <span className="text-[8px] text-pink-500 font-press-start uppercase">Live</span>
                            </div>
                        )}
                    </div>
                )}
                
                <button 
                    onClick={() => setIsMusicMuted(!isMusicMuted)}
                    className={cn(
                        "bg-pink-50 hover:bg-pink-100 p-2 border-2 border-pink-100 transition-all flex items-center gap-2 px-4 active:scale-95 group",
                        isMusicMuted ? "text-pink-200" : "text-pink-500"
                    )}
                >
                    {isMusicMuted ? <Music2 size={12} className="opacity-40" /> : <Music size={12} className="animate-pulse" />}
                    <span className="text-[8px] uppercase font-press-start">{isMusicMuted ? "Off" : "On"}</span>
                </button>
            </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-pink-300 text-[8px] font-press-start uppercase leading-none">Deck</div>
          <div className="text-2xl font-press-start text-pink-600 leading-none text-glow">{gameState.drawPileCount}</div>
        </div>
      </div>

      {/* Game Table Area */}
      <div className="z-10 flex-1 w-full flex flex-col items-center justify-center gap-6 py-8 overflow-y-auto">
        <div className="relative rotate-180 scale-[0.6] sm:scale-75 opacity-70">
          <Hand cards={[]} isOpponent handCount={opponent?.handCount || 0} />
        </div>

        <MeldZone 
          playerMelds={me?.melds || []} 
          opponentMelds={opponent?.melds || []}
          playerId={me?.id}
          opponentId={opponent?.id}
          onSapaw={(targetPlayerId, meldIndex) => {
             if (!isMyTurn) return;
             if (isDiscardPending) {
                handleAction("draw-discard", { sapawData: { targetPlayerId, meldIndex }, cardIndices: selectedCards });
                setIsDiscardPending(false);
             } else if (selectedCards.length > 0) {
                handleAction("sapaw", { targetPlayerId, meldIndex, cardIndices: selectedCards });
             }
          }}
        />

        {/* Center Play Area */}
        <div className="flex items-center gap-8 md:gap-20">
          {/* Deck Pile */}
          <div 
            className={cn(
                "relative w-14 h-22 sm:w-16 sm:h-24 md:w-24 md:h-36 border-4 border-black pixel-border-sm bg-white cursor-pointer transition-all",
                (!isMyTurn || gameState.hasDrawn) ? 'pointer-events-none opacity-40' : 'hover:scale-105 hover:shadow-[0_0_20px_#ff1493]'
            )}
            onClick={() => handleAction("draw-stock")}
          >
            <div className="absolute inset-0 bg-pink-50 flex items-center justify-center overflow-hidden">
                 <div className="text-pink-600/10 font-press-start text-[6px] md:text-[10px] -rotate-45 whitespace-nowrap">ELITE PIXEL</div>
            </div>
            {gameState.drawPileCount > 0 && (
                <div className="absolute -right-3 -top-3 w-8 h-8 md:w-10 md:h-10 bg-pink-600 border-2 border-black flex items-center justify-center text-white font-press-start text-[8px] md:text-[10px] shadow-lg">
                    {gameState.drawPileCount}
                </div>
            )}
            
            {/* Draw Indicator Arrow */}
            <AnimatePresence>
                {isMyTurn && !gameState.hasDrawn && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-30"
                    >
                        <span className="text-[8px] font-press-start text-pink-500 animate-pulse whitespace-nowrap bg-white/80 px-2 py-1 pixel-border-sm">PICK A CARD</span>
                        <ArrowDown className="text-pink-500 animate-bounce" size={24} />
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* Discard Pile */}
          <div 
            className={cn(
                "relative w-14 h-22 sm:w-16 sm:h-24 md:w-24 md:h-36 border-4 border-black transition-all flex items-center justify-center cursor-pointer",
                isDiscardPending ? "bg-pink-100 shadow-[0_0_30px_#ff1493] scale-110 z-30" : "bg-white/30 border-dashed border-pink-200 hover:border-pink-500",
                (!isMyTurn || gameState.hasDrawn) && !isDiscardPending ? "pointer-events-none opacity-30" : ""
            )}
            onClick={() => {
                if (selectedCards.length > 0) {
                    handleAction("draw-discard", { cardIndices: selectedCards });
                } else {
                    setIsDiscardPending(!isDiscardPending);
                }
            }}
          >
             {gameState.discardPile.length > 0 ? (
                 <Card {...gameState.discardPile[gameState.discardPile.length - 1]} className="w-full h-full" />
             ) : (
                 <span className="text-[8px] font-press-start text-pink-200 uppercase">EMPTY</span>
             )}
             {isDiscardPending && (
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-pink-600 text-white text-[10px] font-press-start px-4 py-2 pixel-border-sm animate-bounce">
                    PICK SAPAW
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="z-40 w-full bg-gradient-to-t from-white via-white/80 to-transparent pt-8 pb-4 flex flex-col items-center gap-6">
        
        <AnimatePresence>
            {isMyTurn && (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -10 }}
                    className="px-6 py-3 bg-pink-500 text-white font-press-start text-[10px] uppercase tracking-widest shadow-[4px_4px_0_0_#4A0030] animate-bounce pixel-border-sm"
                >
                    YOUR TURN
                </motion.div>
            )}
        </AnimatePresence>

        {/* UI FIX: Enhanced Mobile Button Grid */}
        <div className="w-full max-w-xl px-4 grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 md:gap-4">
          <button 
            disabled={!isMyTurn || !gameState.hasDrawn || selectedCards.length < 3}
            onClick={() => handleAction("meld", { cardIndices: selectedCards })}
            className="flex-1 min-h-[50px] bg-white border-4 border-black text-pink-600 font-press-start text-[10px] uppercase hover:bg-pink-600 hover:text-white disabled:opacity-30 disabled:grayscale transition-all active:scale-95 shadow-[4px_4px_0_0_rgba(255,20,147,0.2)]"
          >
            Meld
          </button>
          
          <button 
            disabled={!isMyTurn || !gameState.hasDrawn || selectedCards.length !== 1}
            onClick={() => handleAction("discard", { cardIndex: selectedCards[0] })}
            className="flex-1 min-h-[50px] bg-white border-4 border-black text-red-600 font-press-start text-[10px] uppercase hover:bg-red-600 hover:text-white disabled:opacity-30 disabled:grayscale transition-all active:scale-95 shadow-[4px_4px_0_0_rgba(255,0,0,0.1)]"
          >
            Discard
          </button>

          <button 
            disabled={!isMyTurn || !me?.canCallDraw}
            onClick={() => handleAction("call-draw")}
            className={cn(
                "col-span-2 sm:flex-1 min-h-[50px] bg-pink-600 text-white border-4 border-black font-press-start text-[10px] uppercase shadow-[4px_4px_0_0_#4A0030] disabled:opacity-30 disabled:grayscale transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#4A0030] active:translate-y-[2px] active:shadow-none",
                me?.sapawLock && "relative overflow-hidden"
            )}
          >
            {me?.sapawLock ? "Locked" : "Call Draw"}
            {me?.sapawLock && (
                <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
                    <div className="text-[6px] rotate-12 border border-red-500 px-1 text-red-500 font-bold">SAPAWED</div>
                </div>
            )}
          </button>

          <div className="hidden sm:block w-[4px] h-10 bg-pink-100 mx-2 self-center" />

          {/* Grouping Controls */}
          <div className="col-span-2 grid grid-cols-2 gap-3 sm:flex">
            <button 
                disabled={selectedCards.length < 2}
                onClick={handleGroup}
                className="flex items-center justify-center gap-2 min-h-[50px] sm:px-6 bg-white border-4 border-black text-pink-500 font-press-start text-[8px] uppercase hover:bg-pink-50 disabled:opacity-30 transition-all active:scale-95 shadow-[4px_4px_0_0_rgba(255,20,147,0.1)]"
            >
                <Group size={14} />
                Group
            </button>
            <button 
                disabled={selectedCards.length === 0}
                onClick={handleUngroup}
                className="flex items-center justify-center gap-2 min-h-[50px] sm:px-6 bg-white border-4 border-black text-pink-500 font-press-start text-[8px] uppercase hover:bg-pink-50 disabled:opacity-30 transition-all active:scale-95 shadow-[4px_4px_0_0_rgba(255,20,147,0.1)]"
            >
                <Ungroup size={14} />
                Clear
            </button>
          </div>
        </div>

        {/* Player Stats & Hand */}
        <div className="w-full relative pb-6">
            <div className="flex flex-col items-center mb-4">
                <span className="text-[8px] text-pink-300 font-press-start uppercase tracking-widest leading-none mb-1">Total Points</span>
                <span className="text-2xl font-press-start text-pink-600 text-glow">{me?.points || 0}</span>
            </div>
          <Hand 
            cards={me?.hand || []} 
            selectedIndices={selectedCards} 
            onCardClick={toggleCardSelection}
            groups={groups}
          />
        </div>
      </div>

      {/* Overlays (Challenge, Game Over, etc.) */}
      <AnimatePresence>
        {gameState.status === "CHALLENGE_PENDING" && gameState.pendingChallenge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="bg-white border-4 border-black pixel-border p-8 max-w-md w-full text-center">
              <div className="w-20 h-20 bg-pink-50 border-2 border-pink-200 flex items-center justify-center mx-auto mb-8 pixel-border-sm">
                <AlertCircle className="text-pink-500" size={40} />
              </div>

              <h2 className="text-xl font-press-start text-pink-900 mb-4 uppercase leading-relaxed">
                {gameState.pendingChallenge.callerId === socket.id ? "WAITING FOR FOLD..." : "THREAT DETECTED!"}
              </h2>
              
              <p className="text-pink-400 font-pixelify text-sm mb-10 leading-relaxed">
                {gameState.pendingChallenge.callerId === socket.id 
                  ? "You called a Draw. The opponent must now decide: Fold or Challenge."
                  : "Your opponent called a Draw! Do you FOLD and accept defeat, or CHALLENGE the point count?"}
              </p>

              {gameState.pendingChallenge.callerId !== socket.id ? (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleAction("respond-challenge", { response: 'FOLD' })}
                    className="py-4 bg-black border-2 border-pink-900 text-pink-900 font-press-start text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all"
                  >
                    Fold
                  </button>
                  <button 
                    onClick={() => handleAction("respond-challenge", { response: 'CHALLENGE' })}
                    className="py-4 bg-pink-600 text-white font-press-start text-[10px] uppercase shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    Challenge
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <Loader2 className="animate-spin text-pink-500" size={32} />
                  <span className="text-[10px] text-pink-500 font-press-start animate-pixel-float">
                    WAITING FOR REPLY...
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Screen */}
      <AnimatePresence>
        {gameState.status === "ENDED" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[70] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-8 overflow-y-auto"
          >
            <motion.div 
                initial={{ scale: 0.5, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white border-4 border-black text-center max-w-lg w-full p-8 sm:p-12 shadow-[0_20px_60px_rgba(255,20,147,0.3)] pixel-border"
            >
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 bg-pink-600 border-4 border-black flex items-center justify-center pixel-border-sm">
                        <Trophy size={48} className="text-black" />
                    </div>
                </div>
                
                <h2 className="font-press-start text-3xl sm:text-4xl text-pink-900 mb-4 text-glow">
                    {gameState.winner?.id === socket.id ? "VICTORY" : "GAME OVER"}
                </h2>
                
                <p className="text-pink-400 font-press-start text-[10px] sm:text-xs mb-12">
                   Winner: <span className="text-pink-600 underline">{gameState.winner?.username}</span> via {gameState.roundReason}
                </p>

                <div className="mb-10 space-y-3">
                    {gameState.players.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center bg-pink-50/50 p-4 border-2 border-pink-100">
                            <div className="flex items-center gap-3">
                                <span className={cn("font-press-start text-[12px]", p.id === gameState.winner?.id ? "text-pink-600" : "text-pink-200")}>
                                    {p.username}
                                </span>
                                {p.isBurned && (
                                    <span className="bg-red-500 text-white text-[8px] font-press-start px-2 py-1 pixel-border-sm animate-pulse">BURNED</span>
                                )}
                            </div>
                            <span className="font-press-start text-pink-600 text-sm">{p.points} <span className="text-[8px] text-pink-300 uppercase">pts</span></span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleAction("rematch")}
                    className="btn-pink py-4 flex items-center justify-center gap-3"
                  >
                    <RotateCcw size={18} />
                    Rematch
                  </button>
                  <button 
                    onClick={() => router.push("/")}
                    className="btn-outline-pink py-4 flex items-center justify-center gap-3"
                  >
                    <Home size={18} />
                    Exit
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
            className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center p-8 text-center"
          >
            <div className="bg-white border-2 border-red-500 p-8 max-w-sm pixel-border-sm" style={{ "--pixel-border-color": "#dc2626" } as any}>
                <AlertCircle className="text-red-500 mx-auto mb-6 animate-pulse" size={48} />
                <h3 className="text-lg font-press-start text-red-900 mb-4">OPPONENT OFFLINE</h3>
                <p className="text-red-400 font-pixelify text-sm mb-8">Synchronizing... Automatic timeout in 60s</p>
                <div className="w-full bg-red-50 h-2 border border-black overflow-hidden mb-2">
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
      <audio 
        ref={bgmRef} 
        src={BGM_PLAYLIST[currentTrackIndex]} 
        autoPlay 
        muted={isMusicMuted}
        onEnded={() => {
            setCurrentTrackIndex((prev) => (prev + 1) % BGM_PLAYLIST.length);
        }}
      />
      <Chat roomCode={code as string} username={username || "Player"} />
    </main>
  );
}


