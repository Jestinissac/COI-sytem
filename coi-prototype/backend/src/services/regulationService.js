/**
 * Regulation Reference Service
 * Provides detailed information and links for regulatory references
 */

// Comprehensive regulation database
const REGULATIONS = {
  // IESBA Code of Ethics
  'IESBA_290': {
    code: 'IESBA 290',
    title: 'Independence - Audit and Review Engagements',
    description: 'Requirements and application material on independence for audit and review engagements.',
    url: 'https://www.ethicsboard.org/international-code-ethics-professional-accountants',
    sections: {
      '290.1': 'Introduction to Independence Requirements',
      '290.4': 'A Conceptual Framework Approach to Independence',
      '290.100': 'Financial Interests',
      '290.124': 'Business Relationships',
      '290.140': 'Family and Personal Relationships',
      '290.150': 'Employment with an Audit Client',
      '290.156': 'Temporary Staff Assignments',
      '290.160': 'Recent Service with an Audit Client',
      '290.164': 'Serving as a Director or Officer',
      '290.178': 'Long Association of Senior Personnel',
      '290.191': 'Provision of Non-Assurance Services',
      '290.200': 'Management Responsibilities',
      '290.206': 'Preparing Accounting Records and Financial Statements',
      '290.210': 'Valuation Services',
      '290.213': 'Taxation Services',
      '290.218': 'Internal Audit Services',
      '290.221': 'IT Systems Services',
      '290.224': 'Litigation Support Services',
      '290.227': 'Legal Services',
      '290.230': 'Recruiting Services',
      '290.232': 'Corporate Finance Services'
    },
    severity: 'CRITICAL',
    jurisdiction: 'International'
  },
  
  'IESBA_291': {
    code: 'IESBA 291',
    title: 'Independence - Other Assurance Engagements',
    description: 'Independence requirements for assurance engagements other than audit and review.',
    url: 'https://www.ethicsboard.org/international-code-ethics-professional-accountants',
    sections: {
      '291.1': 'General Application',
      '291.100': 'Network Firms',
      '291.140': 'Provision of Non-Assurance Services'
    },
    severity: 'HIGH',
    jurisdiction: 'International'
  },
  
  // EU Audit Regulation
  'EU_537_2014': {
    code: 'EU 537/2014',
    title: 'EU Audit Regulation',
    description: 'Specific requirements regarding statutory audit of public-interest entities.',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32014R0537',
    sections: {
      'Article 4': 'Prohibited Non-Audit Services',
      'Article 4(2)': 'Fee Cap (70% Rule)',
      'Article 5': 'Preparation of Audit Committee Reports',
      'Article 17': 'Duration of Audit Engagement',
      'Article 17(7)': 'Rotation Requirements'
    },
    severity: 'CRITICAL',
    jurisdiction: 'European Union'
  },
  
  // PIE Specific
  'PIE_RESTRICTIONS': {
    code: 'PIE Rules',
    title: 'Public Interest Entity Restrictions',
    description: 'Enhanced independence requirements for auditors of public interest entities.',
    url: 'https://www.ethicsboard.org/focus-areas/revisions-definitions-listed-entity-public-interest-entity',
    sections: {
      'Prohibited Services': 'Tax planning, bookkeeping, payroll, internal audit management',
      'Fee Cap': 'Non-audit fees cannot exceed 70% of audit fees (3-year average)',
      'Cooling Off': 'Minimum 2-year period before accepting certain NAS',
      'Partner Rotation': 'Key audit partners rotate every 5-7 years'
    },
    severity: 'CRITICAL',
    jurisdiction: 'EU/International'
  },
  
  // Self-Review Threat
  'SELF_REVIEW': {
    code: 'Self-Review Threat',
    title: 'IESBA Self-Review Threat',
    description: 'The threat that a professional accountant will not appropriately evaluate the results of a previous judgment or service performed.',
    url: 'https://www.ethicsboard.org/international-code-ethics-professional-accountants',
    sections: {
      'Definition': 'Threat from evaluating own work',
      'Examples': 'Preparing financial statements then auditing them, performing valuations used in audit',
      'Safeguards': 'Separate teams, independent review, disclosure to audit committee'
    },
    severity: 'HIGH',
    jurisdiction: 'International'
  },
  
  // Advocacy Threat
  'ADVOCACY': {
    code: 'Advocacy Threat',
    title: 'IESBA Advocacy Threat',
    description: 'The threat that a professional accountant will promote a client position to the point that objectivity is compromised.',
    url: 'https://www.ethicsboard.org/international-code-ethics-professional-accountants',
    sections: {
      'Definition': 'Promoting client position impairs objectivity',
      'Examples': 'Acting as advocate in litigation, promoting client shares',
      'Red Lines': 'Expert witness role, underwriting securities'
    },
    severity: 'CRITICAL',
    jurisdiction: 'International'
  },
  
  // Contingent Fees
  'CONTINGENT_FEES': {
    code: 'Contingent Fee Rules',
    title: 'Prohibition on Contingent Fees',
    description: 'Restrictions on fee arrangements where payment depends on outcome.',
    url: 'https://www.ethicsboard.org/international-code-ethics-professional-accountants',
    sections: {
      'Prohibition': 'Contingent fees prohibited for audit clients',
      'Definition': 'Fees calculated on predetermined basis relating to outcome',
      'Exceptions': 'Some tax contingent fees may be permitted with safeguards'
    },
    severity: 'CRITICAL',
    jurisdiction: 'International'
  },
  
  // Local Standards
  'PCAOB': {
    code: 'PCAOB Rules',
    title: 'PCAOB Independence Standards',
    description: 'US Public Company Accounting Oversight Board independence requirements.',
    url: 'https://pcaobus.org/oversight/standards/auditing-standards',
    sections: {
      'Rule 3520': 'Auditor Independence',
      'Rule 3521': 'Contingent Fees',
      'Rule 3522': 'Tax Transactions',
      'Rule 3523': 'Tax Services for Persons in Financial Reporting Oversight Roles',
      'Rule 3524': 'Audit Committee Pre-Approval of Tax Services',
      'Rule 3525': 'Audit Committee Pre-Approval of Non-Audit Services',
      'Rule 3526': 'Communication with Audit Committees'
    },
    severity: 'CRITICAL',
    jurisdiction: 'United States'
  },
  
  // SOX
  'SOX_201': {
    code: 'SOX Section 201',
    title: 'Sarbanes-Oxley Act Section 201',
    description: 'Services outside the scope of practice of auditors.',
    url: 'https://www.sec.gov/about/laws/soa2002.pdf',
    sections: {
      '201(a)': 'Prohibited Activities',
      '201(g)': 'Pre-Approval Requirements',
      '201(h)': 'Exemptions for Small Issuers'
    },
    severity: 'CRITICAL',
    jurisdiction: 'United States'
  },
  
  // UK FRC
  'FRC_ETHICAL': {
    code: 'FRC Ethical Standard',
    title: 'FRC Ethical Standard 2019',
    description: 'UK Financial Reporting Council ethical standard for auditors.',
    url: 'https://www.frc.org.uk/auditors/audit-assurance/ethical-standard',
    sections: {
      'Section 1': 'Integrity, Objectivity and Independence',
      'Section 2': 'Financial, Business, Employment and Personal Relationships',
      'Section 4': 'Fees, Remuneration and Evaluation Policies',
      'Section 5': 'Non-Audit / Additional Services'
    },
    severity: 'HIGH',
    jurisdiction: 'United Kingdom'
  }
}

