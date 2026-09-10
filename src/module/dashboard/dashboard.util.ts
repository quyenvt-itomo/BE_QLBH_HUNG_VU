import { DashboardTimeView, DashboardTypeView } from "./dashboard.types";

export interface DashboardDateRange {
  startDate: string;
  endDate: string;
}

const dateToDayNumber = (date: string): number => {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
};

const dayNumberToDate = (dayNumber: number): string => {
  const date = new Date(dayNumber * 86_400_000);
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
    .map((value) => String(value).padStart(2, "0"))
    .join("-");
};

export const addDays = (date: string, days: number): string =>
  dayNumberToDate(dateToDayNumber(date) + days);

const getLocalDate = (timezone: string): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const startOfMonth = (date: string): string => `${date.slice(0, 7)}-01`;

const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

const previousMonthSameDay = (date: string): string => {
  const [year, month, day] = date.split("-").map(Number);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  return [previousYear, previousMonth, Math.min(day, daysInMonth(previousYear, previousMonth))]
    .map((value) => String(value).padStart(2, "0"))
    .join("-");
};

export const normalizeTimezone = (timezone?: string): string => {
  const aliases: Record<string, string> = {
    "Asia/Saigon": "Asia/Ho_Chi_Minh",
    "Asia/HoChiMinh": "Asia/Ho_Chi_Minh",
    "UTC+7": "Asia/Ho_Chi_Minh",
    "GMT+7": "Asia/Ho_Chi_Minh",
  };
  const candidate = aliases[(timezone || "").trim()] || (timezone || "").trim();
  const normalized = candidate || "Asia/Ho_Chi_Minh";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: normalized }).format(new Date());
    return normalized;
  } catch {
    return "Asia/Ho_Chi_Minh";
  }
};

export const getDefaultTimeView = (timezone?: string): DashboardTimeView => {
  const today = getLocalDate(normalizeTimezone(timezone));
  return Number(today.slice(-2)) >= 20
    ? DashboardTimeView.THIS_MONTH
    : DashboardTimeView.LAST_MONTH;
};

export const resolveDateRange = (
  timeView: DashboardTimeView | undefined,
  timezone?: string,
): DashboardDateRange => {
  const normalizedTimezone = normalizeTimezone(timezone);
  const today = getLocalDate(normalizedTimezone);
  const resolvedView = timeView || getDefaultTimeView(normalizedTimezone);

  switch (resolvedView) {
    case DashboardTimeView.YESTERDAY: {
      const startDate = addDays(today, -1);
      return { startDate, endDate: today };
    }
    case DashboardTimeView.TODAY:
      return { startDate: today, endDate: addDays(today, 1) };
    case DashboardTimeView.LAST_7_DAYS:
      return { startDate: addDays(today, -6), endDate: addDays(today, 1) };
    case DashboardTimeView.THIS_MONTH:
      return { startDate: startOfMonth(today), endDate: addDays(today, 1) };
    case DashboardTimeView.LAST_MONTH: {
      const thisMonthStart = startOfMonth(today);
      const previousMonthLastDay = addDays(thisMonthStart, -1);
      return {
        startDate: startOfMonth(previousMonthLastDay),
        endDate: thisMonthStart,
      };
    }
    default:
      return { startDate: today, endDate: addDays(today, 1) };
  }
};

export const resolvePreviousMonthSameDay = (
  timezone?: string,
): DashboardDateRange => {
  const today = getLocalDate(normalizeTimezone(timezone));
  const [year, month, day] = today.split("-").map(Number);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const previousDate = [
    previousYear,
    previousMonth,
    Math.min(day, daysInMonth(previousYear, previousMonth)),
  ]
    .map((value) => String(value).padStart(2, "0"))
    .join("-");
  return { startDate: previousDate, endDate: addDays(previousDate, 1) };
};

export const resolvePreviousDay = (timezone?: string): DashboardDateRange => {
  const today = getLocalDate(normalizeTimezone(timezone));
  const date = addDays(today, -1);
  return { startDate: date, endDate: today };
};

export const getRevenueLabels = (
  typeView: DashboardTypeView,
  range: DashboardDateRange,
  hourRange?: { minHour: number; maxHour: number } | null,
): string[] => {
  if (typeView === DashboardTypeView.HOUR) {
    const minHour = hourRange?.minHour ?? 0;
    const maxHour = hourRange?.maxHour ?? minHour;
    return Array.from({ length: Math.max(1, maxHour - minHour + 1) }, (_, index) =>
      `${String(minHour + index).padStart(2, "0")}:00`,
    );
  }
  if (typeView === DashboardTypeView.WEEKDAY) {
    return ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  }
  const labels: string[] = [];
  for (let date = range.startDate; date < range.endDate; date = addDays(date, 1)) {
    labels.push(date);
  }
  return labels;
};
