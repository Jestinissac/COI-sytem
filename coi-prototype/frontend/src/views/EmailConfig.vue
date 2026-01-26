<template>
  <div class="email-config-page">
    <div class="page-header">
      <h1>Email Configuration</h1>
      <p class="subtitle">Configure SMTP settings for email notifications</p>
    </div>
    
    <div v-if="loading" class="loading-state">
      Loading configuration...
    </div>
    
    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="loadConfig" class="retry-btn">Retry</button>
    </div>
    
    <template v-else>
      <!-- Status Card -->
      <div class="status-card" :class="{ active: config.is_active, inactive: !config.is_active }">
        <div class="status-header">
          <div class="status-indicator" :class="{ active: config.is_active }"></div>
          <div>
            <h3>Email Status</h3>
            <p class="status-text">
              {{ config.is_active ? 'Email notifications are enabled' : 'Email notifications are disabled' }}
            </p>
          </div>
        </div>
        <div v-if="config.test_status" class="test-status">
          <span class="test-label">Last Test:</span>
          <span class="test-result" :class="config.test_status">
            {{ config.test_status === 'success' ? '✓ Success' : '✗ Failed' }}
          </span>
          <span v-if="config.last_tested_at" class="test-time">
            {{ formatDate(config.last_tested_at) }}
          </span>
        </div>
        <div v-if="config.test_error" class="test-error">
          {{ config.test_error }}
        </div>
      </div>
      
      <!-- Configuration Form -->
      <div class="config-section">
        <h2>SMTP Settings</h2>
        
        <form @submit.prevent="saveConfig" class="config-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="smtp_host">SMTP Host *</label>
              <input
                id="smtp_host"
                v-model="formData.smtp_host"
                type="text"
                placeholder="smtp.gmail.com"
                required
                class="form-input"
              />
              <span class="field-hint">e.g., smtp.gmail.com, smtp.office365.com</span>
            </div>
            
            <div class="form-group">
              <label for="smtp_port">SMTP Port *</label>
              <input
                id="smtp_port"
                v-model.number="formData.smtp_port"
                type="number"
                min="1"
                max="65535"
                placeholder="587"
                required
                class="form-input"
              />
              <span class="field-hint">Common: 587 (TLS), 465 (SSL), 25 (unsecured)</span>
            </div>
            
            <div class="form-group">
              <label for="smtp_secure">Connection Security</label>
              <select
                id="smtp_secure"
                v-model="formData.smtp_secure"
                class="form-input"
              >
                <option :value="false">TLS (STARTTLS)</option>
                <option :value="true">SSL/TLS</option>
              </select>
              <span class="field-hint">TLS for port 587, SSL for port 465</span>
            </div>
            
            <div class="form-group">
              <label for="smtp_user">SMTP Username *</label>
              <input
                id="smtp_user"
                v-model="formData.smtp_user"
                type="text"
                placeholder="user@example.com"
                required
                class="form-input"
              />
              <span class="field-hint">Email address or username for SMTP authentication</span>
            </div>
            
            <div class="form-group">
              <label for="smtp_password">SMTP Password *</label>
              <input
                id="smtp_password"
                v-model="formData.smtp_password"
                type="password"
                placeholder="Enter password"
                required
                class="form-input"
              />
              <span class="field-hint">Password or app-specific password for SMTP</span>
            </div>
            
            <div class="form-group">
              <label for="from_email">From Email *</label>
              <input
                id="from_email"
                v-model="formData.from_email"
                type="email"
                placeholder="noreply@company.com"
                required
                class="form-input"
              />
              <span class="field-hint">Email address that will appear as sender</span>
            </div>
            
            <div class="form-group">
              <label for="from_name">From Name</label>
              <input
                id="from_name"
                v-model="formData.from_name"
                type="text"
                placeholder="COI System"
                class="form-input"
              />
              <span class="field-hint">Display name for sender</span>
            </div>
            
            <div class="form-group">
              <label for="reply_to">Reply-To Email</label>
              <input
                id="reply_to"
                v-model="formData.reply_to"
                type="email"
                placeholder="support@company.com"
                class="form-input"
              />
              <span class="field-hint">Optional: Email address for replies</span>
            </div>
          </div>
          
          <div class="form-actions">
            <button
              type="button"
              @click="testEmail"
              :disabled="testing || !formData.smtp_host || !formData.smtp_user"
              class="btn btn-secondary"
            >
              {{ testing ? 'Testing...' : 'Send Test Email' }}
            </button>
            
            <div class="toggle-group">
              <label class="toggle-label">
                <input
                  type="checkbox"
                  v-model="formData.is_active"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-text">Enable Email Notifications</span>
              </label>
            </div>
            
            <button
              type="submit"
              :disabled="saving || !hasChanges"
              class="btn btn-primary"
            >
              {{ saving ? 'Saving...' : 'Save Configuration' }}
            </button>
          </div>
        </form>
      </div>
      
      <!-- Test Email Modal -->
      <div v-if="showTestModal" class="modal-overlay" @click="showTestModal = false">
        <div class="modal-content" @click.stop>
          <h3>Send Test Email</h3>
          <div class="modal-body">
            <label for="test_email">Test Email Address</label>
            <input
              id="test_email"
              v-model="testEmailAddress"
              type="email"
              placeholder="test@example.com"
              class="form-input"
            />
          </div>
          <div class="modal-actions">
            <button @click="showTestModal = false" class="btn btn-secondary">Cancel</button>
            <button @click="sendTestEmail" :disabled="testing" class="btn btn-primary">
              {{ testing ? 'Sending...' : 'Send Test' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const error = ref('')
const saving = ref(false)
const testing = ref(false)
const showTestModal = ref(false)
const testEmailAddress = ref('')

const config = ref<any>({
  is_active: false,
  smtp_host: '',
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: '',
  from_email: '',
  from_name: 'COI System',
  reply_to: '',
  test_status: null,
  last_tested_at: null,
  test_error: null
})

const formData = ref({
  smtp_host: '',
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: '',
  smtp_password: '',
  from_email: '',
  from_name: 'COI System',
  reply_to: '',
  is_active: false
})

const originalData = ref('')

const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== originalData.value
})