// Regulation aliases for common references
const REGULATION_ALIASES = {
  'IESBA Code Section 290': 'IESBA_290',
  'IESBA Code': 'IESBA_290',
  'IESBA': 'IESBA_290',
  'EU Audit Regulation': 'EU_537_2014',
  'EU Audit Regulation Article 4(2)': 'EU_537_2014',
  'EU Audit Regulation Article 4': 'EU_537_2014',
  'PIE': 'PIE_RESTRICTIONS',
  'PIE Rules': 'PIE_RESTRICTIONS',
  'Public Interest Entity': 'PIE_RESTRICTIONS',
  'Self-Review': 'SELF_REVIEW',
  'Self-Review Threat': 'SELF_REVIEW',
  'Advocacy': 'ADVOCACY',
  'Advocacy Threat': 'ADVOCACY',
  'Contingent Fees': 'CONTINGENT_FEES',
  'PCAOB': 'PCAOB',
  'SOX': 'SOX_201',
  'Sarbanes-Oxley': 'SOX_201',
  'FRC': 'FRC_ETHICAL',
  'FRC Ethical Standard': 'FRC_ETHICAL',
  'Local Independence Rules': 'IESBA_290'
}

/**
 * Get regulation details by code or alias
 */
export function getRegulation(codeOrAlias) {
  const key = REGULATION_ALIASES[codeOrAlias] || codeOrAlias
  return REGULATIONS[key] || null
}

/**
 * Get all regulations
 */
export function getAllRegulations() {
  return Object.entries(REGULATIONS).map(([key, reg]) => ({
    key,
    ...reg
  }))
}

/**
 * Search regulations by keyword
 */
export function searchRegulations(keyword) {
  const lowerKeyword = keyword.toLowerCase()
  
  return Object.entries(REGULATIONS)
    .filter(([key, reg]) => {
      return reg.title.toLowerCase().includes(lowerKeyword) ||
        reg.description.toLowerCase().includes(lowerKeyword) ||
        reg.code.toLowerCase().includes(lowerKeyword) ||
        Object.keys(reg.sections).some(s => s.toLowerCase().includes(lowerKeyword)) ||
        Object.values(reg.sections).some(s => s.toLowerCase().includes(lowerKeyword))
    })
    .map(([key, reg]) => ({
      key,
      ...reg
    }))
}

