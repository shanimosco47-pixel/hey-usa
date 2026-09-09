import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { hasRealFile, isHtmlDocument, fetchHtmlText, openDocumentFile } from '../documentFile'

describe('hasRealFile', () => {
  it('accepts uploaded files and rejects sample placeholders', () => {
    expect(hasRealFile({ file_url: 'https://x.supabase.co/a.html' })).toBe(true)
    expect(hasRealFile({ file_url: 'data:text/html,<b>hi</b>' })).toBe(true)
    expect(hasRealFile({ file_url: '/documents/zion-shuttle.pdf' })).toBe(false)
    expect(hasRealFile({ file_url: undefined })).toBe(false)
  })
})

describe('isHtmlDocument', () => {
  it('detects HTML by content type', () => {
    expect(isHtmlDocument({ file_type: 'text/html', file_url: 'https://x/a' })).toBe(true)
  })

  it('detects HTML by extension when the content type is wrong or missing', () => {
    expect(
      isHtmlDocument({ file_type: 'application/octet-stream', file_url: 'https://x/a.html' }),
    ).toBe(true)
    expect(isHtmlDocument({ file_url: 'https://x/email-123.htm?token=1' })).toBe(true)
  })

  it('leaves other formats alone', () => {
    expect(isHtmlDocument({ file_type: 'application/pdf', file_url: 'https://x/a.pdf' })).toBe(
      false,
    )
    expect(isHtmlDocument({ file_type: 'image/png', file_url: 'https://x/a.png' })).toBe(false)
  })
})

describe('fetchHtmlText', () => {
  it('throws on a failed response instead of returning the error page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('nope') }),
    )
    await expect(fetchHtmlText('https://x/a.html')).rejects.toThrow('HTTP 404')
  })
})

describe('openDocumentFile', () => {
  const tab = { location: { replace: vi.fn() }, opener: {} as unknown }

  beforeEach(() => {
    tab.location.replace = vi.fn()
    vi.stubGlobal('open', vi.fn().mockReturnValue(tab))
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn().mockReturnValue('blob:rendered') })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('re-wraps HTML as a blob so the browser renders it instead of its source', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('<b>booking</b>') }),
    )
    await openDocumentFile({ file_type: 'text/html', file_url: 'https://x/a.html' })
    expect(window.open).toHaveBeenCalledWith('', '_blank')
    expect(tab.location.replace).toHaveBeenCalledWith('blob:rendered')
  })

  it('falls back to the raw file when the download fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await openDocumentFile({ file_type: 'text/html', file_url: 'https://x/a.html' })
    expect(tab.location.replace).toHaveBeenCalledWith('https://x/a.html')
  })

  it('opens non-HTML files directly', async () => {
    await openDocumentFile({ file_type: 'application/pdf', file_url: 'https://x/a.pdf' })
    expect(window.open).toHaveBeenCalledWith('https://x/a.pdf', '_blank', 'noopener')
  })

  it('does nothing for a document without a real file', async () => {
    await openDocumentFile({ file_type: 'application/pdf', file_url: '/documents/a.pdf' })
    expect(window.open).not.toHaveBeenCalled()
  })
})
