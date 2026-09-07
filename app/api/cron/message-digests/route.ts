import { runVercelCron } from '@/lib/server/observability'
import { sendPendingMessageDigests } from '@/lib/server/messaging/messageDigests'

export const maxDuration = 60

export async function GET(req: Request) {
  return runVercelCron(req, { route: '/api/cron/message-digests' }, async () => {
    const result = await sendPendingMessageDigests()
    const ok = result.failed === 0 && result.uncertain === 0
    return Response.json({ ok, ...result }, { status: ok ? 200 : 503 })
  })
}
