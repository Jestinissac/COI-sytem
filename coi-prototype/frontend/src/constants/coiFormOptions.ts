/**
 * COI form dropdown options. Keep in sync with backend validation when applicable.
 */

export const CLIENT_TYPES = [
  'W.L.L.',
  'W.L.L. Holding',
  'K.S.C.C.',
  'K.S.C.C. (Holding)',
  'K.S.C.P.',
  'K.S.C.P. (Holding)',
  'S.C.P. (Holding)',
  'S.P.C.',
  'S.P.C. Holding',
  'Portfolio',
  'Fund',
  'Scheme',
  'Joint Venture Company',
  'Solidarity Company',
  'Simple Rec. Company',
  'Shares Rec. Company'
] as const

export const REGULATED_BODIES = [
  'MOCI',
  'MOCI & CMA',
  'MOCI & CBK',
  'MOCI, CMA & CBK',
  'MOCI & Boursa',
  'Governmental Authority'
] as const

export const DEADLINE_REASONS: { value: string; label: string }[] = [
  { value: '', label: 'None / No external deadline' },
  { value: 'Regulatory Filing', label: 'Regulatory Filing' },
  { value: 'Client Board Meeting', label: 'Client Board Meeting' },
  { value: 'AGM/Shareholder Meeting', label: 'AGM/Shareholder Meeting' },
  { value: 'Statutory Requirement', label: 'Statutory Requirement' },
  { value: 'Client Contract', label: 'Client Contract Commitment' },
  { value: 'Tender/Bid Deadline', label: 'Tender/Bid Deadline' },
  { value: 'Other', label: 'Other' }
]
