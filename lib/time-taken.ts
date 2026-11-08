export const duration = (start: Date, end: Date | null) => {
    if (!end) return 'Building...'
    const s = Math.round((end.getTime() - start.getTime()) / 1000)
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}