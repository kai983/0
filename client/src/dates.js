/**
 * Calendar days between a stored timestamp and today - midnight to midnight,
 * so "yesterday 23:00" is 1 day ago at 09:00 this morning, not 0.
 */
export function daysSince(iso) {
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((midnight(new Date()) - midnight(new Date(iso))) / 86400000)
}
