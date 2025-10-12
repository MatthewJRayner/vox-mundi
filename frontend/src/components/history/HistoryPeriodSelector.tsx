"use client";

import { Period } from "@/types/culture";

interface PeriodSelectorProps {
  periods: Period[];
  activePeriod: Period | null;
  onSelect: (period: Period) => void;
}

export default function PeriodSelector({
  periods,
  activePeriod,
  onSelect,
}: PeriodSelectorProps) {
  return (
    <div className="w-full flex items-center justify-center">
      {periods.map((period) => (
        <button
          key={period.id}
          onClick={() => onSelect(period)}
          className={`px-2 py-1 mr-2 mb-2 rounded-lg font-lora font-medium text-base transition duration-300 ${
            activePeriod?.id === period.id
              ? "bg-gray-400 text-background"
              : "bg-extra text-foreground hover:bg-foreground/80 hover:text-background cursor-pointer"
          }`}
        >
          {period.title}
        </button>
      ))}
    </div>
  );
}
