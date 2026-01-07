import { getDatabase } from '../database/init.js'

const db = getDatabase()

// Seed initial form fields based on current COI template
const initialFields = [
  // Section 1: Requestor Information
  {
    section_id: 'section-1',
    field_id: 'requestor_name',
    field_type: 'text',
    field_label: 'Requestor Name',
    field_placeholder: '',
    is_required: true,
    is_readonly: true,
    source_system: 'HRMS',
    source_field: 'user.name',
    display_order: 1
  },
  {
    section_id: 'section-1',
    field_id: 'designation',
    field_type: 'select',
    field_label: 'Designation',
    field_placeholder: 'Select designation...',
    is_required: true,
    is_readonly: false,
    options: JSON.stringify(['Director', 'Partner', 'Manager', 'Senior Manager']),
    source_system: 'manual',
    display_order: 2
  },
  {
    section_id: 'section-1',
    field_id: 'entity',
    field_type: 'text',
    field_label: 'Entity',
    field_placeholder: 'BDO Al Nisf & Partners',
    is_required: true,
    is_readonly: false,
    default_value: 'BDO Al Nisf & Partners',
    source_system: 'manual',
    display_order: 3
  },
  {
    section_id: 'section-1',
    field_id: 'line_of_service',
    field_type: 'text',
    field_label: 'Line of Service',
    field_placeholder: '',
    is_required: false,
    is_readonly: true,
    source_system: 'HRMS',
    source_field: 'user.department',
    display_order: 4
  },
  
  // Section 2: Document Type
  {
    section_id: 'section-2',
    field_id: 'requested_document',
    field_type: 'select',
    field_label: 'Requested Document',
    field_placeholder: 'Select document type...',
    is_required: true,
    is_readonly: false,
    options: JSON.stringify(['Proposal', 'Engagement Letter']),
    source_system: 'manual',
    display_order: 1
  },
  {
    section_id: 'section-2',
    field_id: 'language',
    field_type: 'select',
    field_label: 'Language',
    field_placeholder: 'Select language...',
    is_required: true,
    is_readonly: false,
    options: JSON.stringify(['English', 'Arabic']),
    default_value: 'English',
    source_system: 'manual',
    display_order: 2
  },
  
  // Section 3: Client Details
  {
    section_id: 'section-3',
    field_id: 'client_id',
    field_type: 'select',
    field_label: 'Client Name',
    field_placeholder: 'Select client...',
    is_required: true,
    is_readonly: false,
    source_system: 'PRMS',
    source_field: 'client.client_name',
    display_order: 1
  },
  {
    section_id: 'section-3',
    field_id: 'client_type',
    field_type: 'select',
    field_label: 'Client Type',
    field_placeholder: 'Select client type...',
    is_required: false,
    is_readonly: false,
    options: JSON.stringify(['Existing', 'New', 'Potential']),
    source_system: 'manual',
    display_order: 2
  },
  {
    section_id: 'section-3',
    field_id: 'parent_company',
    field_type: 'text',
    field_label: 'Parent Company',
    field_placeholder: 'Enter parent company name...',
    is_required: false,
    is_readonly: false,
    conditions: JSON.stringify({
      field: 'pie_status',
      operator: 'equals',
      value: 'Yes'
    }),
    source_system: 'PRMS',
    source_field: 'parent_company.client_name',
    display_order: 3
  },
  
  // Section 4: Service Information
  {
    section_id: 'section-4',
    field_id: 'service_type',
    field_type: 'select',
    field_label: 'Service Type',
    field_placeholder: 'Select service type...',
    is_required: true,
    is_readonly: false,
    options: JSON.stringify([
      'Statutory Audit',
      'External Audit',
      'Tax Compliance',
      'Tax Advisory',
      'Management Consulting',
      'Business Advisory',
      'Internal Audit'
    ]),
    source_system: 'manual',
    display_order: 1
  },
  {
    section_id: 'section-4',
    field_id: 'service_description',
    field_type: 'textarea',
    field_label: 'Service Description',
    field_placeholder: 'Describe the service to be provided...',
    is_required: true,
    is_readonly: false,
    source_system: 'manual',
    display_order: 2
  },
  
  // Section 5: Ownership
  {
    section_id: 'section-5',
    field_id: 'pie_status',
    field_type: 'select',
    field_label: 'PIE Status',
    field_placeholder: 'Select PIE status...',
    is_required: true,
    is_readonly: false,
    options: JSON.stringify(['Yes', 'No']),
    default_value: 'No',
    source_system: 'manual',
    display_order: 1
  },
  
  // Section 7: International Operations
  {
    section_id: 'section-7',
    field_id: 'international_operations',
    field_type: 'select',
    field_label: 'International Operations',
    field_placeholder: 'Select...',
    is_required: false,
    is_readonly: false,
    options: JSON.stringify(['Yes', 'No']),
    default_value: 'No',
    source_system: 'manual',
    display_order: 1
  }
]

// Insert initial fields
const stmt = db.prepare(`
  INSERT INTO form_fields_config (
    section_id, field_id, field_type, field_label, field_placeholder,
    is_required, is_readonly, default_value, options, validation_rules,
    conditions, display_order, source_system, source_field
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const transaction = db.transaction((fields) => {
  for (const field of fields) {
    try {
      stmt.run(
        field.section_id,
        field.field_id,
        field.field_type,
        field.field_label,
        field.field_placeholder || null,
        field.is_required ? 1 : 0,
        field.is_readonly ? 1 : 0,
        field.default_value || null,
        field.options || null,
        field.validation_rules || null,
        field.conditions || null,
        field.display_order || 0,
        field.source_system || 'manual',
        field.source_field || null
      )
    } catch (error) {
      if (!error.message.includes('UNIQUE constraint')) {
        console.error('Error inserting field:', field.field_id, error.message)
      }
    }
  }
})

try {
  transaction(initialFields)
  console.log(`✅ Seeded ${initialFields.length} form fields`)
} catch (error) {
  console.error('Error seeding form fields:', error)
}


