import type { PipelineStage } from 'mongoose'
import { BENIN_TIME_ZONE } from '@/lib/shared/beninTime'

function wallClock(time: unknown) {
  return { $dateFromString: { dateString: { $concat: ['$date', 'T', time] }, timezone: BENIN_TIME_ZONE, onError: null, onNull: null } }
}

function timeOr(field: string, fallback: unknown) {
  return { $cond: [{ $eq: [{ $ifNull: [field, ''] }, ''] }, fallback, field] }
}

// Same wall-clock/end-of-night rules as event-time, applied before pagination.
export function directoryEventPipeline(now: Date): PipelineStage[] {
  return [
    { $match: {
      region: { $in: ['Bénin', 'Benin'] }, currency: 'XOF',
      cancelled: { $ne: true }, isDemo: { $ne: true }, isPrivate: { $ne: true },
      demoLabel: { $in: [null, ''] },
      name: { $not: /^\s*filler\b/i }, description: { $not: /remplisseur\s+top\s*3/i },
      $or: [{ publishAt: null }, { publishAt: { $lte: now } }],
    } },
    { $set: {
      _directoryStart: wallClock(timeOr('$time', '00:00')),
      _directoryEnd: wallClock(timeOr('$endTime', timeOr('$time', '23:59'))),
    } },
    { $set: { _directoryClose: { $ifNull: ['$closingDate', { $cond: [
      { $lte: ['$_directoryEnd', '$_directoryStart'] },
      { $add: ['$_directoryEnd', 24 * 3600_000] }, '$_directoryEnd',
    ] }] } } },
    { $match: { _directoryStart: { $ne: null }, _directoryClose: { $gt: now } } },
    { $sort: { date: 1, time: 1, _id: 1 } },
    { $limit: 1 },
    { $project: { name: 1, date: 1, dateDisplay: 1, city: 1, region: 1 } },
  ]
}
