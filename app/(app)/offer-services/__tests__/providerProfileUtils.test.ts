import { describe, expect, it } from 'vitest'
import {
  applyPrimaryRegionChange,
  catalogCategoriesForProviderTypes,
  comparableProviderProfile,
  toggleProviderCategorySelection,
  toggleProviderZoneSelection,
} from '../providerProfileUtils'

describe('providerProfileUtils', () => {
  it('normalise le profil comparable pour détecter les vraies modifications', () => {
    const a = comparableProviderProfile({
      name: ' Nina ',
      headline: ' DJ ',
      description: ' Afro house ',
      city: ' Paris ',
      regionId: 'idf',
      website: '',
      socialLinks: { instagram: '', tiktok: '', x: '', facebook: '', youtube: '', linkedin: '', website: ' https://site.test ' },
      prestataireTypes: ['dj'],
      zonesIntervention: ['idf'],
    })
    const b = comparableProviderProfile({
      name: 'Nina',
      headline: 'DJ',
      description: 'Afro house',
      city: 'Paris',
      regionId: 'idf',
      website: 'https://legacy.test',
      socialLinks: { instagram: '', tiktok: '', x: '', facebook: '', youtube: '', linkedin: '', website: 'https://site.test' },
      prestataireTypes: ['dj'],
      zonesIntervention: ['idf'],
    })
    expect(a).toBe(b)
  })

  it('gère le toggle des catégories prestataire avec la règle "autre"', () => {
    expect(toggleProviderCategorySelection(['autre'], 'dj')).toEqual(['dj'])
    expect(toggleProviderCategorySelection(['dj', 'photo'], 'autre')).toEqual(['autre'])
    expect(toggleProviderCategorySelection(['dj', 'photo'], 'photo')).toEqual(['dj'])
  })

  it('gère correctement les zones d’intervention V1 Bénin', () => {
    expect(toggleProviderZoneSelection(['benin'], 'benin', 'benin')).toEqual(['benin'])
    expect(toggleProviderZoneSelection(['international'], 'benin', 'benin')).toEqual(['benin'])
    expect(toggleProviderZoneSelection([], 'benin', 'benin')).toEqual(['benin'])
  })

  it('déplace la région principale sans perdre les zones locales', () => {
    expect(applyPrimaryRegionChange(['idf', 'naq'], 'idf', 'ara')).toEqual(['ara', 'naq'])
    expect(applyPrimaryRegionChange(['international'], 'idf', 'ara')).toEqual(['ara'])
  })

  it('déduit les catégories catalogue sans doublons', () => {
    const categories = catalogCategoriesForProviderTypes(['dj', 'beaute', 'dj'])
    expect(categories.length).toBeGreaterThan(0)
    expect(new Set(categories).size).toBe(categories.length)
  })
})