/**
 * Get regulations by severity
 */
export function getRegulationsBySeverity(severity) {
  return Object.entries(REGULATIONS)
    .filter(([_, reg]) => reg.severity === severity)
    .map(([key, reg]) => ({
      key,
      ...reg
    }))
}

/**
 * Get regulations by jurisdiction
 */
export function getRegulationsByJurisdiction(jurisdiction) {
  return Object.entries(REGULATIONS)
    .filter(([_, reg]) => 
      reg.jurisdiction.toLowerCase().includes(jurisdiction.toLowerCase())
    )
    .map(([key, reg]) => ({
      key,
      ...reg
    }))
}

/**
 * Parse regulation reference from text and return enriched object
 */
export function enrichRegulationReference(referenceText) {
  if (!referenceText) return null
  
  // Try exact match first
  let regulation = getRegulation(referenceText)
  
  // Try partial matching
  if (!regulation) {
    for (const [alias, key] of Object.entries(REGULATION_ALIASES)) {
      if (referenceText.toLowerCase().includes(alias.toLowerCase())) {
        regulation = REGULATIONS[key]
        break
      }
    }
  }
  
  // Try keyword search
  if (!regulation) {
    const results = searchRegulations(referenceText)
    if (results.length > 0) {
      regulation = results[0]
    }
  }
  
  if (!regulation) {
    return {
      code: referenceText,
      title: referenceText,
      description: 'External regulatory reference',
      url: null,
      severity: 'MEDIUM',
      isExternal: true
    }
  }
  
  return {
    ...regulation,
    isExternal: false
  }
}

/**
 * Get applicable regulations for a service type
 */
export function getApplicableRegulations(serviceType, isPIE = false, jurisdiction = 'International') {
  const applicable = []
  
  // Always include IESBA
  applicable.push(REGULATIONS['IESBA_290'])
  
  // Add PIE-specific if applicable
  if (isPIE) {
    applicable.push(REGULATIONS['PIE_RESTRICTIONS'])
    applicable.push(REGULATIONS['EU_537_2014'])
  }
  
  // Add service-specific regulations
  const serviceCategories = {
    'Tax': ['IESBA_290', 'PCAOB'],
    'Audit': ['IESBA_290', 'EU_537_2014', 'PCAOB'],
    'Advisory': ['IESBA_290', 'SELF_REVIEW'],
    'Valuation': ['IESBA_290', 'SELF_REVIEW'],
    'Accounting': ['IESBA_290', 'SELF_REVIEW'],
    'Litigation': ['ADVOCACY']
  }
  
  for (const [category, regs] of Object.entries(serviceCategories)) {
    if (serviceType.toLowerCase().includes(category.toLowerCase())) {
      for (const regKey of regs) {
        if (!applicable.find(r => r.code === REGULATIONS[regKey].code)) {
          applicable.push(REGULATIONS[regKey])
        }
      }
    }
  }
  
  // Add jurisdiction-specific
  if (jurisdiction.toLowerCase().includes('us') || jurisdiction.toLowerCase().includes('united states')) {
    if (!applicable.find(r => r.code === 'PCAOB Rules')) {
      applicable.push(REGULATIONS['PCAOB'])
    }
    if (!applicable.find(r => r.code === 'SOX Section 201')) {
      applicable.push(REGULATIONS['SOX_201'])
    }
  }
  
  if (jurisdiction.toLowerCase().includes('uk') || jurisdiction.toLowerCase().includes('united kingdom')) {
    if (!applicable.find(r => r.code === 'FRC Ethical Standard')) {
      applicable.push(REGULATIONS['FRC_ETHICAL'])
    }
  }
  
  return applicable
}

/**
 * Format regulation for frontend display with clickable link
 */
export function formatRegulationForUI(regulation) {
  if (!regulation) return null
  
  return {
    code: regulation.code,
    title: regulation.title,
    description: regulation.description,
    url: regulation.url,
    severity: regulation.severity,
    severityColor: getSeverityColor(regulation.severity),
    jurisdiction: regulation.jurisdiction,
    sections: regulation.sections,
    tooltip: `${regulation.title}: ${regulation.description}`
  }
}

function getSeverityColor(severity) {
  switch (severity) {
    case 'CRITICAL': return 'red'
    case 'HIGH': return 'orange'
    case 'MEDIUM': return 'yellow'
    case 'LOW': return 'green'
    default: return 'gray'
  }
}

export default {
  getRegulation,
  getAllRegulations,
  searchRegulations,
  getRegulationsBySeverity,
  getRegulationsByJurisdiction,
  enrichRegulationReference,
  getApplicableRegulations,
  formatRegulationForUI
}

