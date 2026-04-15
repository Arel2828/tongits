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
    <div className="flex flex-col gap-6 w-full max-w-4xl px-4">
      {/* Opponent's Melds */}
      <div className="flex flex-wrap justify-center gap-4 opacity-70 min-h-[80px] border-b-2 border-pink-100 pb-6">
        {opponentMelds.map((meld, mIdx) => (
          <div 
            key={`opp-meld-${mIdx}`} 
            className="flex -space-x-6 sm:-space-x-8 md:-space-x-10 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onSapaw?.(opponentId, mIdx)}
          >
            {meld.map((card, cIdx) => (
              <Card 
                key={`${card.suit}-${card.rank}-${cIdx}`} 
                {...card} 
                className="w-10 h-16 sm:w-14 sm:h-20 md:w-18 md:h-28"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Player's Melds */}
      <div className="flex flex-wrap justify-center gap-4 min-h-[80px]">
        {playerMelds.map((meld, mIdx) => (
          <div 
            key={`p-meld-${mIdx}`} 
            className="flex -space-x-6 sm:-space-x-8 md:-space-x-10 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onSapaw?.(playerId, mIdx)}
          >
            {meld.map((card, cIdx) => (
              <Card 
                key={`${card.suit}-${card.rank}-${cIdx}`} 
                {...card} 
                className="w-10 h-16 sm:w-14 sm:h-20 md:w-18 md:h-28"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}



