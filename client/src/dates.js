/**
 * Calendar days between a stored timestamp and today - midnight to midnight,
 * so "yesterday 23:00" is 1 day ago at 09:00 this morning, not 0.
 */
export function daysSince(iso) {
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((midnight(new Date()) - midnight(new Date(iso))) / 86400000)
}

/**
 * One threshold table for every date presentation - the list rows' relative
 * dates and the index ledger's group headers must never disagree.
 */
export function dateBucket(iso) {
  const days = daysSince(iso)
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return '이번 주'
  if (days < 14) return '지난주'
  return '이전'
}
