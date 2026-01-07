/**
 * Red Lines Detection Service
 * Identifies critical IESBA red lines that require CRITICAL recommendations
 * Pro Version: Returns recommendations (not auto-blocks)
 */

/**
 * Check for red line violations in request data
 * Returns CRITICAL recommendations for Compliance review
 */
export function checkRedLines(requestData) {
  const redLines = []
  
  // Red Line 1: Management Responsibility
  if (isManagementResponsibilityViolation(requestData)) {
    redLines.push({
      type: 'management_responsibility',
      severity: 'CRITICAL',
      recommendedAction: 'REJECT',
      confidence: 'HIGH',
      reason: 'Management responsibility for financial statements is a red line per IESBA',
      regulation: 'IESBA Code Section 290.104',
      canOverride: true,
      overrideGuidance: 'Override requires Partner approval and documented justification. This is a fundamental independence requirement.',
      requiresComplianceReview: true,
      guidance: 'If the firm or a network firm has management responsibility for an entity, independence is compromised. This cannot be overridden without exceptional circumstances and Partner-level approval.'
    })
  }
  
  // Red Line 2: Advocacy
  if (isAdvocacyViolation(requestData)) {
    redLines.push({
      type: 'advocacy',
      severity: 'CRITICAL',
      recommendedAction: 'REJECT',
      confidence: 'HIGH',
      reason: 'Acting as advocate for client is a red line per IESBA',
      regulation: 'IESBA Code Section 290.105',
      canOverride: true,
      overrideGuidance: 'Override requires Partner approval and documented justification. Advocacy fundamentally compromises objectivity.',
      requiresComplianceReview: true,
      guidance: 'Acting as an advocate for an audit client in litigation or disputes with third parties creates a self-review threat that cannot be adequately safeguarded.'
    })
  }
  
  // Red Line 3: Contingent Fees
  if (isContingentFeeViolation(requestData)) {
    redLines.push({
      type: 'contingent_fees',
      severity: 'CRITICAL',
      recommendedAction: 'REJECT',
      confidence: 'HIGH',
      reason: 'Contingent fees for audit clients are a red line per IESBA',
      regulation: 'IESBA Code Section 290.106',
      canOverride: true,
      overrideGuidance: 'Override requires Partner approval and documented justification. Contingent fees create self-interest threats.',
      requiresComplianceReview: true,
      guidance: 'Contingent fees create a self-interest threat that cannot be adequately safeguarded for audit clients. This is prohibited per IESBA.'
    })
  }
  
  return redLines
}

/**
 * Check if request involves management responsibility
 */
function isManagementResponsibilityViolation(requestData) {
  // Check service description for management responsibility indicators
  const serviceDescription = (requestData.service_description || '').toLowerCase()
  const serviceType = (requestData.service_type || '').toLowerCase()
  
  const managementIndicators = [
    'management responsibility',
    'managing financial statements',
    'preparing financial statements',
    'management of entity',
    'overseeing operations',
    'executive management',
    'management consulting for audit client'
  ]
  
  // If service type is Management Consulting for an audit client
  if (serviceType.includes('management consulting') || serviceType.includes('management')) {
    // Check if this is for an audit client
    // In a real system, we'd check if client has active audit engagement
    // For prototype, we check service description
    return managementIndicators.some(indicator => serviceDescription.includes(indicator))
  }
  
  return false
}

/**
 * Check if request involves advocacy
 */
function isAdvocacyViolation(requestData) {
  const serviceDescription = (requestData.service_description || '').toLowerCase()
  const serviceType = (requestData.service_type || '').toLowerCase()
  
  const advocacyIndicators = [
    'advocate',
    'advocacy',
    'representing client in litigation',
    'representing client in dispute',
    'legal representation',
    'defending client',
    'acting as counsel'
  ]
  
  return advocacyIndicators.some(indicator => 
    serviceDescription.includes(indicator) || serviceType.includes(indicator)
  )
}

/**
 * Check if request involves contingent fees
 */
function isContingentFeeViolation(requestData) {
  // Check if fee structure is contingent
  // In real system, this would come from financial parameters
  // For prototype, check service description or custom fields
  const serviceDescription = (requestData.service_description || '').toLowerCase()
  const customFields = requestData.custom_fields
  
  const contingentIndicators = [
    'contingent fee',
    'contingency fee',
    'success fee',
    'performance-based fee',
    'fee based on outcome',
    'fee contingent on result'
  ]
  
  // Check service description
  if (contingentIndicators.some(indicator => serviceDescription.includes(indicator))) {
    return true
  }
  
  // Check custom fields if available
  if (customFields) {
    try {
      const fields = typeof customFields === 'string' ? JSON.parse(customFields) : customFields
      const feeStructure = (fields.fee_structure || fields.fee_type || '').toLowerCase()
      return contingentIndicators.some(indicator => feeStructure.includes(indicator))
    } catch {
      // Invalid JSON, ignore
    }
  }
  
  return false
}

