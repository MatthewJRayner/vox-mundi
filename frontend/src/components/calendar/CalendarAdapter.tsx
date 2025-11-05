/**
 * BIG WORK IN PROGRESS 
 * 
 * BE WARNED
 */

// --- Islamic (Hijri) Calendar Adapter ---

const ISLAMIC_EPOCH = 1948439.5;
const ISLAMIC_YEAR_DAYS = 354;
const ISLAMIC_LEAP_YEARS = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]; // leap years in 30-year cycle

function isIslamicLeapYear(year: number): boolean {
  return ISLAMIC_LEAP_YEARS.includes((year % 30) || 30);
}

// Convert Gregorian → Islamic (tabular)
function toIslamic(gregorian: Date): CalendarDateData {
  const jdn = Math.floor(gregorian.getTime() / 86400000) + 2440587.5;
  const daysSinceEpoch = jdn - ISLAMIC_EPOCH;

  // Approximate Islamic year
  const year = Math.floor((30 * daysSinceEpoch + 10646) / 10631);
  const firstDayOfYear = ISLAMIC_EPOCH + 354 * (year - 1) + Math.floor((3 + 11 * year) / 30);
  const dayOfYear = Math.floor(jdn - firstDayOfYear) + 1;

  // Determine month and day
  let month = Math.ceil(dayOfYear / 29.5);
  if (month > 12) month = 12;
  const monthStart = Math.ceil(29.5 * (month - 1));
  const day = dayOfYear - monthStart;

  return { year, month, day };
}

// Convert Islamic → Gregorian
function fromIslamic(islamic: CalendarDateData): Date {
  const { year, month, day } = islamic;

  const jdn =
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * ISLAMIC_YEAR_DAYS +
    Math.floor((3 + 11 * year) / 30) +
    ISLAMIC_EPOCH;

  const unixTime = (jdn - 2440587.5) * 86400000;
  return new Date(unixTime);
}

// --- Ancient Egyptian Calendar Adapter ---

// Constants for Egyptian calendar calculations
const EGYPTIAN_EPOCH = 1448638; // Julian Day of Thoth 1, 747 BCE (historical epoch)
const EGYPTIAN_YEAR_DAYS = 365; // Fixed 365-day year (no leap years)
const EGYPTIAN_MONTH_DAYS = 30; // Each month has exactly 30 days
const EPAGOMENAL_DAYS = 5; // 5 extra days at year end

/**
 * Converts Gregorian date to Ancient Egyptian date.
 * 
 * The calendar had:
 * - 12 months of exactly 30 days each
 * - 5 extra "epagomenal" days at the end of the year
 * - No leap years, so it drifted about 1 day every 4 years
 */
function toEgyptian(gregorian: Date): CalendarDateData {
  // Convert to Julian Day Number (JDN)
  // JDN is a continuous count of days since January 1, 4713 BCE
  // This makes calendar conversions much easier
  const jdn = Math.floor(gregorian.getTime() / 86400000) + 2440587.5;
  
  // Calculate days since Egyptian epoch
  const daysSinceEpoch = jdn - EGYPTIAN_EPOCH;
  
  // Egyptian years since epoch (each year is exactly 365 days)
  // Using floor because we want completed years
  const year = Math.floor(daysSinceEpoch / EGYPTIAN_YEAR_DAYS);
  
  // Day of the year (0-based)
  const dayOfYear = daysSinceEpoch % EGYPTIAN_YEAR_DAYS;
  
  let month, day;
  
  // Check if this is in the epagomenal days (last 5 days of year)
  if (dayOfYear >= EGYPTIAN_YEAR_DAYS - EPAGOMENAL_DAYS) {
    month = 13; // Special month for epagomenal days
    day = dayOfYear - (EGYPTIAN_YEAR_DAYS - EPAGOMENAL_DAYS) + 1;
  } else {
    // Regular month calculation
    month = Math.floor(dayOfYear / EGYPTIAN_MONTH_DAYS) + 1;
    day = (dayOfYear % EGYPTIAN_MONTH_DAYS) + 1;
  }
  
  return { 
    year: year + 1, // Egyptian year 1 = 747 BCE
    month, 
    day 
  };
}

/**
 * Converts Egyptian date back to Gregorian
 * This is needed when clicking dates to add events
 */
