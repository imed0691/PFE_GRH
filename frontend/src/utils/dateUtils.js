/**
 * Given a day name (e.g. "Monday"), returns the next upcoming date for that day.
 * If today IS that day and the session hasn't started yet, it returns today.
 * Otherwise it returns the date of the next occurrence.
 */
export function getNextOccurrence(dayName, startTime) {
  const dayMap = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6
  };

  const targetDay = dayMap[dayName];
  if (targetDay === undefined) return null;

  const now = new Date();
  const todayDay = now.getDay();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Parse session start hour
  let sessionHour = 24;
  if (startTime) {
    const [h, m] = startTime.split(':').map(Number);
    sessionHour = h + m / 60;
  }

  let daysUntilNext = targetDay - todayDay;

  // If it's today but the session already passed, jump to next week
  if (daysUntilNext === 0 && currentHour > sessionHour) {
    daysUntilNext = 7;
  }

  // If the day is in the past this week, jump to next week
  if (daysUntilNext < 0) {
    daysUntilNext += 7;
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntilNext);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

/**
 * Formats a Date into a short readable string, e.g. "Lun. 5 mai"
 */
export function formatShortDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}
