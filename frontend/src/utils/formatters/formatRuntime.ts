export function formatRuntime(runtime?: string): string {
    if (!runtime) return "Unknown runtime";
    const [hours, minutes, seconds] = runtime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + Math.round((seconds || 0) / 60)
    return `${totalMinutes} mins`
}