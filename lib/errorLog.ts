interface ErrorEntry {
  ts: string
  tag: string
  message: string
  detail: string
}

const MAX_ENTRIES = 20
const log: ErrorEntry[] = []

export function logError(tag: string, message: string, detail?: unknown): void {
  const entry: ErrorEntry = {
    ts: new Date().toISOString(),
    tag,
    message,
    detail: detail !== undefined ? String(detail instanceof Error ? detail.message : JSON.stringify(detail)) : '',
  }
  log.push(entry)
  if (log.length > MAX_ENTRIES) log.shift()
  console.error(`[${tag}]`, message, detail ?? '')
}

export function getErrors(): ErrorEntry[] {
  return [...log]
}
