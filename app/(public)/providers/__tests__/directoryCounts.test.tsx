import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Page from '../page'
import { PROVIDER_CATEGORIES } from '@/lib/shared/providerCategories'

const mocks = vi.hoisted(() => ({ directory: vi.fn() }))
vi.mock('@/lib/server/publicCache', () => ({ getCachedPublicProvidersDirectory: mocks.directory }))
vi.mock('@/app/components/ui', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  HiddenField: () => null,
  Input: () => <input />,
  PageLinks: () => null,
}))
vi.mock('../../_components/FilterSelect', () => ({ default: () => null }))
vi.mock('../../_components/ProviderDirectoryCard', () => ({ default: () => null }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.directory.mockImplementation(async ({ categorie }: { categorie?: string }) => ({
    providers: [], total: categorie ? 2 : 3, pageSize: 24, totalPages: 1,
  }))
})

describe('provider directory category counts', () => {
  it('counts all distinct profiles without the selected category and keeps every category', async () => {
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({
      q: 'photo', categorie: PROVIDER_CATEGORIES[0].id, region: 'benin', page: '2',
    }) }))
    expect(html).toContain('Tous <span>3</span>')
    expect(mocks.directory).toHaveBeenCalledWith({
      q: 'photo', region: 'benin', page: 1, pageSize: 12, includeTotal: true,
    })
    for (const category of PROVIDER_CATEGORIES) {
      expect(html).toContain(renderToStaticMarkup(<>{category.label} <span>2</span></>))
    }
  })

  it('reuses the unfiltered total when no category is selected', async () => {
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }))
    expect(html).toContain('Tous <span>3</span>')
    expect(mocks.directory).toHaveBeenCalledTimes(PROVIDER_CATEGORIES.length + 1)
  })

  it('keeps alternative categories available when the selected one is empty', async () => {
    const selected = PROVIDER_CATEGORIES[0].id
    mocks.directory.mockImplementation(async ({ categorie }: { categorie?: string }) => ({
      providers: [], total: categorie === selected ? 0 : 3, pageSize: 24, totalPages: 1,
    }))
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ categorie: selected }) }))
    expect(html).toContain('Tous <span>3</span>')
    expect(html).toContain(renderToStaticMarkup(<>{PROVIDER_CATEGORIES[1].label} <span>3</span></>))
  })
})
