import { getDatabase } from '../database/init.js';

const db = getDatabase();

// Get Global COI submission for a request
export async function getGlobalSubmission(req, res) {
  const { requestId } = req.params;
  
  try {
    const submission = await db.get(
      'SELECT * FROM global_coi_submissions WHERE coi_request_id = ?',
      [requestId]
    );
    res.json(submission || null);
  } catch (error) {
    console.error('Error fetching global submission:', error);
    res.status(500).json({ error: 'Failed to fetch global submission' });
  }
}

// Create Global COI submission
export async function createGlobalSubmission(req, res) {
  const { requestId } = req.params;
  const data = req.body;
  
  try {
    const result = await db.run(`
      INSERT INTO global_coi_submissions (
        coi_request_id, member_firm, engagement_type,
        client_name, client_country,
        parent_entity_name, parent_entity_country,
        service_description, service_start_date, service_end_date,
        engagement_partner, estimated_fees, fee_currency,
        foreign_offices_involved, submission_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [
      requestId,
      data.member_firm || 'BDO Al Nisf & Partners',
      data.engagement_type,
      data.client_name,
      data.client_country,
      data.parent_entity_name,
      data.parent_entity_country,
      data.service_description,
      data.service_start_date,
      data.service_end_date,
      data.engagement_partner,
      data.estimated_fees,
      data.fee_currency || 'KWD',
      JSON.stringify(data.foreign_offices_involved || [])
    ]);
    
    res.json({ success: true, id: result.lastID });
  } catch (error) {
    console.error('Error creating global submission:', error);
    res.status(500).json({ error: 'Failed to create global submission' });
  }
}

// Update Global COI submission
export async function updateGlobalSubmission(req, res) {
  const { submissionId } = req.params;
  const data = req.body;
  
  try {
    await db.run(`
      UPDATE global_coi_submissions SET
        member_firm = ?, engagement_type = ?,
        client_name = ?, client_country = ?,
        parent_entity_name = ?, parent_entity_country = ?,
        service_description = ?, service_start_date = ?, service_end_date = ?,
        engagement_partner = ?, estimated_fees = ?, fee_currency = ?,
        foreign_offices_involved = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      data.member_firm,
      data.engagement_type,
      data.client_name,
      data.client_country,
      data.parent_entity_name,
      data.parent_entity_country,
      data.service_description,
      data.service_start_date,
      data.service_end_date,
      data.engagement_partner,
      data.estimated_fees,
      data.fee_currency,
      JSON.stringify(data.foreign_offices_involved || []),
      submissionId
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating global submission:', error);
    res.status(500).json({ error: 'Failed to update global submission' });
  }
}

// Export to Excel format (returns data for frontend to generate Excel)
export async function exportToExcel(req, res) {
  const { requestId } = req.params;
  const userId = req.userId;
  
  try {
    const submission = await db.get(
      'SELECT * FROM global_coi_submissions WHERE coi_request_id = ?',
      [requestId]
    );
    
    if (!submission) {
      return res.status(404).json({ error: 'Global submission not found' });
    }
    
    // Mark as exported
    await db.run(`
      UPDATE global_coi_submissions 
      SET excel_exported = 1, excel_export_date = datetime('now'), exported_by = ?
      WHERE id = ?
    `, [userId, submission.id]);
    
    // Format data for Global COI Portal Excel template
    const excelData = {
      headers: [
        'Member Firm',
        'Engagement Type',
        'Client Name',
        'Client Country',
        'Parent Entity Name',
        'Parent Entity Country',
        'Service Description',
        'Service Start Date',
        'Service End Date',
        'Engagement Partner',
        'Estimated Fees',
        'Fee Currency',
        'Foreign Offices Involved',
        'Submission Date',
        'Reference Number'
      ],
      data: [[
        submission.member_firm,
        submission.engagement_type,
        submission.client_name,
        submission.client_country,
        submission.parent_entity_name,
        submission.parent_entity_country,
        submission.service_description,
        submission.service_start_date,
        submission.service_end_date,
        submission.engagement_partner,
        submission.estimated_fees,
        submission.fee_currency,
        submission.foreign_offices_involved,
        submission.submission_date,
        submission.global_reference_number || 'Pending'
      ]],
      filename: `Global_COI_${requestId}_${new Date().toISOString().split('T')[0]}.xlsx`
    };
    
    res.json(excelData);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
}

// Update submission status (from Global Portal response)
export async function updateSubmissionStatus(req, res) {
  const { submissionId } = req.params;
  const { status, reference_number, notes } = req.body;
  
  try {
    await db.run(`
      UPDATE global_coi_submissions SET
        submission_status = ?,
        global_reference_number = ?,
        global_notes = ?,
        global_response_date = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `, [status, reference_number, notes, submissionId]);
    
    // Also update the COI request's global clearance status
    const submission = await db.get('SELECT coi_request_id FROM global_coi_submissions WHERE id = ?', [submissionId]);
    if (submission) {
      let clearanceStatus = 'Pending';
      if (status === 'Approved') clearanceStatus = 'Approved';
      else if (status === 'Rejected') clearanceStatus = 'Rejected';
      else if (status === 'More Info Required') clearanceStatus = 'More Info Required';
      
      await db.run(`
        UPDATE coi_requests SET
          global_clearance_status = ?,
          global_clearance_date = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `, [clearanceStatus, submission.coi_request_id]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({ error: 'Failed to update submission status' });
  }
}

// Get all pending international submissions
export async function getPendingSubmissions(req, res) {
  try {
    const submissions = await db.all(`
      SELECT g.*, r.request_id, c.client_name as coi_client_name
      FROM global_coi_submissions g
      JOIN coi_requests r ON g.coi_request_id = r.id
      JOIN clients c ON r.client_id = c.id
      WHERE g.submission_status IN ('Pending', 'More Info Required')
      ORDER BY g.created_at DESC
    `);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    res.status(500).json({ error: 'Failed to fetch pending submissions' });
  }
}

