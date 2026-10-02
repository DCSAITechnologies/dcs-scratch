// Public build-status system (spec §15–19, Completion Spec §8).
// The data lives in platform-status.json — the dashboard reads the SAME file,
// so site and console can never diverge. This module is the typed accessor.
// Launch flip: edit the JSON (claim_level / as_of / item rows); nothing else changes.

import statusJson from './platform-status.json'
import { TOTAL_CATALOGUED, RUNTIME_VERIFIED_COUNT } from 'virtual:catalogue-summary'

export const CONNECTOR_COUNT = TOTAL_CATALOGUED

export type ClaimLevel = 'HERMETIC' | 'STAGING' | 'PRODUCTION'
export const CLAIM_LEVEL: ClaimLevel = statusJson.claim_level as ClaimLevel
export const STATUS_AS_OF: string = statusJson.as_of

export type StatusLabel =
  | 'Complete'
  | 'Complete (integrated)'
  | 'Complete (hermetically proven)'
  | 'In progress'
  | 'Pending'
  | 'Pending (release gate)'
  | 'External dependency'

export type StatusItem = {
  id: number
  name: string
  label: StatusLabel
  note: string
  pages: string[]
}

// {COUNT} in notes is computed from the live catalogue (gate G9 — no hard-coded counts).
const expand = (s: string) => s.replaceAll('{COUNT}', String(CONNECTOR_COUNT))

export const STATUS_ITEMS: StatusItem[] = statusJson.items.map((i) => ({
  ...i,
  label: i.label as StatusLabel,
  note: expand(i.note),
}))

// §17.2 — the three vocabularies, chosen by CLAIM_LEVEL (gate G10).
export const VOCAB = {
  overall: {
    HERMETIC: 'Integrated and proven end-to-end against simulated providers. Not yet verified with real providers.',
    STAGING: 'Verified with real providers on the staging build. Not yet in production.',
    PRODUCTION: 'In controlled production.',
  },
  receipts: {
    HERMETIC: 'Receipts are issued and verified in the integrated build with a test signer.',
    STAGING: 'Receipts are issued and verified on staging with production key custody.',
    PRODUCTION: 'Receipts are issued in production and independently verifiable.',
  },
  mode2: {
    HERMETIC: 'Integrated; not enabled for customers.',
    STAGING: 'Available on staging, opt-in per tenant.',
    PRODUCTION: 'Available, opt-in per tenant per connector.',
  },
  connectorCount: {
    HERMETIC: `${CONNECTOR_COUNT} catalogued connectors; runtime verification is published per connector as it is earned (${RUNTIME_VERIFIED_COUNT} runtime-verified today).`,
    STAGING: `${CONNECTOR_COUNT} catalogued connectors; runtime verification is published per connector as it is earned (${RUNTIME_VERIFIED_COUNT} runtime-verified today).`,
    PRODUCTION: `${CONNECTOR_COUNT} catalogued connectors; runtime verification is published per connector as it is earned (${RUNTIME_VERIFIED_COUNT} runtime-verified today).`,
  },
  assurance: {
    HERMETIC: 'No certification or external audit claimed.',
    STAGING: 'No certification or external audit claimed.',
    PRODUCTION: 'No certification or external audit claimed.',
  },
} as const

export type VocabKey = keyof typeof VOCAB

// G10: render vocabulary for ANY claim level (snapshot tests use this).
export const vocabFor = (key: VocabKey, level: ClaimLevel) => VOCAB[key][level]

export const v = (key: VocabKey) => vocabFor(key, CLAIM_LEVEL)

export const statusFor = (route: string): StatusItem[] =>
  STATUS_ITEMS.filter((i) => i.pages.includes(route))

export const labelColor = (l: StatusLabel): string =>
  l.startsWith('Complete') ? '#21C87A'
  : l === 'In progress' ? '#F5A524'
  : l === 'External dependency' ? '#4D8DFF'
  : '#93A0C2'
