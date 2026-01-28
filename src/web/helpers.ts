/**
 * Извлекает ID сериала и эпизода из URL вида /catalog/{seriesId}-{slug}/{episodeId}-{slug}
 */
export function extractIdentifiersFromUrl(url: URL): {
  seriesId: number | null;
  episodeId: number | null;
} {
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (pathParts.length < 2 || pathParts[0] !== "catalog") {
    return { seriesId: null, episodeId: null };
  }

  let seriesId: number | null = null;
  let episodeId: number | null = null;

  // Извлекаем seriesId из второго сегмента (например, "12345-anime-name")
  const seriesMatch = pathParts[1]?.match(/(\d+)$/);
  if (seriesMatch) {
    seriesId = Number.parseInt(seriesMatch[1], 10);
  }

  // Извлекаем episodeId из третьего сегмента (например, "67890-episode-1")
  if (pathParts.length >= 3) {
    const episodeMatch = pathParts[2]?.match(/(\d+)$/);
    if (episodeMatch) {
      episodeId = Number.parseInt(episodeMatch[1], 10);
    }
  }

  return { seriesId, episodeId };
}

/**
 * Парсит строку длительности формата "mm:ss" или "hh:mm:ss" в секунды.
 */
export function parseDurationString(durationString: string): number | null {
  const parts = durationString.split(":").map((p) => Number.parseInt(p, 10));

  if (parts.some((p) => Number.isNaN(p))) {
    return null;
  }

  switch (parts.length) {
    case 2: // mm:ss
      return parts[0] * 60 + parts[1];
    case 3: // hh:mm:ss
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    default:
      return null;
  }
}

/**
 * Парсит дату в формате "dd.MM.yyyy HH:mm" в московской таймзоне.
 */
export function parseWebDate(dateString: string): Date | null {
  // Формат: "15.01.2024 14:30"
  const match = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year, hours, minutes] = match;
  // Создаем ISO строку с московским смещением (+03:00)
  const isoString = `${year}-${month}-${day}T${hours}:${minutes}:00+03:00`;
  const date = new Date(isoString);

  return Number.isNaN(date.getTime()) ? null : date;
}
