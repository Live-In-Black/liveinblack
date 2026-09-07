export async function readLimitedJson(req: Request, maxBytes: number) {
  const reader = req.body?.getReader()
  if (!reader) return { ok: false, status: 400, error: 'invalid_body' } as const
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      size += part.value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        return { ok: false, status: 413, error: 'body_too_large' } as const
      }
      chunks.push(part.value)
    }
    return { ok: true, value: JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown } as const
  } catch { return { ok: false, status: 400, error: 'invalid_body' } as const }
  finally { reader.releaseLock() }
}
