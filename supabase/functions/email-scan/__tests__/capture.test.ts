import { describe, it, expect } from 'vitest'
import { pickDocumentAttachment } from '../capture'
import type { GmailAttachmentMeta } from '../gmail'

// Four documents in the live database pointed at the same 7.8 KB PNG called
// "Untitled", among them the Staybridge Suites confirmation for the first night
// of the trip; three Odoro receipts all pointed at odoro_logo.jpeg. Opening any
// of them showed the sender's logo instead of the reservation.

function att(over: Partial<GmailAttachmentMeta>): GmailAttachmentMeta {
  return {
    filename: 'file.bin',
    mimeType: 'application/octet-stream',
    attachmentId: 'a1',
    size: 1000,
    inline: false,
    ...over,
  }
}

describe('pickDocumentAttachment', () => {
  it('rejects an embedded logo and falls back to the body', () => {
    expect(
      pickDocumentAttachment([
        att({ filename: 'odoro_logo.jpeg', mimeType: 'image/jpeg', size: 24209, inline: true }),
      ]),
    ).toBeNull()
  })

  it('rejects an image too small to be a document even when not marked inline', () => {
    // The "Untitled" PNG: no Content-ID, but 7.8 KB cannot be a confirmation.
    expect(
      pickDocumentAttachment([
        att({ filename: 'Untitled', mimeType: 'image/png', size: 7827, inline: false }),
      ]),
    ).toBeNull()
  })

  it('keeps a genuine screenshot of a booking', () => {
    const shot = att({ filename: 'ticket.png', mimeType: 'image/png', size: 85742 })
    expect(pickDocumentAttachment([shot])).toBe(shot)
  })

  it('prefers a PDF over any image, whatever the order', () => {
    const pdf = att({ filename: 'receipt.pdf', mimeType: 'application/pdf', size: 360985 })
    const image = att({ filename: 'photo.png', mimeType: 'image/png', size: 900000 })
    expect(pickDocumentAttachment([image, pdf])).toBe(pdf)
  })

  it('takes a PDF even when it is small', () => {
    const pdf = att({ filename: 'ticket.pdf', mimeType: 'application/pdf', size: 4000 })
    expect(pickDocumentAttachment([pdf])).toBe(pdf)
  })

  it('ignores attachment types that are not documents', () => {
    expect(
      pickDocumentAttachment([
        att({ filename: 'cal.ics', mimeType: 'text/calendar', size: 90000 }),
      ]),
    ).toBeNull()
  })
})
