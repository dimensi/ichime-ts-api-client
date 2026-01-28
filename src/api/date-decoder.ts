/**
 * Парсит даты в формате API Anime365: "yyyy-MM-dd HH:mm:ss" в московской таймзоне.
 */
export function parseApiDate(dateString: string): Date {
  // API возвращает даты в формате "2024-01-15 14:30:00" в московской таймзоне (UTC+3)
  const [datePart, timePart] = dateString.split(" ");
  if (!datePart || !timePart) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  // Добавляем смещение московской таймзоны (+03:00)
  const isoString = `${datePart}T${timePart}+03:00`;
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date;
}

/**
 * Проверяет, является ли дата "пустой" датой-заглушкой API (2000-01-01 00:00:00).
 */
export function isEmptyDate(date: Date): boolean {
  // API возвращает "2000-01-01 00:00:00" MSK как пустую дату
  // В UTC это будет 1999-12-31 21:00:00
  return date.getTime() === new Date("1999-12-31T21:00:00.000Z").getTime();
}

/**
 * Рекурсивно преобразует строки дат в объекты Date в JSON-ответе.
 * Ищет поля, заканчивающиеся на "DateTime".
 */
export function transformDatesInResponse<T>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformDatesInResponse(item)) as T;
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.endsWith("DateTime") && typeof value === "string") {
        result[key] = parseApiDate(value);
      } else {
        result[key] = transformDatesInResponse(value);
      }
    }
    return result as T;
  }

  return obj as T;
}
