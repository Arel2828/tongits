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
          <div className="w-full h-full p-1 sm:p-2 grid grid-cols-4 gap-1 opacity-20">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-white" />
            ))}
          </div>
          <div className="absolute inset-2 sm:inset-4 border-2 border-zinc-700 rounded-lg flex items-center justify-center">
             <div className="text-zinc-600 font-cinzel text-[8px] md:text-xs font-bold -rotate-45 leading-none">TONGITS</div>
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
        "relative w-12 h-20 sm:w-16 sm:h-24 md:w-24 md:h-36 bg-white rounded flex flex-col p-1 sm:p-2 cursor-pointer select-none transition-all shadow-md sm:shadow-xl border-2 border-zinc-200",
        isSelected && "scale-110 -translate-y-4 sm:-translate-y-6 ring-2 sm:ring-4 ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] sm:shadow-[0_0_30px_rgba(59,130,246,0.6)] z-50",
        className
      )}
    >
      <div className={cn("flex flex-col items-start leading-none", colorClass)}>
        <span className="text-xs sm:text-sm md:text-lg font-bold">{rank}</span>
        {Icon && <Icon className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4" fill="currentColor" />}
      </div>

      <div className="flex-1 flex items-center justify-center">
        {Icon && <Icon className={cn("w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 opacity-10", colorClass)} fill="currentColor" />}
        <div className={cn("absolute inset-0 flex items-center justify-center", colorClass)}>
             {Icon && <Icon className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" fill="currentColor" />}
        </div>
      </div>

      <div className={cn("flex flex-col items-start leading-none rotate-180 self-end", colorClass)}>
        <span className="text-xs sm:text-sm md:text-lg font-bold">{rank}</span>
        {Icon && <Icon className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4" fill="currentColor" />}
      </div>
    </motion.div>
  );
}


