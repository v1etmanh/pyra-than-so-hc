const DEFAULT_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export interface CurrentTimeContext {
  timeZone: string;
  assumedTimeZone: boolean;
  localDate: string;
  localTime: string;
  weekday: string;
  dayPeriod: string;
  actionHint: string;
}

/** Use the server clock; clients supply only their device's IANA time zone. */
export function createCurrentTimeContext(timeZone?: unknown, now = new Date()): CurrentTimeContext {
  let resolvedZone = DEFAULT_TIME_ZONE;
  let assumedTimeZone = true;
  if (typeof timeZone === 'string' && timeZone.trim().length <= 100) {
    try {
      resolvedZone = new Intl.DateTimeFormat('vi-VN', { timeZone: timeZone.trim() }).resolvedOptions().timeZone;
      assumedTimeZone = false;
    } catch {
      // Older clients and invalid zones use Vietnam time, never host-local time.
    }
  }
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: resolvedZone, year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value || '';
  const hour = Number(part('hour'));
  let dayPeriod: string;
  let actionHint: string;
  if (hour >= 5 && hour < 11) {
    dayPeriod = 'buổi sáng';
    actionHint = 'Có thể gợi ý khởi động nhẹ và chọn một ưu tiên cho phần ngày còn lại.';
  } else if (hour >= 11 && hour < 14) {
    dayPeriod = 'buổi trưa';
    actionHint = 'Có thể gợi ý một bước ngắn hoặc nghỉ giữa ngày nếu phù hợp câu hỏi.';
  } else if (hour >= 14 && hour < 18) {
    dayPeriod = 'buổi chiều';
    actionHint = 'Có thể gợi ý hoàn thành một việc vừa sức trước cuối ngày.';
  } else if (hour >= 18 && hour < 22) {
    dayPeriod = 'buổi tối';
    actionHint = 'Có thể gợi ý hoạt động nhẹ, kết nối hoặc chuẩn bị cho ngày mai.';
  } else {
    dayPeriod = 'đêm khuya / rạng sáng';
    actionHint = 'Ưu tiên bước nhẹ, yên tĩnh; cân nhắc nghỉ ngơi hoặc hẹn việc không gấp vào ngày mai, nếu phù hợp lịch sinh hoạt người dùng.';
  }
  return {
    timeZone: resolvedZone, assumedTimeZone,
    localDate: `${part('day')}/${part('month')}/${part('year')}`,
    localTime: `${part('hour')}:${part('minute')}`,
    weekday: part('weekday'), dayPeriod, actionHint,
  };
}

export function formatCurrentTimeContext(context: CurrentTimeContext): string {
  return [
    'NGỮ CẢNH THỜI GIAN HIỆN TẠI (đồng hồ hệ thống tại lúc nhận câu hỏi):',
    `• ${context.weekday}, ngày ${context.localDate}, lúc ${context.localTime} — ${context.dayPeriod}.`,
    `• Múi giờ: ${context.timeZone}${context.assumedTimeZone ? ' (tạm dùng giờ Việt Nam vì thiết bị chưa cung cấp múi giờ hợp lệ)' : ' (theo thiết bị người hỏi)'}.`,
    `• Gợi ý điều chỉnh hành động: ${context.actionHint}`,
  ].join('\n');
}
