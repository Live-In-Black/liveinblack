import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CatalogItemCard } from '../MessageThreadParts'
import { parseCatalogItemShare } from '@/lib/shared/catalogItemShare'

vi.mock('next/image', () => ({ default: () => null }))
const render = (value: unknown) => renderToStaticMarkup(<CatalogItemCard content={JSON.stringify(value)} />)

describe('offres partagees lisibles sans fausse devise', () => {
  it('affiche le prix XOF et son unite', () => {
    expect(render({ price: 90000, currency: 'XOF', unit: 'soirée' })).toContain('90000 FCFA / soirée')
  })
  it('conserve un ancien EUR sans conversion', () => {
    const html = render({ price: 120, currency: 'EUR' })
    expect(html).toContain('120 EUR (ancien tarif)')
    expect(html).not.toContain('FCFA')
  })
  it.each([{ price: 120 }, { price: '120', currency: 'XOF' }, { price: 120, currency: 'USD' },
    { price: -1, currency: 'XOF' }, { price: 1.5, currency: 'XOF' }, { price: {}, currency: 'XOF' }])('ne devine pas le prix %j', value => {
    expect(render(value)).toContain('Prix à vérifier')
    expect(render(value)).not.toContain('FCFA')
  })
  it.each([null, [], 'texte', 42])('repli sur JSON non objet %j', value => {
    expect(render(value)).toContain('Offre prestataire')
    expect(render(value)).not.toContain('href=')
  })
  it('supporte JSON invalide et champs structures', () => {
    expect(renderToStaticMarkup(<CatalogItemCard content="{" />)).toContain('Offre prestataire')
    const html = render({ name: {}, category: {}, providerId: {}, unit: [], image: {} })
    expect(html).toContain('Offre')
    expect(html).not.toContain('href=')
  })
  it('encode le lien et echappe les champs texte', () => {
    const html = render({ providerId: ' id/abc?x=1 ', name: '<script>alert(1)</script>' })
    expect(html).toContain('href="/providers/id%2Fabc%3Fx%3D1"')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
  it('ne convertit pas absence de montant en gratuit et accepte zero explicite', () => {
    expect(render({ name: 'Sur devis' })).not.toMatch(/FCFA|Gratuit|Prix à vérifier/)
    expect(render({ price: 0, currency: 'XOF' })).toContain('0 FCFA')
  })
  it('ecarte les images locales ou executables', () => {
    for (const image of ['file:///secret', 'javascript:alert(1)', 'data:image/png;base64,x']) {
      expect(parseCatalogItemShare(JSON.stringify({ image }))?.image).toBeNull()
    }
  })
})
