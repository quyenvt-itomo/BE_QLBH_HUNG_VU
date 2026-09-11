import dayjs from "dayjs";
import { AnalysisGranularity, AnalysisRange } from "./analysis.types";

const MIN_DATE = dayjs("2026-01-01").startOf("day");

const clampStart = (value: dayjs.Dayjs): dayjs.Dayjs =>
  value.isBefore(MIN_DATE, "day") ? MIN_DATE : value.startOf("day");

const clampEnd = (value: dayjs.Dayjs): dayjs.Dayjs => {
  const today = dayjs().startOf("day");
  const end = value.isAfter(today, "day") ? today : value;
  return (end.isBefore(MIN_DATE, "day") ? MIN_DATE : end).startOf("day");
};

const makeRange = (
  token: string,
  rawStart: dayjs.Dayjs,
  rawEndInclusive: dayjs.Dayjs,
  granularity: AnalysisGranularity,
): AnalysisRange => {
  let start = clampStart(rawStart);
  let end = clampEnd(rawEndInclusive);
  if (start.isAfter(end, "day")) end = start;
  const days = end.diff(start, "day") + 1;
  return {
    token,
    startAt: start.format("YYYY-MM-DD"),
    endAt: end.format("YYYY-MM-DD"),
    endExclusive: end.add(1, "day").format("YYYY-MM-DD"),
    days,
    granularity,
    labels: buildLabels(start, end, granularity),
  };
};

const buildLabels = (
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  granularity: AnalysisGranularity,
): string[] => {
  const labels: string[] = [];
  if (granularity === "month") {
    let cursor = start.startOf("month");
    while (!cursor.isAfter(end, "month")) {
      labels.push(cursor.format("MM/YYYY"));
      cursor = cursor.add(1, "month");
    }
    return labels;
  }
  let cursor = start;
  while (!cursor.isAfter(end, "day")) {
    if (granularity === "week") {
      const daysUntilMonday = (8 - cursor.day()) % 7;
      const weekEnd = cursor.add(daysUntilMonday === 0 ? 6 : daysUntilMonday - 1, "day");
      const segmentEnd = weekEnd.isAfter(end, "day") ? end : weekEnd;
      labels.push(`${cursor.format("DD/MM")}-${segmentEnd.format("DD/MM")}`);
      cursor = segmentEnd.add(1, "day");
    } else {
      labels.push(cursor.format("DD/MM"));
      cursor = cursor.add(1, "day");
    }
  }
  return labels;
};

export const resolveAnalysisRange = (token = "day-7"): AnalysisRange => {
  const now = dayjs().startOf("day");
  const parts = token.split("-");
  const kind = parts[0];

  if (kind === "day" && (parts[1] === "7" || parts[1] === "30")) {
    return makeRange(token, now.subtract(Number(parts[1]) - 1, "day"), now, "day");
  }
  if (kind === "week" && /^\d{2}$/.test(parts[1] || "") && /^\d{2}$/.test(parts[2] || "")) {
    const start = dayjs(`${now.year()}-${parts[2]}-${parts[1]}`);
    return makeRange(token, start, start.add(6, "day"), "day");
  }
  if (kind === "month" && /^\d{2}$/.test(parts[1] || "") && /^\d{4}$/.test(parts[2] || "")) {
    const start = dayjs(`${parts[2]}-${parts[1]}-01`);
    return makeRange(token, start, start.endOf("month"), "day");
  }
  if ((kind === "quarter" || kind === "quater") && /^\d{2}$/.test(parts[1] || "") && /^\d{4}$/.test(parts[2] || "")) {
    const month = Math.floor((Number(parts[1]) - 1) / 3) * 3 + 1;
    const start = dayjs(`${parts[2]}-${String(month).padStart(2, "0")}-01`);
    return makeRange(token, start, start.add(2, "month").endOf("month"), "week");
  }
  if (kind === "year" && /^\d{4}$/.test(parts[1] || "")) {
    const start = dayjs(`${parts[1]}-01-01`);
    return makeRange(token, start, start.endOf("year"), "month");
  }
  return makeRange("day-7", now.subtract(6, "day"), now, "day");
};

export const resolvePreviousRange = (range: AnalysisRange): AnalysisRange => {
  const start = dayjs(range.startAt);
  const previousStart = start.subtract(range.days, "day");
  const previousEnd = start.subtract(1, "day");
  return makeRange(`${range.token}-previous`, previousStart, previousEnd, range.granularity);
};

const TIMEZONE_ALIASES: Record<string, string> = {
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Asia/Calcutta": "Asia/Kolkata",
};

export const normalizeTimezone = (timezone?: string): string => {
  if (!timezone || !/^[A-Za-z0-9_+\-/]+$/.test(timezone)) return "Asia/Ho_Chi_Minh";
  return TIMEZONE_ALIASES[timezone] || timezone;
};

export const numeric = (value: unknown): number => Number(value || 0);
