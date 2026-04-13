"use client";

import Card from "./Card";

interface MeldZoneProps {
  playerMelds: any[][];
  opponentMelds: any[][];
  onSapaw?: (targetPlayerId: string, meldIndex: number) => void;
  playerId: string;
  opponentId: string;
}

export default function MeldZone({
  playerMelds,
  opponentMelds,
  onSapaw,
  playerId,
  opponentId,
}: MeldZoneProps) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl px-4">
      {/* Opponent's Melds */}
      <div className="flex flex-wrap justify-center gap-6 opacity-80 min-h-[100px] border-b border-white/10 pb-4">
        {opponentMelds.map((meld, mIdx) => (
          <div 
            key={`opp-meld-${mIdx}`} 
            className="flex -space-x-6 sm:-space-x-8 md:-space-x-12 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onSapaw?.(opponentId, mIdx)}
          >
            {meld.map((card, cIdx) => (
              <Card 
                key={`${card.suit}-${card.rank}-${cIdx}`} 
                {...card} 
                className="w-12 h-20 sm:w-16 sm:h-24 md:w-20 md:h-32 border-zinc-300"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Player's Melds */}
      <div className="flex flex-wrap justify-center gap-6 min-h-[100px]">
        {playerMelds.map((meld, mIdx) => (
          <div 
            key={`p-meld-${mIdx}`} 
            className="flex -space-x-6 sm:-space-x-8 md:-space-x-12 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onSapaw?.(playerId, mIdx)}
          >
            {meld.map((card, cIdx) => (
              <Card 
                key={`${card.suit}-${card.rank}-${cIdx}`} 
                {...card} 
                className="w-12 h-20 sm:w-16 sm:h-24 md:w-20 md:h-32 border-zinc-100 shadow-blue-400/20"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}


