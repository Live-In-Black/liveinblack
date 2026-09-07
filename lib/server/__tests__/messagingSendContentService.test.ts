import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveSendMessageContent } from '../messaging/messagingSendContentService'
import { getProviderByUserId } from '../provider/providers'
import { getEventById } from '../events/events'

vi.mock('../provider/providers', () => ({ getProviderByUserId: vi.fn() }))

vi.mock('../events/events', () => ({ getEventById: vi.fn() }))

describe('messagingSendContentService', () => {
  const uploadDataUri = vi.fn()
  const deps = {
    uploadDataUri,
    imageMimeTypes: ['image/jpeg'],
    audioMimeTypes: ['audio/mpeg'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refuse un partage catalogue hors conversation directe', async () => {
    const conversation = { _id: 'conv-1', type: 'group', participantIds: ['u1', 'u2'] } as never

    await expect(
      resolveSendMessageContent('u1', conversation, { type: 'catalog_item', content: '', catalogItemId: 'item-1' }, deps),
    ).resolves.toEqual({
      ok: false,
      status: 400,
      error: 'invalid_type',
    })
  })

  it('construit le payload catalogue depuis le vrai profil prestataire', async () => {
    const conversation = { _id: 'conv-1', type: 'direct', participantIds: ['u1', 'u2'] } as never
    vi.mocked(getProviderByUserId).mockResolvedValue({
        name: 'Studio',
        catalogCurrency: 'XOF',
        catalog: [
          {
            id: 'item-1',
            name: 'Pack DJ',
            description: 'Set complet',
            price: 120,
            unit: 'soirée',
            category: 'DJ',
            available: true,
            media: [{ url: 'https://img.test/1.jpg', type: 'image' }],
          },
        ],
    } as never)

    const result = await resolveSendMessageContent(
      'u1',
      conversation,
      { type: 'catalog_item', content: '', catalogItemId: 'item-1' },
      deps,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(JSON.parse(result.content)).toMatchObject({
      providerId: 'u2',
      providerName: 'Studio',
      itemId: 'item-1',
      name: 'Pack DJ',
      currency: 'XOF',
    })
  })

  it('construit le payload événement depuis le vrai document Event', async () => {
    const conversation = { _id: 'conv-1', type: 'direct', participantIds: ['u1', 'u2'] } as never
    vi.mocked(getEventById).mockResolvedValue({
      status: 'ok', event: {
        id: 'event-1',
        name: 'Soirée',
        dateDisplay: 'SAM 22 AOÛT',
        imageUrl: 'https://img.test/event.jpg',
        places: [{ price: 40 }, { price: 15 }],
      },
    } as never)

    const result = await resolveSendMessageContent(
      'u1',
      conversation,
      { type: 'event', content: '', eventId: 'event-1' },
      deps,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(JSON.parse(result.content)).toEqual({
      id: 'event-1',
      name: 'Soirée',
      date: 'SAM 22 AOÛT',
      price: 15,
      currency: 'XOF',
      image: 'https://img.test/event.jpg',
    })
  })

  it('upload le média quand image/voice n’a pas encore d’URL', async () => {
    const conversation = { _id: 'conv-9', type: 'direct', participantIds: ['u1', 'u2'] } as never
    uploadDataUri.mockResolvedValueOnce({ ok: true, url: 'https://cdn.test/img.jpg' })

    const result = await resolveSendMessageContent(
      'u1',
      conversation,
      { type: 'image', content: '', mediaDataUri: 'data:image/jpeg;base64,abc' },
      deps,
    )

    expect(result).toEqual({ ok: true, content: 'https://cdn.test/img.jpg' })
    expect(uploadDataUri).toHaveBeenCalledWith(
      'data:image/jpeg;base64,abc',
      'messages/conv-9',
      { allowedMimeTypes: ['image/jpeg'] },
    )
  })
})
