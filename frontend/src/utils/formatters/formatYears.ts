export function formatYears(year1: number, year2: number): string {
  if (!Number.isInteger(year1) || !Number.isInteger(year2)) {
    throw new Error("Both inputs must be integers");
  }

  if (year1 > 999 && year2 > 999) {
    return `${year1} - ${year2}`;
  }

  const formatSingleYear = (year: number): string => {
    return year < 0 ? `${-year} B.C.` : `${year} A.D.`;
  };

  return `${formatSingleYear(year1)} - ${formatSingleYear(year2)}`;
}
