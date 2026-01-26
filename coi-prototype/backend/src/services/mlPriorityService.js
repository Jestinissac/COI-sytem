import { execFile } from 'child_process'
import { promisify } from 'util'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getDatabase } from '../database/init.js'
import { calculateSLAStatus } from './slaService.js'

const execFileAsync = promisify(execFile)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * ML Priority Service
 * Bridge between Node.js and Python ML model for priority predictions
 */

let mlModelAvailable = false
let mlModelInfo = null

/**
 * Initialize ML model - check if active model exists
 */
export async function initializeMLModel() {
  try {
    const db = getDatabase()
    
    const mlConfig = db.prepare(`
      SELECT * FROM ml_weights 
      WHERE model_type = 'priority_weights' 
      AND is_active = 1 
      ORDER BY trained_at DESC 
      LIMIT 1
    `).get()
    
    if (mlConfig && mlConfig.accuracy >= 0.7) {
      mlModelAvailable = true
      mlModelInfo = {
        modelId: mlConfig.model_id,
        accuracy: mlConfig.accuracy,
        trainedAt: mlConfig.trained_at,
        modelPath: mlConfig.model_path
      }
      console.log(`✅ ML model loaded. Accuracy: ${mlConfig.accuracy}`)
      return true
    } else {
      mlModelAvailable = false
      mlModelInfo = null
      console.log('ℹ️  ML model not available. Using rule-based scoring.')
      return false
    }
  } catch (error) {
    console.error('Error initializing ML model:', error)
    mlModelAvailable = false
    mlModelInfo = null
    return false
  }
}

/**
 * Extract features from request object for ML prediction
 */
export async function extractFeatures(request) {
  const db = getDatabase()
  
  // Get SLA status
  const slaStatus = calculateSLAStatus(request)
  
  // Calculate SLA hours remaining and percent elapsed using calculated SLA status
  const now = new Date()
  const slaHoursRemaining = Math.max(0, Math.round(slaStatus.hoursRemaining))
  const slaPercentElapsed = Math.min(100, Math.round(slaStatus.percentUsed))
  
  // Calculate days to deadline
  const created = request.created_at ? new Date(request.created_at) : now
  const externalDeadline = request.external_deadline ? new Date(request.external_deadline) : null
  const daysToDeadline = externalDeadline
    ? Math.max(0, Math.round((externalDeadline - created) / (1000 * 60 * 60 * 24)))
    : 999
  
  // Get requester workload (replaces assignee_workload - field doesn't exist)
  const requesterWorkload = request.requester_id
    ? db.prepare(`
        SELECT COUNT(*) as count FROM coi_requests 
        WHERE requester_id = ? 
        AND status NOT IN ('Approved', 'Rejected', 'Lapsed')
        AND request_id != ?
      `).get(request.requester_id, request.request_id || '')?.count || 0
    : 0
  
  // Calculate hours in current stage (using stage_entered_at if available)
  const stageStart = request.stage_entered_at 
    ? new Date(request.stage_entered_at) 
    : (request.updated_at ? new Date(request.updated_at) : created)
  const hoursInStage = Math.round((now - stageStart) / (1000 * 60 * 60))
  
  // Get temporal features
  const createdDate = new Date(created)
  const dayOfWeek = createdDate.getDay()
  const isEndOfMonth = createdDate.getDate() > 25 ? 1 : 0
  const month = createdDate.getMonth() + 1
  const isQ4 = [10, 11, 12].includes(month) ? 1 : 0
  
  // Map status to stage number (using actual status values)
  const stageMap = {
    'Pending Director Approval': 1,
    'Pending Compliance': 2,
    'Pending Partner': 3,
    'Pending Finance': 4,
    'Active': 5
  }
  const currentStage = stageMap[request.status] || 0
  
  return {
    sla_hours_remaining: slaHoursRemaining,
    sla_percent_elapsed: slaPercentElapsed,
    has_external_deadline: externalDeadline ? 1 : 0,
    days_to_deadline: daysToDeadline,
    is_pie: (request.pie_status === 'Yes' || request.pie_status === 1 || request.pie_status === true) ? 1 : 0,
    is_international: (request.international_operations === 1 || request.international_operations === 'true' || request.international_operations === true) ? 1 : 0,
    is_statutory_audit: request.service_type === 'STATUTORY_AUDIT' ? 1 : 0,
    is_tax_compliance: request.service_type === 'TAX_COMPLIANCE' ? 1 : 0,
    escalation_count: Math.min(request.escalation_count || 0, 3),
    current_stage: currentStage,
    hours_in_stage: hoursInStage,
    requester_workload: requesterWorkload,
    day_of_week: dayOfWeek,
    is_end_of_month: isEndOfMonth,
    is_q4: isQ4
  }
}

/**
 * Predict priority using ML model
 * Calls Python script to get prediction
 */
export async function predictPriority(request) {
  if (!mlModelAvailable || !mlModelInfo) {
    throw new Error('ML model not available')
  }
  
  try {
    // Extract features
    const features = await extractFeatures(request)
    
    // Create Python script path
    const pythonScript = join(__dirname, '../ml/predict_priority.py')
    
    // Call Python script with features as JSON
    const { stdout, stderr } = await execFileAsync('python3', [
      pythonScript,
      mlModelInfo.modelPath,
      JSON.stringify(features)
    ], {
      cwd: join(__dirname, '../..'),
      timeout: 10000 // 10 second timeout
    })
    
    if (stderr) {
      console.warn('Python script stderr:', stderr)
    }
    
    // Parse result
    const result = JSON.parse(stdout.trim())
    
    // Log prediction to database
    await logPrediction(request.request_id || request.id, result, 'ML')
    
    return {
      score: result.score,
      level: result.level,
      method: 'ML',
      probability: result.probability,
      breakdown: result.explanation ? result.explanation.slice(0, 5) : [], // Top 5 factors
      modelId: mlModelInfo.modelId
    }
  } catch (error) {
    console.error('ML prediction failed:', error)
    throw error
  }
}

/**
 * Log prediction to database for monitoring
 */
async function logPrediction(requestId, prediction, method) {
  try {
    const db = getDatabase()
    
    db.prepare(`
      INSERT INTO ml_predictions (
        request_id, 
        predicted_score, 
        predicted_level, 
        prediction_method,
        model_id,
        features_snapshot
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      requestId,
      prediction.score,
      prediction.level,
      method,
      mlModelInfo?.modelId || null,
      JSON.stringify(prediction.features || {})
    )
  } catch (error) {
    console.error('Error logging prediction:', error)
    // Don't throw - logging failure shouldn't break prediction
  }
}

/**
 * Check if ML model is available
 */
export function isMLModelAvailable() {
  return mlModelAvailable
}

/**
 * Get ML model info
 */
export function getMLModelInfo() {
  return mlModelInfo
}

// Initialize on module load
initializeMLModel().catch(err => {
  console.error('Failed to initialize ML model:', err)
})
