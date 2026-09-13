import { describe, expect, it } from 'vitest'
import { getRequiredDocs, isValidPhone, sanitizeApplicationFormData, validateOrganizerFormData, validatePrestataireStep0 } from '../applicationValidation'

describe('application validation', () => {
  it('accepts current Benin phone formats', () => {
    expect(isValidPhone('+229', '0196123456')).toBe(true)
    expect(isValidPhone('+229', '0166778899')).toBe(true)
    expect(isValidPhone('+229', '96123456')).toBe(true)
  })

  it('keeps international phone validation working', () => {
    expect(isValidPhone('+33', '0612345678')).toBe(true)
    expect(isValidPhone('+229', '123')).toBe(false)
  })

  const organizer = {
    nomCommercial: 'Studio Cotonou', emailPro: 'contact@example.com',
    telephoneProCode: '+229', telephonePro: '0196123456',
    noFixedAddress: true, pays: 'Bénin', ville: 'Cotonou',
    typeEtablissement: 'Autre', typeEtablissementCustom: 'Collectif',
  }

  it('accepts an organizer application without an enterprise identifier', () => {
    expect(validateOrganizerFormData(organizer)).toEqual({ ok: true })
  })

  it('filters historical enterprise identifiers before persistence', () => {
    const clean = sanitizeApplicationFormData('organisateur', { ...organizer, siret: 'ancien-dossier', rccm: 'old', ifu: 'old' })
    expect(clean).not.toHaveProperty('siret')
    expect(clean).not.toHaveProperty('rccm')
    expect(clean).not.toHaveProperty('ifu')
    expect(validateOrganizerFormData(clean)).toEqual({ ok: true })
  })

  it('still validates the identity and activity fields', () => {
    expect(validateOrganizerFormData({ ...organizer, emailPro: 'invalid' }).ok).toBe(false)
    expect(validateOrganizerFormData({ ...organizer, nomCommercial: '' }).ok).toBe(false)
    expect(validateOrganizerFormData({ ...organizer, pays: 'France' }).ok).toBe(false)
  })

  it('requires only the account holder identity for organizer applications', () => {
    expect(getRequiredDocs('organisateur')).toEqual(['identity'])
  })

  it('requires only the account holder identity for provider applications', () => {
    expect(getRequiredDocs('prestataire', ['artiste', 'salle', 'food'])).toEqual(['identity'])
  })

  it('does not ask providers for an enterprise identifier', () => {
    const clean = sanitizeApplicationFormData('prestataire', { prenom: 'A', nom: 'B', pays: 'Bénin', telephoneCode: '+229', telephone: '0196123456', siret: 'ancien-dossier', tarifMin: 1000, tarifType: 'heure' })
    expect(clean).not.toHaveProperty('siret')
    expect(clean).not.toHaveProperty('tarifMin')
    expect(clean).not.toHaveProperty('tarifType')
    expect(validatePrestataireStep0(clean)).toEqual({ ok: true })
  })
})