function fromEgyptian(egyptian: CalendarDateData): Date {
  const { year, month, day } = egyptian;
  
  // Calculate total days since Egyptian epoch
  let totalDays = (year - 1) * EGYPTIAN_YEAR_DAYS;
  
  if (month === 13) {
    // Epagomenal days - add days for all 12 months plus the epagomenal day
    totalDays += (12 * EGYPTIAN_MONTH_DAYS) + (day - 1);
  } else {
    // Regular month - add days for previous months plus current day
    totalDays += ((month - 1) * EGYPTIAN_MONTH_DAYS) + (day - 1);
  }
  
  // Convert back to Julian Day Number and then to JavaScript Date
  const jdn = totalDays + EGYPTIAN_EPOCH;
  const unixTime = (jdn - 2440587.5) * 86400000;
  
  return new Date(unixTime);
}

export type CalendarSystem = "gregorian" | "egyptian" | "islamic"; // Add Egyptian to the type

export interface CalendarDateData {
  year: number;
  month: number;
  day: number;
  isIntercalary?: boolean;
}

export interface CalendarAdapter {
  name: string;
  getMonthName(month: number): string;
  getWeekdayNames(): string[];
  getDaysInMonth(year: number, month: number): number;
  getStartDayOfMonth(year: number, month: number): number;
  convertFromGregorian(date: Date): CalendarDateData;
  convertToGregorian(date: CalendarDateData): Date;
}

export const GregorianAdapter: CalendarAdapter = {
  name: "Gregorian",
  getMonthName: (month) =>
    [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ][month - 1] || "Unknown",
  getWeekdayNames: () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  getDaysInMonth: (year, month) => new Date(year, month, 0).getDate(),
  getStartDayOfMonth: (year, month) => new Date(year, month - 1, 1).getDay(),
  convertFromGregorian: (date) => {
    return { 
      year: date.getFullYear(), 
      month: date.getMonth() + 1, 
      day: date.getDate() 
    };
  },
  convertToGregorian: ({ year, month, day }) => {
    return new Date(year, month - 1, day);
  },
};

export const EgyptianAdapter: CalendarAdapter = {
  name: "Ancient Egyptian",
  getMonthName: (month) => {
    const monthNames = [
      "Thoth", "Phaophi", "Athyr", "Choiak",  // Months 1-4
      "Tybi", "Mecheir", "Phamenoth", "Pharmuthi", // Months 5-8
      "Pachons", "Payni", "Epiphi", "Mesore", // Months 9-12
      "Epagomenal" // Month 13 - the 5 extra days
    ];
    return monthNames[month - 1] || "Unknown";
  },
  
  getWeekdayNames: () => [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
  ],
  
  /**
   * Egyptian months always had 30 days except month 13 which had 5
   * This simple pattern makes the calendar very predictable
   */
  getDaysInMonth: (year, month) => {
    return month === 13 ? 5 : 30;
  },
  getStartDayOfMonth: (year, month) => {
    const firstDayGregorian = fromEgyptian({ year, month, day: 1 });
    return firstDayGregorian.getDay();
  },
  
  convertFromGregorian: toEgyptian,
  convertToGregorian: fromEgyptian,
};

export const IslamicAdapter: CalendarAdapter = {
  name: "Islamic (Hijri)",
  getMonthName: (month) =>
    [
      "Muharram", "Safar", "Rabi‘ al-awwal", "Rabi‘ al-thani", "Jumada al-awwal",
      "Jumada al-thani", "Rajab", "Sha‘ban", "Ramadan", "Shawwal", "Dhu al-Qi‘dah", "Dhu al-Hijjah"
    ][month - 1] || "Unknown",
  getWeekdayNames: () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  getDaysInMonth: (year, month) => {
    if (month % 2 === 1) return 30;
    if (month !== 12) return 29;
    return isIslamicLeapYear(year) ? 30 : 29;
  },
  getStartDayOfMonth: (year, month) => {
    const g = fromIslamic({ year, month, day: 1 });
    return g.getDay();
  },
  convertFromGregorian: toIslamic,
  convertToGregorian: fromIslamic,
};


export const calendarSystems: Record<CalendarSystem, CalendarAdapter> = {
  gregorian: GregorianAdapter,
  egyptian: EgyptianAdapter,
  islamic: IslamicAdapter,
};