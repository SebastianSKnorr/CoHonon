/**
 * CoHonon Translation Script
 *
 * Reads locales/en.json (source of truth) and uses Claude to generate
 * context-aware translations for all other languages.
 *
 * Usage: node scripts/translate.mjs
 * Requires: ANTHROPIC_API_KEY in environment (or .env in root)
 *
 * Translations are message-first, not word-by-word. Each paragraph is
 * translated as a complete unit preserving CoHonon's voice and intent.
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __dir = path.dirname(fileURLToPath(import.meta.url))
const root  = path.join(__dir, '..')

// Load .env if present
try {
  const envPath = path.join(root, '.env')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
} catch {}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LANGUAGES = {
  nb: 'Norwegian Bokmål',
  nl: 'Dutch',
  de: 'German',
  zh: 'Simplified Chinese (Mandarin)',
  ja: 'Japanese',
  hi: 'Hindi',
}

const BRAND_CONTEXT = `
CoHonon is a Norwegian technology company building the intelligence layer for physical companions —
think smart plush toys, art objects that can hold a conversation. The brand voice is:
- Minimal and precise — no filler words
- Poetic but grounded — each sentence earns its place
- Nordic restraint — understated, never oversells
- B2B but human — talking to hardware manufacturers and investors, but as people

The founder (Sebastian Knørr) is Norwegian, a former furniture craftsman turned AI entrepreneur.
Canal Creatures is their first product — a limited-edition art object made in Amsterdam.
QuestAI™ is their platform framework — it asks questions rather than delivering answers.

CRITICAL TRANSLATION RULES:
1. Translate each value as a COMPLETE THOUGHT — preserve the rhythm and impact
2. Never translate word-by-word — translate meaning, tone, and message
3. Keep HTML tags exactly as they appear (<em>, <strong>, <br/>) — only translate the text inside
4. Proper nouns that stay in English: CoHonon, QuestAI™, Canal Creatures, Nordic AI, Com2.ai, Coco Li, Sebastian Knørr
5. The → arrow in CTAs should remain as →
6. Maintain the sparse, impactful style — short sentences that land
7. For Japanese: use polite but not overly formal register (丁寧語 not 尊敬語)
8. For Chinese: use Simplified Chinese, clean modern business tone
9. For Hindi: use modern standard Hindi, accessible to educated business readers
10. For Norwegian: the brand is FROM Norway — lean into that quiet pride
`

async function translateLocale(lang, langName, english) {
  console.log(`Translating → ${langName} (${lang})...`)

  const prompt = `${BRAND_CONTEXT}

Translate the following JSON from English to ${langName}.
Return ONLY valid JSON with the same keys, nothing else — no markdown, no explanation, just the JSON object.

Source English JSON:
${JSON.stringify(english, null, 2)}`

  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    console.error(`  ✗ Failed to parse JSON for ${lang}:`, e.message)
    console.error('  Raw response:', cleaned.slice(0, 200))
    return
  }

  const outPath = path.join(root, 'locales', `${lang}.json`)
  fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2) + '\n')
  console.log(`  ✓ Written to locales/${lang}.json`)
}

async function main() {
  const enPath = path.join(root, 'locales', 'en.json')
  if (!fs.existsSync(enPath)) {
    console.error('locales/en.json not found')
    process.exit(1)
  }

  const english = JSON.parse(fs.readFileSync(enPath, 'utf8'))
  console.log(`\nCoHonon Translation Script`)
  console.log(`Source: locales/en.json (${Object.keys(english).length} keys)`)
  console.log(`Target languages: ${Object.values(LANGUAGES).join(', ')}\n`)

  // Translate sequentially to avoid rate limits
  for (const [lang, langName] of Object.entries(LANGUAGES)) {
    await translateLocale(lang, langName, english)
  }

  console.log('\nDone. Commit the updated locales/ files.\n')
}

main().catch(e => { console.error(e); process.exit(1) })
