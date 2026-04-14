"use client";

import { motion, AnimatePresence, Reorder } from "framer-motion";
import Card from "./Card";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HandProps {
  cards: any[];
  isOpponent?: boolean;
  selectedIndices?: number[];
  onCardClick?: (index: number) => void;
  handCount?: number;
  onReorder?: (newOrder: any[]) => void;
  groups?: number[][];
}

export default function Hand({
  cards,
  isOpponent = false,
  selectedIndices = [],
  onCardClick,
  handCount = 0,
  onReorder,
  groups = [],
}: HandProps) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const cardsWithIndices = cards.map((card, idx) => ({ ...card, originalIndex: idx }));
    let newItems = [...cardsWithIndices];
    
    if (groups.length > 0) {
      const groupedCards = groups.flat().map(idx => cardsWithIndices[idx]).filter(Boolean);
      const nonGroupedCards = cardsWithIndices.filter(c => !groupedCards.includes(c));
      
      const sortedGroups = [];
      for (const groupIndices of groups) {
        sortedGroups.push(...groupIndices.map(idx => cardsWithIndices[idx]).filter(Boolean));
      }
      
      newItems = [...sortedGroups, ...nonGroupedCards];
    }
    
    setItems(prev => {
      if (prev.length !== newItems.length) return newItems;
      const isSame = prev.every((item, idx) => 
        item.suit === newItems[idx]?.suit && 
        item.rank === newItems[idx]?.rank &&
        item.originalIndex === newItems[idx]?.originalIndex
      );
      return isSame ? prev : newItems;
    });
  }, [cards, groups]);

  const handleReorder = (newOrder: any[]) => {
    let fixedOrder = [...newOrder];
    
    groups.forEach(groupIndices => {
      const groupCards = fixedOrder.filter(c => groupIndices.includes(c.originalIndex));
      const groupCurrentPositions = groupCards.map(c => fixedOrder.indexOf(c)).sort((a, b) => a - b);
      const isContiguous = groupCurrentPositions.every((pos, i) => i === 0 || pos === groupCurrentPositions[i-1] + 1);
      
      if (!isContiguous) {
        const avgPos = Math.round(groupCurrentPositions.reduce((a, b) => a + b, 0) / groupCurrentPositions.length);
        const remaining = fixedOrder.filter(c => !groupCards.includes(c));
        const insertIdx = Math.max(0, Math.min(avgPos - Math.floor(groupCards.length / 2), remaining.length));
        remaining.splice(insertIdx, 0, ...groupCards);
        fixedOrder = remaining;
      }
    });

    setItems(fixedOrder);
    onReorder?.(fixedOrder);
  };

  const displayCards = isOpponent ? Array.from({ length: handCount }) : items;

  const getGroupColor = (originalIndex: number) => {
    const groupIdx = groups.findIndex(g => g.includes(originalIndex));
    if (groupIdx === -1) return null;
    const colors = ["bg-pink-500/40", "bg-pink-400/40", "bg-fuchsia-500/40", "bg-pink-300/40"];
    return colors[groupIdx % colors.length];
  };

  const isInSameGroupAsNext = (idx: number) => {
    if (idx >= items.length - 1) return false;
    const currentOrigIdx = items[idx].originalIndex;
    const nextOrigIdx = items[idx+1].originalIndex;
    return groups.some(g => g.includes(currentOrigIdx) && g.includes(nextOrigIdx));
  };

  if (isOpponent) {
    return (
      <div className="flex justify-center -space-x-8 sm:-space-x-10 md:-space-x-14 p-4 max-w-full">
        <AnimatePresence>
          {displayCards.map((card, index) => (
            <motion.div
              key={`opp-${index}`}
              initial={{ y: 50, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1, rotate: (index - (displayCards.length - 1) / 2) * -3 }}
              exit={{ y: -100, opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative"
              style={{ zIndex: index }}
            >
              <Card suit="S" rank="A" isFaceUp={false} className="w-10 h-16 sm:w-14 sm:h-20 md:w-18 md:h-28" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Reorder.Group 
      axis="x" 
      values={items} 
      onReorder={handleReorder}
      className="flex justify-center -space-x-6 sm:-space-x-8 md:-space-x-12 p-4 cursor-grab active:cursor-grabbing max-w-full"
    >
      <AnimatePresence>
        {items.map((card, index) => {
          const originalIndex = card.originalIndex;
          const groupColor = getGroupColor(originalIndex);
          const hasNextTie = isInSameGroupAsNext(index);
          
          const selectionIdx = selectedIndices.indexOf(originalIndex);
          const isSelected = selectionIdx !== -1;
          const zIndex = isSelected ? (1000 - selectionIdx) : index;
          
          return (
            <Reorder.Item
              key={`${card.suit}-${card.rank}-${originalIndex}`}
              value={card}
              initial={{ y: 50, opacity: 0, scale: 0.8 }}
              animate={{ 
                y: 0, 
                opacity: 1, 
                scale: 1,
                rotate: (index - (items.length - 1) / 2) * 2
              }}
              exit={{ y: -100, opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative"
              style={{ zIndex }}
            >
              {groupColor && (
                <div className={cn(
                  "absolute -inset-1 rounded-none border border-black shadow-[4px_4px_0_0_#ff1493] -z-10",
                  groupColor
                )} />
              )}
              
              {hasNextTie && (
                <div className={cn(
                  "absolute top-1/2 -right-6 w-12 h-4 -translate-y-1/2 -z-20"
                )}>
                  <svg className="w-full h-full" viewBox="0 0 40 10">
                    <path 
                      d="M0,5 L40,5" 
                      fill="none" 
                      stroke="#ff1493" 
                      strokeWidth="2" 
                      strokeDasharray="2 2"
                      className="opacity-60"
                    />
                  </svg>
                </div>
              )}

              <Card
                suit={card.suit}
                rank={card.rank}
                isFaceUp={true}
                isSelected={selectedIndices.includes(originalIndex)}
                onClick={() => onCardClick?.(originalIndex)}
                className="w-12 h-20 sm:w-16 sm:h-24 md:w-24 md:h-36"
              />
            </Reorder.Item>
          );
        })}
      </AnimatePresence>
    </Reorder.Group>
  );
}



