"use client";

import { Period } from "@/types/culture";

interface PeriodSelectorProps {
  periods: Period[];
  activePeriod: Period | null;
  onSelect: (period: Period) => void;
}

/**
 * Horizontal or grid-based selector for choosing a period.
 *
 * Highlights the active period and triggers `onSelect` on click.
 *
 * @param periods - Array of `Period` objects to display
 * @param activePeriod - Currently selected period (or `null`)
 * @param onSelect - Called when a period is clicked
 *
 * @example
 * <PeriodSelector periods={periods} activePeriod={selected} onSelect={setSelected} />
 */

export default function PeriodSelector({
  periods,
  activePeriod,
  onSelect,
}: PeriodSelectorProps) {
  return (
    <div className="w-full grid grid-cols-2 md:flex items-center justify-center">
      {periods.map((period) => (
        <button
          key={period.id}
          onClick={() => onSelect(period)}
          className={`px-2 py-1 mr-2 mb-2 rounded-lg font-lora font-medium text-sm md:text-base transition duration-300 ${
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
