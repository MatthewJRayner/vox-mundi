"use client";
import { Period } from "@/types/culture";
import { SVGPath } from "@/utils/path";
import { formatYears } from "@/utils/formatters/formatYears";

interface PeriodListProps {
  periods: Period[];
  activePeriod: Period | null;
  onAddNew: () => void;
  onEdit: (period: Period) => void;
}

export default function PeriodList({
  periods,
  activePeriod,
  onAddNew,
  onEdit,
}: PeriodListProps) {
  return (
    <section className="flex flex-col space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-main">Periods</h3>
        <button onClick={onAddNew}>
          <svg
            viewBox={SVGPath.add.viewBox}
            className="size-6 fill-current transition hover:text-foreground/80 active:scale-95 cursor-pointer"
          >
            <path d={SVGPath.add.path} />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {periods.map((period) => (
          <div
            key={period.id}
            className={`p-3 rounded shadow bg-extra cursor-pointer ${
              activePeriod?.id === period.id ? "ring-2 ring-foreground" : ""
            }`}
            onClick={() => onEdit(period)}
          >
            <h4 className="font-lora text-lg">{period.title}</h4>
            <p className="text-sm opacity-70">
              {formatYears(period.start_year, period.end_year)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
