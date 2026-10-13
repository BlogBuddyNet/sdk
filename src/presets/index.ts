import { templateDocumentSchema, type TemplateDocument } from '../template-schema'
import { minimalList, minimalPost } from './minimal'
import { cardsList, cardsPost } from './cards'
import { magazineList, magazinePost } from './magazine'

export interface PresetPair {
  list: TemplateDocument
  post: TemplateDocument
}

export const PRESETS: Record<string, PresetPair> = {
  minimal: { list: minimalList, post: minimalPost },
  cards: { list: cardsList, post: cardsPost },
  magazine: { list: magazineList, post: magazinePost },
}

export const DEFAULT_PRESET_ID = 'minimal'

export type PresetId = keyof typeof PRESETS

export function getPreset(id: string): PresetPair {
  return PRESETS[id] ?? PRESETS[DEFAULT_PRESET_ID]
}

for (const [id, pair] of Object.entries(PRESETS)) {
  templateDocumentSchema.parse(pair.list)
  templateDocumentSchema.parse(pair.post)
  void id
}
