import { getDb } from '@/lib/db/mongoose'
import User from '@/lib/models/User'
import SellerBalance from '@/lib/models/SellerBalance'
import {
  buildPayoutStatusView,
  type PayoutStatusView,
} from './organizerPayoutsUtils'

// V1 Bénin : l'organisateur configure FedaPay Marketplace via
// organizerPayoutMomos.ts. Les anciens flux Stripe Connect et demandes de
// reversement différé restent fermés ici, même si une vieille route les appelle.

export interface PayoutCaller {
  id: string
}

type ErrResult = { ok: false; status: number; error: string }

export type GetPayoutStatusResult = ErrResult | { ok: true; view: PayoutStatusView }

export async function getPayoutStatus(caller: PayoutCaller): Promise<GetPayoutStatusResult> {
  await getDb()

  const user = await User.findById(caller.id).lean()
  if (!user) return { ok: false, status: 404, error: 'user_not_found' }

  const balance = await SellerBalance.findOne({ sellerUid: caller.id }).lean()

  return {
    ok: true,
    view: buildPayoutStatusView(user, balance),
  }
}

export interface StartOnboardingInput {
  returnPath?: string
}

export type StartOnboardingResult = ErrResult | { ok: true; url: string } | { ok: true; manual: true; country: string }

export async function startStripeConnectOnboarding(caller: PayoutCaller, input: StartOnboardingInput): Promise<StartOnboardingResult> {
  void caller
  void input
  return { ok: false, status: 410, error: 'stripe_connect_disabled_v1' }
}

export type RequestManualPayoutResult = ErrResult | { ok: true; requestId: string; amountDueCents: number; amountDueXOF: number }

export async function requestManualPayout(caller: PayoutCaller): Promise<RequestManualPayoutResult> {
  void caller
  return { ok: false, status: 410, error: 'manual_payout_request_disabled_v1' }
}