async function loadConfig() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await api.get('/email/config')
    
    if (response.data.configured) {
      config.value = response.data
      formData.value = {
        smtp_host: response.data.smtp_host || '',
        smtp_port: response.data.smtp_port || 587,
        smtp_secure: response.data.smtp_secure === 1 || response.data.smtp_secure === true,
        smtp_user: response.data.smtp_user || '',
        smtp_password: response.data.smtp_password || '', // Will be masked
        from_email: response.data.from_email || '',
        from_name: response.data.from_name || 'COI System',
        reply_to: response.data.reply_to || '',
        is_active: response.data.is_active === 1 || response.data.is_active === true
      }
      originalData.value = JSON.stringify(formData.value)
    } else {
      // No config exists, use defaults
      formData.value = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_secure: false,
        smtp_user: '',
        smtp_password: '',
        from_email: '',
        from_name: 'COI System',
        reply_to: '',
        is_active: false
      }
      originalData.value = JSON.stringify(formData.value)
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || err.message || 'Failed to load configuration'
    console.error('Error loading email config:', err)
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  error.value = ''
  
  try {
    await api.put('/email/config', formData.value)
    
    // Reload config to get updated values
    await loadConfig()
    
    alert('Email configuration saved successfully!')
  } catch (err: any) {
    error.value = err.response?.data?.error || err.message || 'Failed to save configuration'
    console.error('Error saving email config:', err)
    alert('Failed to save configuration: ' + error.value)
  } finally {
    saving.value = false
  }
}

function testEmail() {
  showTestModal.value = true
  testEmailAddress.value = ''
}

async function sendTestEmail() {
  if (!testEmailAddress.value) {
    alert('Please enter a test email address')
    return
  }
  
  testing.value = true
  error.value = ''
  
  try {
    const response = await api.post('/email/config/test', {
      test_email: testEmailAddress.value
    })
    
    alert(response.data.message || 'Test email sent successfully!')
    showTestModal.value = false
    
    // Reload config to get test status
    await loadConfig()
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to send test email'
    alert('Failed to send test email: ' + errorMsg)
    console.error('Error sending test email:', err)
  } finally {
    testing.value = false
  }
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.email-config-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 48px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.error-state {
  color: #dc2626;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.status-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
}

.status-card.active {
  border-left: 4px solid #16a34a;
}

.status-card.inactive {
  border-left: 4px solid #6b7280;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #6b7280;
}

.status-indicator.active {
  background: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
}

.status-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.status-text {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #6b7280;
}

.test-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
}

.test-label {
  color: #6b7280;
}

.test-result {
  font-weight: 600;
}

.test-result.success {
  color: #16a34a;
}

.test-result.failed {
  color: #dc2626;
}

.test-time {
  color: #9ca3af;
  margin-left: auto;
}

.test-error {
  margin-top: 8px;
  padding: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #dc2626;
  font-size: 13px;
}

.config-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
}

.config-section h2 {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-hint {
  font-size: 12px;
  color: #6b7280;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.toggle-group {
  flex: 1;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-input {
  width: 44px;
  height: 24px;
  appearance: none;
  background: #d1d5db;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-input:checked {
  background: #3b82f6;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-input:checked + .toggle-slider {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.modal-body {
  margin-bottom: 24px;
}

.modal-body label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
