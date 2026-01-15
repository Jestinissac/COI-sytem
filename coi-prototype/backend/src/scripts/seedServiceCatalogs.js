import { seedKuwaitServiceCatalog } from './seedKuwaitServiceCatalog.js'
import { seedGlobalServiceCatalog } from './seedGlobalServiceCatalog.js'

/**
 * Seed both Kuwait Local and Global Service Catalogs
 * This script seeds:
 * 1. Kuwait Local Catalog (39 services from COI Template)
 * 2. Global Catalog (177+ services from Global COI Form)
 */
export async function seedAllServiceCatalogs() {
  console.log('🌱 Seeding All Service Catalogs...\n')
  
  // Step 1: Seed Kuwait Local Catalog (39 services)
  console.log('📋 Step 1: Seeding Kuwait Local Service Catalog...')
  const kuwaitResult = seedKuwaitServiceCatalog()
  console.log(`   ✅ Kuwait Local: ${kuwaitResult.inserted} services inserted, ${kuwaitResult.skipped} skipped\n`)
  
  // Step 2: Seed Global Catalog (177+ services)
  console.log('🌍 Step 2: Seeding Global Service Catalog...')
  const globalResult = seedGlobalServiceCatalog()
  console.log(`   ✅ Global Catalog: ${globalResult.inserted} services inserted, ${globalResult.skipped} skipped\n`)
  
  // Summary
  const totalInserted = kuwaitResult.inserted + globalResult.inserted
  const totalSkipped = kuwaitResult.skipped + globalResult.skipped
  
  console.log('📊 Summary:')
  console.log(`   Total Services Inserted: ${totalInserted}`)
  console.log(`   Total Services Skipped: ${totalSkipped}`)
  console.log(`   Kuwait Local Services: ${kuwaitResult.total}`)
  console.log(`   Global Services: ${globalResult.inserted}`)
  
  return {
    kuwait: kuwaitResult,
    global: globalResult,
    total: {
      inserted: totalInserted,
      skipped: totalSkipped
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAllServiceCatalogs()
    .then(result => {
      console.log('\n✅ All service catalogs seeded successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Error seeding service catalogs:', error)
      process.exit(1)
    })
}
