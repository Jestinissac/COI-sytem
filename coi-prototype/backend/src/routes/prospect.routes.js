import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getProspects,
  getProspect,
  createProspect,
  updateProspect,
  convertProspectToClient,
  checkPRMSClient,
  getProspectsByClient
} from '../controllers/prospectController.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/', getProspects)
router.get('/:id', getProspect)
router.post('/', createProspect)
router.put('/:id', updateProspect)
router.post('/:id/convert-to-client', convertProspectToClient)
router.get('/client/:client_id/prospects', getProspectsByClient)
router.get('/prms/check', checkPRMSClient)

export default router
