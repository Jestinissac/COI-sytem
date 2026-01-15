import { getDatabase } from '../database/init.js'

const db = getDatabase()

export function seedEntityCodes() {
  console.log('🌱 Seeding entity codes...')
  
  const defaultEntities = [
    {
      entity_code: 'BDO_AL_NISF',
      entity_name: 'BDO Al Nisf & Partners',
      entity_display_name: 'BDO Al Nisf & Partners',
      is_active: 1,
      is_default: 1,
      catalog_mode: 'independent'
    },
    {
      entity_code: 'BDO_CONSULTING',
      entity_name: 'BDO Consulting',
      entity_display_name: 'BDO Consulting',
      is_active: 1,
      is_default: 0,
      catalog_mode: 'independent'
    }
  ]
  
  const insertEntity = db.prepare(`
    INSERT OR IGNORE INTO entity_codes (
      entity_code, entity_name, entity_display_name,
      is_active, is_default, catalog_mode
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  let inserted = 0
  for (const entity of defaultEntities) {
    try {
      insertEntity.run(
        entity.entity_code,
        entity.entity_name,
        entity.entity_display_name,
        entity.is_active,
        entity.is_default,
        entity.catalog_mode
      )
      inserted++
    } catch (error) {
      if (!error.message.includes('UNIQUE constraint')) {
        console.error(`Error seeding entity ${entity.entity_code}:`, error.message)
      }
    }
  }
  
  console.log(`✅ Seeded ${inserted} entity codes`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEntityCodes()
}
