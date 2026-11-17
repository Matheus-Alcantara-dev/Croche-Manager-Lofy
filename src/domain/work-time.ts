export const hourlyRate = 20;
export type ActiveWork = { projectId: string; startedAt: number };
export type WorkSession = ActiveWork & { endedAt: number };

export function elapsedMs(startedAt: number, now: number) {
  return Math.max(0, now - startedAt);
}

export function workTotals(existingHours: number, sessions: WorkSession[], projectId: string) {
  const relevant = sessions.filter((session) => session.projectId === projectId);
  const milliseconds = Math.round(existingHours * 3_600_000)
    + relevant.reduce((sum, session) => sum + elapsedMs(session.startedAt, session.endedAt), 0);
  return { milliseconds, periods: relevant.length, labor: workCost(milliseconds) };
}

export function workCost(milliseconds: number) {
  return Math.round(milliseconds / 3_600_000 * hourlyRate * 100) / 100;
}

export function clockLabel(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((unit) => String(unit).padStart(2, '0')).join(':');
}
