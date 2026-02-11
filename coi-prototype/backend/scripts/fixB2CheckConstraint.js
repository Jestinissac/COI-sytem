/**
 * One-time script to fix coi_requests CHECK constraint so director_approval_status
 * (and compliance_review_status, partner_approval_status) allow 'Need More Info' and
 * 'Approved with Restrictions'. Run with backend STOPPED to avoid lock.
 *
 * Usage: cd coi-prototype/backend && node scripts/fixB2CheckConstraint.js
 *        (Stop the backend first to avoid DB lock.)
 */
import { getDatabase } from '../src/database/init.js'

const db = getDatabase()

function runFix() {
  const tableInfo = db.prepare('PRAGMA table_info(coi_requests)').all()
  if (tableInfo.length === 0) {
    console.log('No coi_requests table found. Nothing to fix.')
    return
  }

  const one = db.prepare('SELECT id, director_approval_status FROM coi_requests LIMIT 1').get()
  let needMigration = !one
  if (one) {
    try {
      db.prepare('UPDATE coi_requests SET director_approval_status = ? WHERE id = ?').run('Need More Info', one.id)
      db.prepare('UPDATE coi_requests SET director_approval_status = ? WHERE id = ?').run(one.director_approval_status || 'Pending', one.id)
    } catch (e) {
      if (e.message && e.message.includes('CHECK constraint failed')) needMigration = true
      else throw e
    }
  }

  if (!needMigration) {
    console.log('coi_requests already has expanded CHECK. No change needed.')
    return
  }

  const expandedCheck = " IN ('Pending', 'Approved', 'Approved with Restrictions', 'Need More Info', 'Rejected')"
  const statusColumns = new Set(['director_approval_status', 'compliance_review_status', 'partner_approval_status'])

  const cols = tableInfo.map((col) => {
    const name = col.name
    if (statusColumns.has(name)) {
      return `${name} VARCHAR(50) DEFAULT 'Pending' CHECK (${name}${expandedCheck})`
    }
    const type = col.type || 'TEXT'
    const notnull = col.notnull ? ' NOT NULL' : ''
    const rawDflt = col.dflt_value
    let dflt = ''
    if (rawDflt != null) {
      if (typeof rawDflt === 'number' || (typeof rawDflt === 'string' && /^-?\d+(\.\d+)?$/.test(rawDflt))) {
        dflt = ` DEFAULT ${rawDflt}`
      } else {
        dflt = ` DEFAULT '${String(rawDflt).replace(/'/g, "''")}'`
      }
    }
    const pk = col.pk ? ' PRIMARY KEY' + (name === 'id' && type.toUpperCase().includes('INT') ? ' AUTOINCREMENT' : '') : ''
    return `${name} ${type}${notnull}${dflt}${pk}`
  })

  db.exec('PRAGMA foreign_keys = OFF')
  db.exec(`CREATE TABLE coi_requests_new (${cols.join(', ')})`)
  db.exec('INSERT INTO coi_requests_new SELECT * FROM coi_requests')
  db.exec('DROP TABLE coi_requests')
  db.exec('ALTER TABLE coi_requests_new RENAME TO coi_requests')
  db.exec('PRAGMA foreign_keys = ON')

  try { db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_requester ON coi_requests(requester_id)') } catch (_) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_department ON coi_requests(department)') } catch (_) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_status ON coi_requests(status)') } catch (_) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_client ON coi_requests(client_id)') } catch (_) {}

  console.log('B2: coi_requests CHECK constraints updated for Need More Info.')
}

try {
  runFix()
  process.exit(0)
} catch (err) {
  console.error('fixB2CheckConstraint failed:', err.message)
  try { db.exec('PRAGMA foreign_keys = ON') } catch (_) {}
  process.exit(1)
}
