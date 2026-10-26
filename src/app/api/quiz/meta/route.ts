import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** Javni metapodaci: broj pitanja po predmetu/temi/nivou. Bez sadržaja pitanja. */
export async function GET() {
  const rows = await db.question.groupBy({
    by: ['subject', 'topic', 'level'],
    _count: true,
  })
  const subjects: Record<
    string,
    { total: number; topics: Record<string, number> }
  > = {}
  for (const r of rows) {
    const s = (subjects[r.subject] ||= { total: 0, topics: {} })
    s.total += r._count
    s.topics[r.topic] = (s.topics[r.topic] || 0) + r._count
  }
  return NextResponse.json({ subjects })
}
