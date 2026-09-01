/**
 * Calendar days between a stored timestamp and today - midnight to midnight,
 * so "yesterday 23:00" is 1 day ago at 09:00 this morning, not 0.
 */
export function daysSince(iso) {
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((midnight(new Date()) - midnight(new Date(iso))) / 86400000)
}

/** Midnight of the Monday that starts the calendar week containing d. */
function weekStart(d) {
  const daysPastMonday = (d.getDay() + 6) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysPastMonday).getTime()
}

/**
 * One threshold table for every date presentation - the list rows' relative
 * dates and the index ledger's group headers must never disagree.
 * 이번 주/지난주 are calendar weeks (Monday start), because that is what the
 * words mean to a reader - a rolling 7-day window files last Saturday under
 * "this week", which reads as wrong the moment anyone checks.
 */
export function dateBucket(iso) {
  const days = daysSince(iso)
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  const diff = weekStart(new Date()) - weekStart(new Date(iso))
  if (diff === 0) return '이번 주'
  if (diff === 7 * 86400000) return '지난주'
  return '이전'
}
