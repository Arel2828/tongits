"use client";

import { motion, AnimatePresence } from "framer-motion";
import Card from "./Card";

interface HandProps {
  cards: any[];
  isOpponent?: boolean;
  selectedIndices?: number[];
  onCardClick?: (index: number) => void;
  handCount?: number;
}

export default function Hand({
  cards,
  isOpponent = false,
  selectedIndices = [],
  onCardClick,
  handCount = 0,
}: HandProps) {
  const displayCards = isOpponent ? Array.from({ length: handCount }) : cards;

  return (
    <div className="flex justify-center -space-x-8 md:-space-x-12 p-8">
      <AnimatePresence>
        {displayCards.map((card, index) => (
          <motion.div
            key={isOpponent ? `opp-${index}` : `${card.suit}-${card.rank}-${index}`}
            initial={{ y: 50, opacity: 0, scale: 0.8 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1,
              rotate: (index - (displayCards.length - 1) / 2) * (isOpponent ? -2 : 2)
            }}
            exit={{ y: -100, opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative"
            style={{ zIndex: index }}
          >
            <Card
              suit={card?.suit || "S"}
              rank={card?.rank || "A"}
              isFaceUp={!isOpponent}
              isSelected={selectedIndices.includes(index)}
              onClick={() => onCardClick?.(index)}
              className={isOpponent ? "w-16 h-24 md:w-20 md:h-30" : "w-16 h-24 md:w-24 md:h-36"}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
