import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EventCard } from '../MessageThreadParts'

const render = (value: unknown) => renderToStaticMarkup(<EventCard content={JSON.stringify(value)} />)

describe('prix historique des cartes evenement', () => {
  it('conserve le montant XOF sans conversion', () => {
    expect(render({ price: 9000, currency: 'XOF' })).toContain('dès 9000 FCFA')
  })
  it('identifie explicitement un ancien montant EUR', () => {
    const html = render({ price: 15, currency: 'EUR' })
    expect(html).toContain('15 EUR (ancien tarif)')
    expect(html).not.toContain('FCFA')
  })
  it.each([
    { price: 15 }, { price: 15, currency: 'USD' }, { price: '15', currency: 'XOF' },
    { price: -1, currency: 'XOF' }, { price: 1.5, currency: 'XOF' },
    { price: {}, currency: 'XOF' },
  ])('ne devine pas le montant ou la devise de %j', value => {
    const html = render(value)
    expect(html).toContain('Prix à vérifier')
    expect(html).not.toMatch(/FCFA|Gratuit/)
  })
  it('ne transforme pas zero en promesse entree gratuite', () => {
    const html = render({ price: 0, currency: 'XOF' })
    expect(html).toContain('0 FCFA')
    expect(html).not.toContain('Gratuit')
  })
  it.each([null, [], 'texte', 42])('affiche un repli pour un snapshot invalide %j', value => {
    expect(render(value)).toContain('Événement')
  })
  it('ignore les champs de texte structures plutot que faire planter React', () => {
    expect(render({ name: {}, date: [], image: {}, id: {} })).toContain('Événement')
  })
  it('accepte un message sans montant et du JSON invalide', () => {
    expect(render({ name: 'Concert' })).not.toContain('Prix à vérifier')
    expect(renderToStaticMarkup(<EventCard content="{" />)).toContain('Événement')
  })
})
