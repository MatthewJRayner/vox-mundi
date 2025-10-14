declare module 'chinese-lunar' {
  interface LunarDate {
    lunarYear: number;
    lunarMonth: number;
    lunarDay: number;
    isLeapMonth: boolean;
  }

  class ChineseLunar {
    constructor();
    solarToLunar(date: Date): LunarDate;
    lunarToSolar(year: number, month: number, day: number, isLeapMonth?: boolean): Date;
    getDaysInLunarMonth(year: number, month: number, isLeapMonth?: boolean): number;
  }

  export = ChineseLunar;
}