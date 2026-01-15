import { getDatabase } from '../database/init.js'

/**
 * Seed countries master data (ISO 3166-1 standard)
 * Includes all UN member states plus common territories
 */
export function seedCountries() {
  const db = getDatabase()
  
  // ISO 3166-1 alpha-3 country codes with names
  // Focus on GCC and common countries for BDO Kuwait context
  const countries = [
    // GCC Countries (Priority)
    { code: 'KWT', name: 'Kuwait', nameAr: 'الكويت', alpha2: 'KW', region: 'Middle East', order: 1 },
    { code: 'SAU', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', alpha2: 'SA', region: 'Middle East', order: 2 },
    { code: 'ARE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', alpha2: 'AE', region: 'Middle East', order: 3 },
    { code: 'BHR', name: 'Bahrain', nameAr: 'البحرين', alpha2: 'BH', region: 'Middle East', order: 4 },
    { code: 'OMN', name: 'Oman', nameAr: 'عُمان', alpha2: 'OM', region: 'Middle East', order: 5 },
    { code: 'QAT', name: 'Qatar', nameAr: 'قطر', alpha2: 'QA', region: 'Middle East', order: 6 },
    
    // Other Middle East
    { code: 'IRQ', name: 'Iraq', nameAr: 'العراق', alpha2: 'IQ', region: 'Middle East', order: 7 },
    { code: 'IRN', name: 'Iran', nameAr: 'إيران', alpha2: 'IR', region: 'Middle East', order: 8 },
    { code: 'JOR', name: 'Jordan', nameAr: 'الأردن', alpha2: 'JO', region: 'Middle East', order: 9 },
    { code: 'LBN', name: 'Lebanon', nameAr: 'لبنان', alpha2: 'LB', region: 'Middle East', order: 10 },
    { code: 'EGY', name: 'Egypt', nameAr: 'مصر', alpha2: 'EG', region: 'Middle East', order: 11 },
    { code: 'TUR', name: 'Turkey', nameAr: 'تركيا', alpha2: 'TR', region: 'Middle East', order: 12 },
    { code: 'ISR', name: 'Israel', nameAr: 'إسرائيل', alpha2: 'IL', region: 'Middle East', order: 13 },
    
    // Major Global Economies
    { code: 'USA', name: 'United States', nameAr: 'الولايات المتحدة', alpha2: 'US', region: 'North America', order: 20 },
    { code: 'GBR', name: 'United Kingdom', nameAr: 'المملكة المتحدة', alpha2: 'GB', region: 'Europe', order: 21 },
    { code: 'DEU', name: 'Germany', nameAr: 'ألمانيا', alpha2: 'DE', region: 'Europe', order: 22 },
    { code: 'FRA', name: 'France', nameAr: 'فرنسا', alpha2: 'FR', region: 'Europe', order: 23 },
    { code: 'ITA', name: 'Italy', nameAr: 'إيطاليا', alpha2: 'IT', region: 'Europe', order: 24 },
    { code: 'ESP', name: 'Spain', nameAr: 'إسبانيا', alpha2: 'ES', region: 'Europe', order: 25 },
    { code: 'NLD', name: 'Netherlands', nameAr: 'هولندا', alpha2: 'NL', region: 'Europe', order: 26 },
    { code: 'BEL', name: 'Belgium', nameAr: 'بلجيكا', alpha2: 'BE', region: 'Europe', order: 27 },
    { code: 'CHE', name: 'Switzerland', nameAr: 'سويسرا', alpha2: 'CH', region: 'Europe', order: 28 },
    { code: 'AUT', name: 'Austria', nameAr: 'النمسا', alpha2: 'AT', region: 'Europe', order: 29 },
    
    // Asia Pacific
    { code: 'CHN', name: 'China', nameAr: 'الصين', alpha2: 'CN', region: 'Asia', order: 30 },
    { code: 'JPN', name: 'Japan', nameAr: 'اليابان', alpha2: 'JP', region: 'Asia', order: 31 },
    { code: 'IND', name: 'India', nameAr: 'الهند', alpha2: 'IN', region: 'Asia', order: 32 },
    { code: 'SGP', name: 'Singapore', nameAr: 'سنغافورة', alpha2: 'SG', region: 'Asia', order: 33 },
    { code: 'HKG', name: 'Hong Kong', nameAr: 'هونغ كونغ', alpha2: 'HK', region: 'Asia', order: 34 },
    { code: 'KOR', name: 'South Korea', nameAr: 'كوريا الجنوبية', alpha2: 'KR', region: 'Asia', order: 35 },
    { code: 'AUS', name: 'Australia', nameAr: 'أستراليا', alpha2: 'AU', region: 'Oceania', order: 36 },
    { code: 'NZL', name: 'New Zealand', nameAr: 'نيوزيلندا', alpha2: 'NZ', region: 'Oceania', order: 37 },
    
    // Other Common Countries
    { code: 'CAN', name: 'Canada', nameAr: 'كندا', alpha2: 'CA', region: 'North America', order: 40 },
    { code: 'MEX', name: 'Mexico', nameAr: 'المكسيك', alpha2: 'MX', region: 'North America', order: 41 },
    { code: 'BRA', name: 'Brazil', nameAr: 'البرازيل', alpha2: 'BR', region: 'South America', order: 42 },
    { code: 'ARG', name: 'Argentina', nameAr: 'الأرجنتين', alpha2: 'AR', region: 'South America', order: 43 },
    { code: 'ZAF', name: 'South Africa', nameAr: 'جنوب أفريقيا', alpha2: 'ZA', region: 'Africa', order: 44 },
    { code: 'RUS', name: 'Russia', nameAr: 'روسيا', alpha2: 'RU', region: 'Europe', order: 45 },
  ]
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO countries 
    (country_code, country_name, country_name_ar, iso_alpha_2, region, is_active, display_order)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `)
  
  const insertMany = db.transaction((countries) => {
    for (const country of countries) {
      stmt.run(
        country.code,
        country.name,
        country.nameAr || null,
        country.alpha2,
        country.region,
        country.order
      )
    }
  })
  
  insertMany(countries)
  
  console.log(`✅ Seeded ${countries.length} countries`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCountries()
}
