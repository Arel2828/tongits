"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PixelRankProps {
  rank: string;
  className?: string;
  color?: string;
}

// 5x7 Pixel Grid Mapping
const rankPixels: Record<string, string[]> = {
  "A": [
    " ### ",
    "#   #",
    "#   #",
    "#####",
    "#   #",
    "#   #",
    "#   #"
  ],
  "2": [
    "#####",
    "    #",
    "    #",
    "#####",
    "#    ",
    "#    ",
    "#####"
  ],
  "3": [
    "#####",
    "    #",
    "    #",
    "#####",
    "    #",
    "    #",
    "#####"
  ],
  "4": [
    "#   #",
    "#   #",
    "#   #",
    "#####",
    "    #",
    "    #",
    "    #"
  ],
  "5": [
    "#####",
    "#    ",
    "#    ",
    "#####",
    "    #",
    "    #",
    "#####"
  ],
  "6": [
    "#####",
    "#    ",
    "#    ",
    "#####",
    "#   #",
    "#   #",
    "#####"
  ],
  "7": [
    "#####",
    "    #",
    "    #",
    "    #",
    "    #",
    "    #",
    "    #"
  ],
  "8": [
    "#####",
    "#   #",
    "#   #",
    "#####",
    "#   #",
    "#   #",
    "#####"
  ],
  "9": [
    "#####",
    "#   #",
    "#   #",
    "#####",
    "    #",
    "    #",
    "#####"
  ],
  "10": [
    "# ###",
    "# # #",
    "# # #",
    "# # #",
    "# # #",
    "# # #",
    "# ###"
  ],
  "J": [
    "#####",
    "    #",
    "    #",
    "    #",
    "#   #",
    "#   #",
    " ### "
  ],
  "Q": [
    " ### ",
    "#   #",
    "#   #",
    "#   #",
    "# # #",
    "#  ##",
    " ####"
  ],
  "K": [
    "#   #",
    "#  # ",
    "# #  ",
    "##   ",
    "# #  ",
    "#  # ",
    "#   #"
  ]
};

export default function PixelRank({ rank, className, color }: PixelRankProps) {
  const pixels = rankPixels[rank] || rankPixels["A"];

  return (
    <div className={cn("grid grid-cols-5 gap-[1px]", className)}>
      {pixels.map((row, y) => (
        row.split("").map((pixel, x) => (
          <div
            key={`${x}-${y}`}
            className={cn(
              "w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] md:w-[4px] md:h-[4px]",
              pixel === "#" ? (color || "bg-black") : "bg-transparent"
            )}
          />
        ))
      ))}
    </div>
  );
}
