import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('scanner V1 source guards', () => {
  const source = readFileSync('app/(app)/scanner/[eventId]/ScannerClient.tsx', 'utf8')
  it('does not expose a standalone purchase or quantity editor', () => {
    expect(source).not.toMatch(/\/api\/event-orders\/(add|update-quantity)|handleAddItem|handleSetQuantity|StepButton|Ajouter au menu/)
    expect(source).toContain('Aucun ajout sur place')
  })
  it('keeps checkin, fulfillment, legacy settlement and audit paths', () => {
    for (const path of ['/api/tickets/checkin', '/api/event-orders/serve', '/api/event-orders/pay', '/api/event-orders/cancel']) {
      expect(source).toContain(path)
    }
    expect(source).toContain('/log')
  })
})
