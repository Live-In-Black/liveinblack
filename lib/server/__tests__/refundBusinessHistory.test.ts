import { describe, expect, it } from 'vitest'
import { refundBusinessHistory } from '../refunds/publicAudit'

describe('refund business history whitelist', () => {
  it('conserve actions dates et roles dans leur ordre', () => {
    const entries = ['refund_declared', 'refund_contested'].map(action => ({ action, actorRole: 'participant', at: new Date('2026-09-06') }))
    expect(refundBusinessHistory(entries).map(entry => entry.action)).toEqual(['refund_declared', 'refund_contested'])
  })
  it('ne transmet aucun champ additionnel meme imbrique', () => {
    expect(refundBusinessHistory([{ at: '2026-09-06', action: 'refund_declared', actorRole: 'organizer',
      actorId: 'private', metadata: { technical: { ip: 'private' } }, before: 'private', after: 'private', futureField: 'private',
    }])).toEqual([{ at: '2026-09-06T00:00:00.000Z', action: 'refund_declared', actorRole: 'organizer' }])
  })
  it('ignore les entrees malformees sans faire echouer tout le dossier', () => {
    const valid = { at: '2026-09-06', action: 'refund_declared', actorRole: 'organizer' }
    expect(refundBusinessHistory([null, [], 'secret', {}, { ...valid, at: 'invalid' }, { ...valid, actorRole: {} },
      { ...valid, action: '<secret>' }, { ...valid, action: {} }])).toEqual([])
  })
})
