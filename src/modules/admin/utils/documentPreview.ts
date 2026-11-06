export type DocumentKind = 'image' | 'pdf' | 'other'

export class UnsupportedDocumentError extends Error {
  constructor() {
    super('The document is not a valid PDF.')
    this.name = 'UnsupportedDocumentError'
  }
}

export async function loadPdfPreviewBlob(url: string, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(url, { signal, credentials: 'same-origin' })
  if (!response.ok) throw new Error(`Unable to load document (HTTP ${response.status}).`)

  const blob = await response.blob()
  const header = await blob.slice(0, 1024).text()
  if (!header.includes('%PDF-')) throw new UnsupportedDocumentError()

  // A typed local blob avoids the remote object's attachment disposition and
  // incorrect application/octet-stream metadata in the browser PDF viewer.
  return new Blob([blob], { type: 'application/pdf' })
}
