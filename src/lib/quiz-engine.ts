import 'server-only'
import { db } from '@/lib/db'

export type Subject = 'MATEMATIKA' | 'BOSANSKI' | 'ENGLESKI'
export type Mode = 'UCENJE' | 'TEST'
export type Level = 'OSNOVNI' | 'SREDNJI' | 'VISI'

export const SUBJECTS: Record<
  Subject,
  { label: string; testMix: Record<Level, number>; icon: string }
> = {
  MATEMATIKA: { label: 'Matematika', testMix: { OSNOVNI: 4, SREDNJI: 4, VISI: 2 }, icon: 'Sigma' },
  BOSANSKI: { label: 'Bosanski jezik', testMix: { OSNOVNI: 4, SREDNJI: 4, VISI: 2 }, icon: 'BookOpen' },
  ENGLESKI: { label: 'Engleski jezik', testMix: { OSNOVNI: 3, SREDNJI: 4, VISI: 3 }, icon: 'Globe' },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Bira pitanja za sesiju.
 * TEST: po rasporedu ispita (mix po nivoima iz stat sheetova).
 * UCENJE: proporcionalna mjesavina nivoa, opciono filtrirana po temi.
 */
export async function pickQuestionIds(
  subject: Subject,
  mode: Mode,
  count: number,
  topic?: string | null
): Promise<string[]> {
  const where: any = { subject }
  if (topic) where.topic = topic
  const pool = await db.question.findMany({
    where,
    select: { id: true, level: true },
  })
  const byLevel: Record<Level, string[]> = { OSNOVNI: [], SREDNJI: [], VISI: [] }
  for (const q of pool) byLevel[q.level as Level]?.push(q.id)
  for (const lvl of Object.keys(byLevel) as Level[]) byLevel[lvl] = shuffle(byLevel[lvl])

  let mix: Record<Level, number>
  if (mode === 'TEST') {
    mix = SUBJECTS[subject].testMix
  } else {
    // proporcije 40/40/20 zaokruzeno na trazeni broj
    const nB = Math.round(count * 0.4)
    const nS = Math.round(count * 0.4)
    const nV = count - nB - nS
    mix = { OSNOVNI: nB, SREDNJI: nS, VISI: nV }
  }

  const chosen: string[] = []
  for (const lvl of ['OSNOVNI', 'SREDNJI', 'VISI'] as Level[]) {
    const want = Math.min(mix[lvl], byLevel[lvl].length)
    chosen.push(...byLevel[lvl].slice(0, want))
  }
  // popuni manjak iz preostalog bazena (bilo kog nivoa)
  if (chosen.length < count) {
    const rest = shuffle(pool.map(q => q.id).filter(id => !chosen.includes(id)))
    chosen.push(...rest.slice(0, count - chosen.length))
  }
  return shuffle(chosen).slice(0, count)
}

/** Javni oblik pitanja — BEZ correctIndex i rjesenja! */
export function publicQuestion(q: {
  id: string
  subject: string
  topic: string
  level: string
  text: string
  passage: string | null
  image: string | null
  optionsJson: string
}) {
  return {
    id: q.id,
    subject: q.subject,
    topic: q.topic,
    level: q.level,
    text: q.text,
    passage: q.passage,
    image: q.image,
    options: JSON.parse(q.optionsJson) as string[],
  }
}
