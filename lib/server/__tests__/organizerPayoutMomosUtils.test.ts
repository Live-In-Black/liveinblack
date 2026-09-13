import { describe, expect, it } from 'vitest'
import { canRearmPayout, isRearmableFailCode, momosToRecord, resolvePayoutMomoCountry, sanitizePayoutMomos } from '../organizer/organizerPayoutMomosUtils'

describe('organizerPayoutMomosUtils', () => {
  it('convertit une Map ou un objet simple en record', () => {
    expect(momosToRecord(new Map([['bj', '+2290197000000']]))).toEqual({ bj: '+2290197000000' })
    expect(momosToRecord({ bj: '+22991111111' })).toEqual({ bj: '+22991111111' })
    expect(momosToRecord(null)).toEqual({})
  })

  it('nettoie les numéros valides et ignore les valeurs vides', () => {
    expect(sanitizePayoutMomos({ bj: '+229 01 97 00 00 00', tg: '   ' })).toEqual({
      ok: true,
      momos: { bj: '+2290197000000' },
    })
    expect(sanitizePayoutMomos({ bj: '+229 91 11 11 11' })).toEqual({
      ok: true,
      momos: { bj: '+22991111111' },
    })
  })

  it('remonte une erreur quand un numéro est invalide', () => {
    const result = sanitizePayoutMomos({ bj: '+228 90 00 00 00' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('Numéro invalide pour Bénin')
  })

  it('refuse les pays Mobile Money historiques hors Bénin', () => {
    const result = sanitizePayoutMomos({ tg: '+228 90 00 00 00' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('Pays Mobile Money inconnu.')
  })

  it('reconnaît les codes d’échec réarmables', () => {
    expect(isRearmableFailCode('no_momo_number')).toBe(true)
    expect(isRearmableFailCode('country_undetermined')).toBe(true)
    expect(isRearmableFailCode('payout_rejected')).toBe(false)
  })

  it('résout le pays de versement depuis le payout ou la région de l’événement', () => {
    expect(resolvePayoutMomoCountry({ momoCountry: 'bj' }, { region: 'Bénin' })).toBe('bj')
    expect(resolvePayoutMomoCountry({ momoCountry: null }, { region: 'Bénin' })).toBe('bj')
    expect(resolvePayoutMomoCountry({ momoCountry: 'tg' }, { region: 'Togo' })).toBeNull()
    expect(resolvePayoutMomoCountry({ momoCountry: '' }, { region: 'Togo' })).toBeNull()
    expect(resolvePayoutMomoCountry({ momoCountry: null }, { region: 'Unknown' })).toBeNull()
  })

  it('autorise le réarmement uniquement si la cause est levée', () => {
    expect(
      canRearmPayout(
        { failCode: 'country_undetermined', momoCountry: null },
        { region: 'Bénin', cancelled: false },
        { bj: '+22991111111' }
      )
    ).toEqual({ ok: true, eventCountry: 'bj' })

    expect(
      canRearmPayout(
        { failCode: 'payout_rejected', momoCountry: 'tg' },
        { region: 'Togo', cancelled: false },
        { tg: '+22890000000' }
      )
    ).toEqual({ ok: false })

    expect(
      canRearmPayout(
        { failCode: 'no_momo_number', momoCountry: null },
        { region: 'Togo', cancelled: true },
        { tg: '+22890000000' }
      )
    ).toEqual({ ok: false })

    expect(
      canRearmPayout(
        { failCode: 'no_momo_number', momoCountry: 'bj' },
        { region: 'Unknown', cancelled: false },
        { bj: '+2290197000000' }
      )
    ).toEqual({ ok: true, eventCountry: 'bj' })

    expect(
      canRearmPayout(
        { failCode: 'no_momo_number', momoCountry: null },
        { region: 'Togo', cancelled: false },
        {}
      )
    ).toEqual({ ok: false })
  })
})
