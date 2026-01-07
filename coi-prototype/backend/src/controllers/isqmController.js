import { getDatabase } from '../database/init.js';

const db = getDatabase();

// Get ISQM forms for a COI request
export async function getISQMForms(req, res) {
  const { requestId } = req.params;
  
  try {
    const forms = await db.all(
      'SELECT * FROM isqm_forms WHERE coi_request_id = ?',
      [requestId]
    );
    res.json(forms);
  } catch (error) {
    console.error('Error fetching ISQM forms:', error);
    res.status(500).json({ error: 'Failed to fetch ISQM forms' });
  }
}

// Create Client Screening Questionnaire
export async function createClientScreening(req, res) {
  const { requestId } = req.params;
  const userId = req.user?.id;
  const data = req.body;
  
  try {
    const result = await db.run(`
      INSERT INTO isqm_forms (
        coi_request_id, form_type,
        client_background, management_integrity, financial_stability,
        litigation_history, litigation_details,
        regulatory_issues, regulatory_details,
        related_party_concerns, related_party_details,
        politically_exposed, pep_details,
        aml_risk_level, overall_assessment, conditions_notes,
        completed_by, completed_date, status
      ) VALUES (?, 'Client Screening Questionnaire', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `, [
      requestId,
      data.client_background,
      data.management_integrity,
      data.financial_stability,
      data.litigation_history ? 1 : 0,
      data.litigation_details,
      data.regulatory_issues ? 1 : 0,
      data.regulatory_details,
      data.related_party_concerns ? 1 : 0,
      data.related_party_details,
      data.politically_exposed ? 1 : 0,
      data.pep_details,
      data.aml_risk_level,
      data.overall_assessment,
      data.conditions_notes,
      userId,
      data.status || 'Draft'
    ]);
    
    res.json({ success: true, id: result.lastID });
  } catch (error) {
    console.error('Error creating client screening:', error);
    res.status(500).json({ error: 'Failed to create client screening form' });
  }
}

// Create New Client Acceptance Checklist
export async function createClientAcceptance(req, res) {
  const { requestId } = req.params;
  const userId = req.user?.id;
  const data = req.body;
  
  try {
    const result = await db.run(`
      INSERT INTO isqm_forms (
        coi_request_id, form_type,
        engagement_risk_assessment, competence_assessment,
        resource_availability, independence_confirmed,
        fee_arrangement_appropriate, terms_of_engagement_clear,
        overall_assessment, conditions_notes,
        completed_by, completed_date, status
      ) VALUES (?, 'New Client Acceptance Checklist', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `, [
      requestId,
      data.engagement_risk_assessment,
      data.competence_assessment,
      data.resource_availability ? 1 : 0,
      data.independence_confirmed ? 1 : 0,
      data.fee_arrangement_appropriate ? 1 : 0,
      data.terms_of_engagement_clear ? 1 : 0,
      data.overall_assessment,
      data.conditions_notes,
      userId,
      data.status || 'Draft'
    ]);
    
    res.json({ success: true, id: result.lastID });
  } catch (error) {
    console.error('Error creating client acceptance:', error);
    res.status(500).json({ error: 'Failed to create client acceptance form' });
  }
}

// Update ISQM form
export async function updateISQMForm(req, res) {
  const { formId } = req.params;
  const data = req.body;
  
  try {
    const fields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'coi_request_id' && key !== 'form_type') {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    
    fields.push('updated_at = datetime("now")');
    values.push(formId);
    
    await db.run(`UPDATE isqm_forms SET ${fields.join(', ')} WHERE id = ?`, values);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating ISQM form:', error);
    res.status(500).json({ error: 'Failed to update ISQM form' });
  }
}

// Review ISQM form (by compliance/partner)
export async function reviewISQMForm(req, res) {
  const { formId } = req.params;
  const userId = req.user?.id;
  const { status } = req.body;
  
  try {
    await db.run(`
      UPDATE isqm_forms 
      SET status = ?, reviewed_by = ?, reviewed_date = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `, [status, userId, formId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error reviewing ISQM form:', error);
    res.status(500).json({ error: 'Failed to review ISQM form' });
  }
}

