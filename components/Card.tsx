"use client";

import { motion } from "framer-motion";
import { Spade, Heart, Diamond, Club } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  suit: string;
  rank: string;
  isFaceUp?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  animationProps?: any;
}

const suitIcons: any = {
  S: Spade,
  H: Heart,
  D: Diamond,
  C: Club,
};

const suitColors: any = {
  S: "text-zinc-900",
  H: "text-red-600",
  D: "text-blue-600",
  C: "text-zinc-900",
};

export default function Card({
  suit,
  rank,
  isFaceUp = true,
  isSelected = false,
  onClick,
  className,
  animationProps,
}: CardProps) {
  const Icon = suitIcons[suit];
  const colorClass = suitColors[suit];

  if (!isFaceUp) {
    return (
      <motion.div
        {...animationProps}
        onClick={onClick}
        className={cn(
          "relative w-24 h-36 rounded-xl border-4 border-white shadow-xl overflow-hidden cursor-pointer bg-zinc-900",
          className
        )}
      >
        <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
            {/* Card back pattern */}
          <div className="w-full h-full p-2 grid grid-cols-4 gap-1 opacity-20">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-white" />
            ))}
          </div>
          <div className="absolute inset-4 border-2 border-zinc-700 rounded-lg flex items-center justify-center">
             <div className="text-zinc-600 font-cinzel text-xs font-bold -rotate-45">TONGITS</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...animationProps}
      onClick={onClick}
      className={cn(
        "relative w-24 h-36 bg-white rounded-xl border-2 border-zinc-200 shadow-xl flex flex-col p-2 cursor-pointer select-none transition-all",
        isSelected && "scale-110 -translate-y-6 ring-4 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.6)] z-50",
        className
      )}
    >
      <div className={cn("flex flex-col items-start leading-none", colorClass)}>
        <span className="text-lg font-bold">{rank}</span>
        {Icon && <Icon size={14} fill="currentColor" />}
      </div>

      <div className="flex-1 flex items-center justify-center">
        {Icon && <Icon size={40} className={colorClass} fill="currentColor" opacity={0.1} />}
        <div className={cn("absolute inset-0 flex items-center justify-center", colorClass)}>
             {Icon && <Icon size={32} fill="currentColor" />}
        </div>
      </div>

      <div className={cn("flex flex-col items-start leading-none rotate-180 self-end", colorClass)}>
        <span className="text-lg font-bold">{rank}</span>
        {Icon && <Icon size={14} fill="currentColor" />}
      </div>
    </motion.div>
  );
}
