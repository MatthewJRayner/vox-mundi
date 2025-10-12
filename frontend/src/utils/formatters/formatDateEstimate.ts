import { DateEstimate } from "@/types/date";

export function formatDateEstimate(dateEstimate: DateEstimate | undefined): string {
  if (!dateEstimate) return "";

  const {
    date_known,
    date,
    date_estimate_start,
    date_estimate_end,
    date_precision,
  } = dateEstimate;

  if (date_known && date) {
    const d = new Date(date);
    const year = d.getFullYear();
    return formatYear(year);
  }

  if (!date_known) {
    switch (date_precision) {
      case "year":
        return date_estimate_start
          ? `c. ${formatYear(date_estimate_start)}`
          : "c. Unknown Year";

      case "decade":
        return date_estimate_start
          ? `c. ${Math.abs(date_estimate_start)}0s ${getEra(date_estimate_start)}`
          : "c. Unknown Decade";

      case "century":
        return date_estimate_start
          ? `c. ${formatCentury(date_estimate_start)}`
          : "c. Unknown Century";

      case "millennium":
        return date_estimate_start
          ? `c. ${formatMillennium(date_estimate_start)}`
          : "c. Unknown Millennium";

      case "unknown":
      default:
        if (date_estimate_start && date_estimate_end) {
          return `c. ${formatYear(date_estimate_start)}–${formatYear(
            date_estimate_end
          )}`;
        }
        return "Date Unknown";
    }
  }

  if (date_estimate_start && date_estimate_end) {
    return `c. ${formatYear(date_estimate_start)}–${formatYear(date_estimate_end)}`;
  }

  return "Date Unknown";
}

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
}

function getEra(year: number): string {
  return year < 0 ? "BC" : "AD";
}

function formatCentury(year: number): string {
  const era = getEra(year);
  const absYear = Math.abs(year);
  const century = Math.ceil(absYear / 100);
  const suffix = getOrdinalSuffix(century);
  return `${century}${suffix} Century ${era}`;
}

function formatMillennium(year: number): string {
  const era = getEra(year);
  const absYear = Math.abs(year);
  const millennium = Math.ceil(absYear / 1000);
  const suffix = getOrdinalSuffix(millennium);
  return `${millennium}${suffix} Millennium ${era}`;
}

function getOrdinalSuffix(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "st";
  if (n % 10 === 2 && n % 100 !== 12) return "nd";
  if (n % 10 === 3 && n % 100 !== 13) return "rd";
  return "th";
}
