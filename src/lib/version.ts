export const APP_VERSION = __APP_VERSION__

export function buildTimeFormatted(): string {
  const date = new Date(__BUILD_TIME__)
  return date.toLocaleString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
