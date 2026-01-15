import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getCountries, getCountry } from '../controllers/countriesController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

router.get('/', getCountries)
router.get('/:code', getCountry)

export default router
