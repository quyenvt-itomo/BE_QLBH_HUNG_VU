import { Request, Response, NextFunction } from "express";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export function normalizeDateRangeMiddleware(
  keys: { start?: string; end?: string } = { start: "startAt", end: "endAt" }
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const tz = (req.headers[`x-timezone`] as string) || "UTC";
    const { start, end } = keys;

    if (start && req.query[start]) {
      req.query[start] = dayjs
        .tz(req.query[start] as string, "YYYY-MM-DD", tz) // parse theo date + tz
        .startOf("day")
        .utc()
        .toISOString();
    }

    if (end && req.query[end]) {
      req.query[end] = dayjs
        .tz(req.query[end] as string, "YYYY-MM-DD", tz) // parse theo date + tz
        .endOf("day")
        .utc()
        .toISOString();
    }

    next();
  };
}
