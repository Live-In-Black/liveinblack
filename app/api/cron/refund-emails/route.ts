import { runVercelCron } from '@/lib/server/observability'
import { sendPendingContestEmails } from '@/lib/server/refunds/contestEmails'

export const maxDuration = 60

export async function GET(req: Request) {
  return runVercelCron(req, { route: '/api/cron/refund-emails' }, async () => {
    const result = await sendPendingContestEmails()
    const ok = result.failed === 0 && result.uncertain === 0
    return Response.json({ ok, ...result }, { status: ok ? 200 : 503 })
  })
}
