// Business history is public to the dossier parties, not technical evidence.
export function refundBusinessHistory(entries: unknown[]) {
  return entries.flatMap(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []
    const raw = entry as Record<string, unknown>
    if (typeof raw.action !== 'string' || !/^[a-z][a-z0-9_]{0,99}$/.test(raw.action)) return []
    if (typeof raw.actorRole !== 'string' || !['participant', 'organizer', 'agent', 'system', 'admin'].includes(raw.actorRole)) return []
    const at = raw.at instanceof Date ? raw.at : typeof raw.at === 'string' ? new Date(raw.at) : null
    if (!at || !Number.isFinite(at.getTime())) return []
    return [{ at: at.toISOString(), action: raw.action, actorRole: raw.actorRole }]
  })
}
