export function formatKWD(value: number): string {
  try {
    return new Intl.NumberFormat('en-KW', { style: 'currency', currency: 'KWD', maximumFractionDigits: 0 }).format(value)
  } catch {
    return `KD ${Math.round(value).toLocaleString('en-US')}`
  }
}


