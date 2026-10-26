/**
 * Seed skripta: ubacuje 492 pitanja u bazu.
 * - MATEMATIKA: data/matematika.json (267, LaTeX formule, slike, rjesenja)
 * - BOSANSKI: data/bosanski.json (150)
 * - ENGLESKI: data/engleski.json (75)
 *
 * Nivo za matematiku: po id-ju 40% OSNOVNI / 40% SREDNJI / 20% VISI
 * (prati raspored ispita iz MM-STAT: 40/40/20).
 * Pokretanje: bun scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import path from 'path'

const db = new PrismaClient()

interface MathOption { label: string; text: string; image: string | null }
interface MathQ {
  id: number; original_no: number; topic: string; question: string
  images: string[]; options: MathOption[]; correct_letter: string
  correct_index: number; solution: string[]; solution_images: string[]
}
interface BankQ {
  original_no: number; subject: string; topic: string; level: string
  question: string; passage: string | null; options: string[]; correct_index: number
}

function mathLevel(id: number, total: number): string {
  if (id <= Math.round(total * 0.4)) return 'OSNOVNI'
  if (id <= Math.round(total * 0.8)) return 'SREDNJI'
  return 'VISI'
}

function img(p: string | null | undefined): string | null {
  if (!p) return null
  return p.replace(/^media\//, '/quiz-media/')
}

async function main() {
  const existing = await db.question.count()
  if (existing > 0 && !process.argv.includes('--force')) {
    console.log(`Baza vec sadrzi ${existing} pitanja — seed preskocen (koristi 'npm run seed -- --force' za ponovno punjenje).`)
    return
  }

  await db.quizAnswer.deleteMany()
  await db.quizSession.deleteMany()
  await db.question.deleteMany()

  const dataDir = path.join(process.cwd(), 'data')
  const mathRaw = JSON.parse(readFileSync(path.join(dataDir, 'matematika.json'), 'utf-8'))
  const math: MathQ[] = mathRaw.questions
  const bos: BankQ[] = JSON.parse(readFileSync(path.join(dataDir, 'bosanski.json'), 'utf-8'))
  const eng: BankQ[] = JSON.parse(readFileSync(path.join(dataDir, 'engleski.json'), 'utf-8'))

  const rows: any[] = []

  for (const q of math) {
    const optionImages = q.options.map(o => img(o.image)).filter(Boolean)
    rows.push({
      subject: 'MATEMATIKA',
      originalNo: q.original_no,
      topic: q.topic,
      level: mathLevel(q.id, math.length),
      text: q.question,
      passage: null,
      image: q.images && q.images.length ? img(q.images[0]) : (optionImages.length ? optionImages[0] : null),
      optionsJson: JSON.stringify(q.options.map(o => o.text)),
      correctIndex: q.correct_index,
      solutionJson: q.solution && q.solution.length ? JSON.stringify(q.solution) : null,
      solutionImages: q.solution_images && q.solution_images.length ? JSON.stringify(q.solution_images.map(img)) : null,
    })
  }

  for (const q of bos) {
    rows.push({
      subject: 'BOSANSKI',
      originalNo: q.original_no,
      topic: q.topic,
      level: q.level,
      text: q.question,
      passage: q.passage,
      image: null,
      optionsJson: JSON.stringify(q.options),
      correctIndex: q.correct_index,
      solutionJson: null,
      solutionImages: null,
    })
  }

  for (const q of eng) {
    rows.push({
      subject: 'ENGLESKI',
      originalNo: q.original_no,
      topic: q.topic,
      level: q.level,
      text: q.question,
      passage: q.passage,
      image: null,
      optionsJson: JSON.stringify(q.options),
      correctIndex: q.correct_index,
      solutionJson: null,
      solutionImages: null,
    })
  }

  // batch insert
  let n = 0
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100)
    await db.question.createMany({ data: chunk })
    n += chunk.length
    process.stdout.write(`\r${n}/${rows.length}`)
  }
  console.log()

  const cnt = await db.question.groupBy({ by: ['subject'], _count: true })
  console.log('Seed zavrsen:', cnt.map(c => `${c.subject}=${c._count}`).join(', '))
}

main().finally(() => db.$disconnect())
