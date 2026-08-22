import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TZ = "Asia/Ho_Chi_Minh";

/**
 * dayjs instance với timezone mặc định Asia/Ho_Chi_Minh.
 * Dùng thay cho `dayjs()` để đảm bảo mọi thao tác ngày giờ đều theo múi giờ VN.
 *
 * @example
 * appDayjs().startOf("day").toDate()  // đầu ngày hôm nay giờ HCM
 * appDayjs("2026-08-07").endOf("day") // cuối ngày 07/08 giờ HCM
 */
export function appDayjs(date?: dayjs.ConfigType, tz?: string): dayjs.Dayjs {
  return dayjs(date).tz(tz || DEFAULT_TZ);
}

export { DEFAULT_TZ as APP_TIMEZONE };
