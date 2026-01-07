/**
 * IESBA Decision Matrix Service
 * Implements IESBA Code Section 290 decision matrix for PIE + Tax services
 * Pro Version: Returns recommendations (not auto-blocks)
 */

/**
 * Evaluate IESBA decision matrix for request
 * Returns recommendations based on IESBA Code Section 290
 */
export function evaluateIESBADecisionMatrix(requestData) {
  const recommendations = []
  
  const isPIE = requestData.pie_status === 'Yes' || requestData.pie_status === true
  const serviceType = (requestData.service_type || '').toLowerCase()
  const serviceDescription = (requestData.service_description || '').toLowerCase()
  
  // Check if this is a tax service
  const isTaxService = serviceType.includes('tax') || 
                       serviceDescription.includes('tax') ||
                       serviceType.includes('tax compliance') ||
                       serviceType.includes('tax advisory')
  
  if (!isPIE || !isTaxService) {
    // Not applicable - return empty recommendations
    return recommendations
  }
  
  // Determine tax service subtype
  const isTaxPlanning = serviceType.includes('planning') || 
                        serviceType.includes('advisory') ||
                        serviceDescription.includes('tax planning') ||
                        serviceDescription.includes('tax advisory')
  
  const isTaxCompliance = serviceType.includes('compliance') ||
                          serviceDescription.includes('tax compliance') ||
                          serviceDescription.includes('tax return')
  
  // IESBA Decision Matrix: PIE + Tax Services
  
  // Rule 1: PIE + Tax Planning = Prohibited (Hard Red Line)
  if (isTaxPlanning) {
    recommendations.push({
      type: 'pie_tax_planning',
      severity: 'CRITICAL',
      recommendedAction: 'REJECT',
      confidence: 'HIGH',
      reason: 'PIE: Tax Planning is prohibited per IESBA Code Section 290.212',
      regulation: 'IESBA Code Section 290.212',
      canOverride: false,
      overrideGuidance: 'This is a hard prohibition per IESBA. Cannot proceed without exceptional circumstances and documented justification.',
      requiresComplianceReview: true,
      guidance: 'Tax planning services for a PIE audit client are prohibited as they create self-review and advocacy threats that cannot be adequately safeguarded. This is a fundamental independence requirement.'
    })
  }
  
  // Rule 2: PIE + Tax Compliance = Requires Safeguards (High Risk)
  if (isTaxCompliance && !isTaxPlanning) {
    recommendations.push({
      type: 'pie_tax_compliance',
      severity: 'HIGH',
      recommendedAction: 'FLAG',
      confidence: 'HIGH',
      reason: 'PIE: Tax Compliance requires enhanced safeguards per IESBA Code Section 290.212',
      regulation: 'IESBA Code Section 290.212',
      canOverride: true,
      overrideGuidance: 'Override requires Compliance review and documented safeguards. Must ensure no management responsibility and proper safeguards in place.',
      requiresComplianceReview: true,
      guidance: 'Tax compliance services for a PIE audit client are permitted only if: (1) The services do not involve management responsibility, (2) Appropriate safeguards are in place, (3) The services are routine and administrative in nature. Compliance must verify these conditions are met.'
    })
  }
  
  // Rule 3: PIE + Other Tax Services = Review Required
  if (isTaxService && !isTaxPlanning && !isTaxCompliance) {
    recommendations.push({
      type: 'pie_tax_other',
      severity: 'MEDIUM',
      recommendedAction: 'REVIEW',
      confidence: 'MEDIUM',
      reason: 'PIE: Other tax services require careful review per IESBA Code Section 290.212',
      regulation: 'IESBA Code Section 290.212',
      canOverride: true,
      overrideGuidance: 'Override requires Compliance review and documented safeguards.',
      requiresComplianceReview: true,
      guidance: 'Other tax services for a PIE audit client require careful evaluation to ensure independence is not compromised. Compliance must assess the specific nature of the service and apply appropriate safeguards.'
    })
  }
  
  return recommendations
}

/**
 * Check if service involves management responsibility (for tax services)
 */
export function involvesManagementResponsibility(requestData) {
  const serviceDescription = (requestData.service_description || '').toLowerCase()
  
  const managementIndicators = [
    'preparing tax returns',
    'signing tax returns',
    'managing tax obligations',
    'overseeing tax compliance',
    'managing tax strategy'
  ]
  
  return managementIndicators.some(indicator => serviceDescription.includes(indicator))
}

/**
 * Get required safeguards for PIE + Tax Compliance
 */
export function getRequiredSafeguards(requestData) {
  return [
    'No management responsibility for tax matters',
    'Tax services performed by personnel not involved in audit',
    'Tax services reviewed by partner not involved in audit',
    'Client management acknowledges responsibility for tax decisions',
    'Tax services are routine and administrative in nature'
  ]
}

