"use client";

import { motion } from "framer-motion";
import { Spade, Heart, Diamond, Club } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import RankFive from "./RankFive";

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
  S: "text-black",
  H: "text-pink-600",
  D: "text-pink-400",
  C: "text-black",
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
          "relative w-24 h-36 border-2 border-black shadow-lg overflow-hidden cursor-pointer bg-pink-600",
          "pixel-border-sm",
          className
        )}
      >
        <div className="absolute inset-0 bg-pink-500/10 flex items-center justify-center">
            {/* Card back pattern - Pixel Grid */}
          <div className="w-full h-full p-2 grid grid-cols-4 gap-1 opacity-20">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-white" />
            ))}
          </div>
          <div className="absolute inset-2 border-2 border-white/20 flex items-center justify-center">
             <div className="text-white/40 font-press-start text-[6px] md:text-[8px] font-bold -rotate-45 leading-none">TONGITS</div>
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
        "relative w-12 h-20 sm:w-16 sm:h-24 md:w-24 md:h-36 bg-white flex flex-col p-1 sm:p-2 cursor-pointer select-none transition-all border-2 border-black",
        isSelected && "scale-110 -translate-y-4 sm:-translate-y-6 shadow-[0_0_30px_#ff1493] ring-4 ring-pink-500 z-50",
        className
      )}
    >
      <div className={cn("flex flex-col items-start leading-none", colorClass)}>
        {rank === "5" ? (
          <RankFive className="mb-1" />
        ) : (
          <span className="text-xs sm:text-sm md:text-xl font-bold font-pixelify">{rank}</span>
        )}
        {Icon && <Icon className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4" fill="currentColor" />}
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {Icon && <Icon className={cn("w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 opacity-5", colorClass)} fill="currentColor" />}
        <div className={cn("absolute inset-0 flex items-center justify-center", colorClass)}>
             {Icon && <Icon className="w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10" fill="currentColor" />}
        </div>
      </div>

      <div className={cn("flex flex-col items-start leading-none rotate-180 self-end", colorClass)}>
        {rank === "5" ? (
          <RankFive className="mb-1" />
        ) : (
          <span className="text-xs sm:text-sm md:text-xl font-bold font-pixelify">{rank}</span>
        )}
        {Icon && <Icon className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4" fill="currentColor" />}
      </div>
    </motion.div>
  );
}



