// V1 Benin : aucun checkout gratuit direct. Les places a 0 FCFA restent hors
// tunnel tant qu'un parcours produit explicite n'est pas revalide ; ce service
// historique garde seulement son contrat pour les imports existants.

export type FreeCheckoutInput = {
  userId: string
  eventId: string
  placeId: string
  qty: number
  isTable: boolean
  preorders?: Array<{ name: string; qty: number }>
  ticketPreorders?: Array<{ ticketIndex: number; items: Array<{ name: string; qty: number; showOptionId?: string; showInfo?: string }> }>
}

export type FreeCheckoutResult =
  | { ok: true; orderId: string; eventId: string; ticketCodes: string[] }
  | { ok: false; status: number; error: string }

export async function freeCheckout(input: FreeCheckoutInput): Promise<FreeCheckoutResult> {
  void input
  return { ok: false, status: 410, error: 'free_checkout_disabled_v1' }
}
