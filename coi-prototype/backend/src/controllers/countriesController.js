import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Get all countries (master data)
 * Access: All authenticated users
 */
export async function getCountries(req, res) {
  try {
    const { region, search } = req.query
    
    let query = `
      SELECT 
        id, country_code, country_name, country_name_ar,
        iso_alpha_2, region, is_active, display_order
      FROM countries
      WHERE is_active = 1
    `
    const params = []
    
    if (region) {
      query += ' AND region = ?'
      params.push(region)
    }
    
    if (search) {
      query += ' AND (country_name LIKE ? OR country_name_ar LIKE ? OR country_code LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    query += ' ORDER BY display_order ASC, country_name ASC'
    
    const countries = db.prepare(query).all(...params)
    
    res.json(countries)
  } catch (error) {
    console.error('Error fetching countries:', error)
    res.status(500).json({ error: 'Failed to load countries.' })
  }
}

/**
 * Get single country by code
 */
export async function getCountry(req, res) {
  try {
    const { code } = req.params
    
    const country = db.prepare(`
      SELECT 
        id, country_code, country_name, country_name_ar,
        iso_alpha_2, region, is_active, display_order
      FROM countries
      WHERE country_code = ? AND is_active = 1
    `).get(code)
    
    if (!country) {
      return res.status(404).json({ error: 'Country not found' })
    }
    
    res.json(country)
  } catch (error) {
    console.error('Error fetching country:', error)
    res.status(500).json({ error: error.message })
  }
}
