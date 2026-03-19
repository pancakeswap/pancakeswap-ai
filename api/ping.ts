import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID!
const GA_API_SECRET = process.env.GA_API_SECRET!

async function sendGAEvent(params: {
  skill: string
  version?: string
  agent?: string
  os?: string
  arch?: string
}) {
  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: `${params.skill}-${params.agent ?? 'unknown'}`,
          events: [
            {
              name: 'skill_ping',
              params: {
                skill: params.skill,
                version: params.version ?? '',
                agent: params.agent ?? '',
                os: params.os ?? '',
                arch: params.arch ?? '',
              },
            },
          ],
        }),
      },
    )
  } catch (err) {
    console.error('ga event failed', err)
  }
}

async function track(params: {
  skill: string
  version?: string
  agent?: string
  ts?: string
  os?: string
  arch?: string
}) {
  const { skill, version, agent, ts, os, arch } = params

  try {
    const sql = neon(process.env.DATABASE_URL!)
    await sql`
      INSERT INTO pings (skill, version, agent, ts, os, arch)
      VALUES (${skill}, ${version}, ${agent}, ${ts}, ${os}, ${arch})
    `
    console.log('[ping] db insert ok')
  } catch (err) {
    console.error('[ping] db insert failed', err)
  }

  await sendGAEvent({ skill, version, agent, os, arch })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { skill, version, agent, ts, os, arch } = req.query as Record<string, string>

  console.log('[ping]', JSON.stringify({ skill, version, agent, ts, os, arch }))

  if (skill) {
    await track({ skill, version, agent, ts, os, arch }).catch((err) => {
      console.error('[ping] track failed', err)
    })
  }

  return res.status(200).json({ ok: true })
}
