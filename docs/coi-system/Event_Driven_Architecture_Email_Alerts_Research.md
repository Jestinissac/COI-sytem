# Event-Driven Architecture for Email Alerts - Research & Recommendations

## Executive Summary

This document evaluates whether event-driven architecture (EDA) is suitable for managing email alerts in the COI system, analyzes noise reduction strategies, compares implementation approaches, and provides recommendations for both prototype and production environments.

**Key Finding**: Event-driven architecture is highly beneficial for the COI system, providing better organization, scalability, and noise reduction. For the prototype, a simple Node.js EventEmitter is sufficient. For production, a message queue solution (RabbitMQ/AWS SNS) is recommended.

---

## 1. Problem Statement

### Business Challenge

The COI system involves numerous workflow states and stakeholder interactions, each potentially triggering email notifications:

- Request submission → Notify director
- Director approval → Notify compliance
- Compliance review → Notify requester
- Rejection → Notify requester with feedback
- Stale requests → Alert admin
- Engagement expiring → Alert partner
- Proposal monitoring → Periodic reminders

**Current Pain Points (Manual Follow-Ups)**:

1. **Email Chaos**: Without the COI system, stakeholders rely on manual emails, leading to:
   - Missed notifications
   - Duplicate emails
   - Inconsistent communication
   - Lost context (email threads scattered across inboxes)

2. **Anticipated Risk with COI System**: If email alerts are implemented naively (direct function calls for each event), the system could create **notification overload**:
   - Too many emails per action (e.g., one request triggers 5+ emails to different stakeholders)
   - Alerts sent at wrong times (e.g., midnight batch jobs send emails)
   - Irrelevant notifications (e.g., Director receives Compliance-only alerts)
   - No user control over notification preferences

### User's Question

> "Does event-driven architecture help? If so, how can we implement? If this is complex, what are the alternative options?"

---

## 2. What is Event-Driven Architecture?

### Core Concepts

**Event-Driven Architecture (EDA)** is a software design pattern where the flow of the program is determined by **events** — significant state changes or occurrences that trigger actions.

**Key Components**:

1. **Event**: A significant occurrence in the system (e.g., "Request Submitted", "Approval Granted")
2. **Event Publisher**: The component that detects and publishes events
3. **Event Bus/Broker**: Central hub that receives events and routes them to subscribers
4. **Event Subscriber**: Components that listen for specific events and react accordingly
5. **Event Handler**: Logic executed when a subscribed event occurs

### How It Works

```
┌──────────────────────────────────────────────────────────┐
│                  EVENT-DRIVEN FLOW                        │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  1. Action Occurs                                         │
│     (User submits COI request)                            │
│                  │                                         │
│                  ▼                                         │
│  2. Publisher Emits Event                                 │
│     Event: "REQUEST_SUBMITTED"                            │
│     Data: { requestId, clientName, requesterEmail }       │
│                  │                                         │
│                  ▼                                         │
│  3. Event Bus Receives Event                              │
│     (Central routing hub)                                 │
│                  │                                         │
│          ┌───────┼───────┐                                │
│          │       │       │                                 │
│          ▼       ▼       ▼                                 │
│  4. Subscribers React                                     │
│     • Email Service → Send notification                   │
│     • Audit Logger → Log event                            │
│     • Dashboard → Update real-time counter                │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Traditional vs Event-Driven Approach

#### Traditional (Direct Function Calls)

```javascript
// In controller
async function submitRequest(req, res) {
  // 1. Save request to database
  const request = await db.saveRequest(requestData)
  
  // 2. Send notifications (tightly coupled)
  await sendEmailToRequester(request)
  await sendEmailToDirector(request)
  await logAuditTrail(request)
  await updateDashboard(request)
  
  // 3. Return response
  res.json({ success: true })
}
```

**Problems**:
- ❌ Tight coupling: Controller knows about emails, logs, dashboard
- ❌ Hard to test: Must mock all notification functions
- ❌ Slow response: Controller waits for all emails to send
- ❌ Error-prone: If email fails, entire request fails

---

#### Event-Driven Approach

```javascript
// In controller
async function submitRequest(req, res) {
  // 1. Save request to database
  const request = await db.saveRequest(requestData)
  
  // 2. Emit event (decoupled)
  eventBus.emit('REQUEST_SUBMITTED', { 
    requestId: request.id, 
    clientName: request.client_name,
    requesterEmail: request.requester_email
  })
  
  // 3. Return response immediately
  res.json({ success: true })
}

// Elsewhere: Email Service subscribes
eventBus.on('REQUEST_SUBMITTED', async (data) => {
  await sendEmailToRequester(data)
  await sendEmailToDirector(data)
})

// Elsewhere: Audit Service subscribes
eventBus.on('REQUEST_SUBMITTED', async (data) => {
  await logAuditTrail(data)
})
```

**Benefits**:
- ✅ Loose coupling: Controller doesn't know about subscribers
- ✅ Easy to test: Mock event bus, not individual functions
- ✅ Fast response: Controller returns immediately
- ✅ Resilient: Email failure doesn't block request submission

---

## 3. Benefits of Event-Driven Architecture for COI System

### 1. Decoupling & Maintainability

**Problem**: With direct function calls, the controller becomes bloated with notification logic.

**Solution**: With EDA, the controller only emits events. Subscribers handle the rest.

**Example**:

```javascript
// Before (Tightly Coupled)
async function approveRequest(req, res) {
  const request = updateApprovalStatus(requestId, 'Approved')
  
  // Controller knows about all these services 😖
  await emailService.notifyRequester(request, 'approved')
  await emailService.notifyNextApprover(request)
  await auditService.logApproval(request, user)
  await dashboardService.updateMetrics('approvals', +1)
  await notificationService.createInAppNotification(request)
  
  res.json({ success: true })
}

// After (Decoupled) ✅
async function approveRequest(req, res) {
  const request = updateApprovalStatus(requestId, 'Approved')
  
  // Controller only emits event
  eventBus.emit('REQUEST_APPROVED', { requestId, approverName, nextStage })
  
  res.json({ success: true })
}
```

### 2. Scalability

**Problem**: Adding new notifications requires modifying core business logic.

**Solution**: Add new subscribers without touching existing code.

**Example**:

```javascript
// Adding SMS notifications is just a new subscriber
eventBus.on('REQUEST_APPROVED', async (data) => {
  await smsService.sendSMS(data.requesterPhone, 'Your request was approved!')
})

// No changes needed to the approveRequest controller!
```

### 3. Audit Trail & Observability

**Problem**: Difficult to track what happened when and why.

**Solution**: Every event is logged automatically, creating a complete audit trail.

**Example**:

```javascript
// Automatic event logging
eventBus.on('*', (eventName, data) => {
  auditLog.insert({
    event: eventName,
    data: JSON.stringify(data),
    timestamp: new Date()
  })
})
```

### 4. Flexibility & Experimentation

**Problem**: Hard to A/B test different notification strategies.

**Solution**: Easily enable/disable subscribers or add conditional logic.

**Example**:

```javascript
// Conditional subscribers based on feature flags
if (config.enableRealTimeNotifications) {
  eventBus.on('REQUEST_SUBMITTED', pushNotificationHandler)
}

if (config.enableDigestEmails) {
  eventBus.on('REQUEST_SUBMITTED', digestEmailHandler)
}
```

---

## 4. Application to COI System

### Email Alert Event Catalog (20+ Events)

| **Event Name**                     | **Trigger**                                          | **Subscribers (Who Gets Notified)**                        |
|------------------------------------|------------------------------------------------------|----------------------------------------------------------|
| `REQUEST_SUBMITTED`                | Requester submits COI request                        | Requester (confirmation), Director (action needed)       |
| `DIRECTOR_APPROVAL_REQUIRED`       | Request routed to Director                           | Director (action needed)                                 |
| `DIRECTOR_APPROVED`                | Director approves request                            | Requester (status update), Compliance (action needed)    |
| `DIRECTOR_REJECTED`                | Director rejects request                             | Requester (with reason)                                  |
| `COMPLIANCE_REVIEW_REQUIRED`       | Request routed to Compliance                         | Compliance team (action needed)                          |
| `COMPLIANCE_APPROVED`              | Compliance approves request                          | Requester (status update), Partner (action needed)       |
| `COMPLIANCE_APPROVED_WITH_RESTRICTIONS` | Compliance approves with conditions          | Requester (with restrictions details), Partner            |
| `COMPLIANCE_REJECTED`              | Compliance rejects request                           | Requester (with reason), Director (FYI)                  |
| `MORE_INFO_REQUESTED`              | Compliance requests additional information           | Requester (action needed)                                |
| `INFO_PROVIDED`                    | Requester provides requested information             | Compliance (action needed - review again)                |
| `PARTNER_APPROVAL_REQUIRED`        | Request routed to Partner                            | Partner (action needed)                                  |
| `PARTNER_APPROVED`                 | Partner gives final approval                         | Requester (final confirmation), Finance (for code gen)   |
| `PARTNER_REJECTED`                 | Partner rejects at final stage                       | Requester (with reason), Compliance (FYI)                |
| `ENGAGEMENT_CODE_GENERATED`        | Finance assigns engagement code                      | Requester (confirmation), Partner (FYI)                  |
| `PROPOSAL_EXPIRING_SOON`           | Proposal approaching expiration (7 days)             | Requester (reminder), Director (FYI)                     |
| `PROPOSAL_EXPIRED`                 | Proposal lapsed without conversion                   | Requester (alert), Admin (cleanup)                       |
| `ENGAGEMENT_EXPIRING_SOON`         | Active engagement approaching end date               | Partner (renewal reminder), Compliance (review needed)   |
| `STALE_REQUEST_ALERT`              | Request pending approval for >14 days                | Assigned approver (reminder), Admin (escalation)         |
| `RULE_CHANGE_IMPACT`               | Business rule updated, affects pending requests      | Compliance (re-evaluation needed)                        |
| `DUPLICATION_DETECTED`             | Similar request found during submission              | Requester (warning), Compliance (review needed)          |

### Event-Driven Example: Request Submission Flow

**Scenario**: User submits a COI request

**Traditional Approach**:

```javascript
async function submitRequest(req, res) {
  const request = await db.saveRequest(requestData)
  
  // All coupled in controller 😖
  await sendEmailToRequester(request, 'confirmation')
  await sendEmailToDirector(request, 'action_required')
  await logAuditEntry('REQUEST_SUBMITTED', request)
  await updateDashboardCounters()
  
  res.json({ success: true })
}
```

**Event-Driven Approach**:

```javascript
// Controller (clean, focused)
async function submitRequest(req, res) {
  const request = await db.saveRequest(requestData)
  
  eventBus.emit('REQUEST_SUBMITTED', {
    requestId: request.id,
    requesterId: request.requester_id,
    directorId: request.director_id,
    clientName: request.client_name
  })
  
  res.json({ success: true })
}

// Email Service subscribes
eventBus.on('REQUEST_SUBMITTED', async ({ requestId, requesterId, directorId }) => {
  const requester = await getUser(requesterId)
  const director = await getUser(directorId)
  
  await sendEmail(requester.email, 'REQUEST_CONFIRMATION', { requestId })
  await sendEmail(director.email, 'DIRECTOR_ACTION_REQUIRED', { requestId })
})

// Audit Service subscribes
eventBus.on('REQUEST_SUBMITTED', async (data) => {
  await auditLog.insert({ event: 'REQUEST_SUBMITTED', data })
})

// Dashboard Service subscribes
eventBus.on('REQUEST_SUBMITTED', async () => {
  await dashboardCache.increment('pending_requests')
})
```

---

## 5. Noise Reduction Strategies

### Strategy 1: Event Filtering (User Subscribes to Relevant Events Only)

**Description**: Allow users to configure which events they want to be notified about.

**Implementation**:

```javascript
// User preferences table
CREATE TABLE user_notification_preferences (
  user_id INTEGER,
  event_name VARCHAR(100),
  enabled BOOLEAN DEFAULT 1,
  delivery_method VARCHAR(20) DEFAULT 'email' -- 'email', 'in_app', 'sms'
)

// Check preferences before sending
eventBus.on('REQUEST_SUBMITTED', async (data) => {
  const prefs = await getUserPreferences(data.directorId)
  
  if (prefs['REQUEST_SUBMITTED'].enabled) {
    await sendEmail(...)
  }
})
```

**Pros**:
- ✅ Users control their own notification volume
- ✅ Reduces irrelevant alerts
- ✅ Empowers users (better UX)

**Cons**:
- ❌ Risk of missing critical alerts if user disables too much
- ❌ Requires UI for managing preferences

---

### Strategy 2: Batching / Digest Emails (Group Multiple Events)

**Description**: Instead of sending one email per event, batch related events into a single digest email sent once per day/hour.

**Implementation**:

```javascript
// Store events in a buffer
const eventBuffer = []

eventBus.on('*', (eventName, data) => {
  eventBuffer.push({ event: eventName, data, timestamp: new Date() })
})

// Send digest every 6 hours
cron.schedule('0 */6 * * *', async () => {
  const digest = groupEventsByUser(eventBuffer)
  
  for (const [userId, events] of digest) {
    await sendDigestEmail(userId, events)
  }
  
  eventBuffer.length = 0 // Clear buffer
})
```

**Example Digest Email**:

```
Subject: COI System Digest - 5 Updates for You

Hello John,

Here's what happened in the last 6 hours:

✅ 2 requests approved
   - COI-2026-001 (Client ABC)
   - COI-2026-005 (Client XYZ)

⚠️ 1 request needs your attention
   - COI-2026-010 (Director approval required)

📊 System Activity
   - 12 new requests submitted today
   - 8 approvals completed

[View Dashboard]
```

**Pros**:
- ✅ Dramatically reduces email volume
- ✅ Better context (see all activity at once)
- ✅ Less inbox clutter

**Cons**:
- ❌ Not suitable for urgent, time-sensitive alerts
- ❌ Delay in receiving notifications

---

### Strategy 3: Smart Routing (Send to Right Person Based on Context)

**Description**: Analyze event context to determine who really needs the notification.

**Implementation**:

```javascript
eventBus.on('REQUEST_APPROVED', async (data) => {
  // Only notify if user is the requester or next approver
  const nextStage = determineNextStage(data.requestId)
  
  if (nextStage === 'Compliance') {
    const complianceOfficers = await getComplianceOfficers(data.department)
    await notifyMultiple(complianceOfficers, 'COMPLIANCE_REVIEW_REQUIRED', data)
  }
  
  // Don't notify everyone in the system!
})
```

**Pros**:
- ✅ Reduces noise by targeting only relevant stakeholders
- ✅ Context-aware notifications
- ✅ Better user experience (only see what matters to you)

**Cons**:
- ❌ Requires complex routing logic
- ❌ Risk of missing notifications if routing logic is incorrect

---

### Strategy 4: Notification Preferences (User Controls Frequency)

**Description**: Allow users to set how often they receive notifications.

**Options**:
- **Real-Time**: Email sent immediately for each event
- **Hourly Digest**: Batch events every hour
- **Daily Digest**: One email per day with all activity
- **Weekly Summary**: High-level summary once per week
- **In-App Only**: No emails, show in dashboard only

**Implementation**:

```javascript
// User preferences
const userPrefs = {
  frequency: 'daily_digest', // 'real_time', 'hourly', 'daily', 'weekly'
  critical_only: false // If true, only send critical/urgent alerts
}

// Delivery logic
async function notifyUser(userId, event, data) {
  const prefs = await getUserPreferences(userId)
  
  if (prefs.frequency === 'real_time' || isCriticalEvent(event)) {
    await sendEmailImmediately(userId, event, data)
  } else {
    await addToDigestQueue(userId, event, data)
  }
}
```

**Pros**:
- ✅ Flexible, user-controlled
- ✅ Balances urgency with noise reduction
- ✅ Supports different user preferences

**Cons**:
- ❌ Requires preference management UI
- ❌ Complex delivery scheduling logic

---

### Strategy 5: Priority Levels (Critical vs Informational)

**Description**: Tag events with priority levels and treat them differently.

**Priority Levels**:
- **🔴 Critical**: Requires immediate action (e.g., "Your request was rejected")
- **🟡 High**: Important but not urgent (e.g., "Approval required")
- **🟢 Normal**: Informational updates (e.g., "Request status changed")
- **⚪ Low**: Background updates (e.g., "Rule library updated")

**Implementation**:

```javascript
const EVENT_PRIORITIES = {
  REQUEST_REJECTED: 'critical',
  DIRECTOR_APPROVAL_REQUIRED: 'high',
  REQUEST_APPROVED: 'normal',
  RULE_LIBRARY_UPDATED: 'low'
}

eventBus.on('*', async (eventName, data) => {
  const priority = EVENT_PRIORITIES[eventName] || 'normal'
  
  if (priority === 'critical') {
    // Always send immediately, ignore user preferences
    await sendEmailImmediately(data.userId, eventName, data)
  } else if (priority === 'high') {
    // Send immediately unless user opted for digest
    if (userPrefs.frequency !== 'digest') {
      await sendEmailImmediately(data.userId, eventName, data)
    }
  } else {
    // Add to digest queue
    await addToDigestQueue(data.userId, eventName, data)
  }
})
```

**Pros**:
- ✅ Ensures critical alerts are never missed
- ✅ Reduces low-priority noise
- ✅ Balances urgency with volume

**Cons**:
- ❌ Requires careful classification of event priorities
- ❌ Subjectivity (what's "critical" to one user may be "normal" to another)

---

### Recommended Noise Reduction Strategy

**For Prototype**: **Strategy 3 (Smart Routing) + Strategy 5 (Priority Levels)**

**For Production**: **All 5 Strategies Combined**:
1. Event filtering (user preferences)
2. Batching/Digest (configurable frequency)
3. Smart routing (context-aware)
4. User-controlled frequency
5. Priority levels (critical always immediate)

---

## 6. Implementation Approaches

### Option A: Simple Event Emitter (Prototype-Friendly)

**Description**: Use Node.js built-in `EventEmitter` for in-process event handling.

**Implementation**:

```javascript
// eventBus.js
import EventEmitter from 'events'

class COIEventBus extends EventEmitter {}

export const eventBus = new COIEventBus()

// In controller
import { eventBus } from './eventBus.js'

async function submitRequest(req, res) {
  const request = await db.saveRequest(requestData)
  
  eventBus.emit('REQUEST_SUBMITTED', { requestId: request.id })
  
  res.json({ success: true })
}

// In emailService.js
import { eventBus } from './eventBus.js'

eventBus.on('REQUEST_SUBMITTED', async (data) => {
  await sendNotificationEmail(data)
})
```

**Pros**:
- ✅ Simple, built-in (no external dependencies)
- ✅ Fast to implement (2-3 hours)
- ✅ Perfect for prototype
- ✅ Easy to understand and debug

**Cons**:
- ❌ In-process only (doesn't scale across multiple servers)
- ❌ No persistence (events lost if server crashes)
- ❌ No retry logic (if handler fails, event is lost)
- ❌ Limited observability (hard to track event flow)

**Suitable For**: Prototype, single-server deployments

**Implementation Effort**: 2-3 hours

---

### Option B: Message Queue (Production-Grade)

**Description**: Use a dedicated message broker like RabbitMQ, AWS SNS/SQS, or Redis Pub/Sub.

**Architecture**:

```
┌─────────────┐       Publish        ┌──────────────────┐
│  Controller │ ────────────────────▶ │  Message Queue   │
│             │                       │  (RabbitMQ/SNS)  │
└─────────────┘                       └──────────────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
                   │ Email Worker │   │ Audit Worker │   │ Dashboard    │
                   │              │   │              │   │ Worker       │
                   └──────────────┘   └──────────────┘   └──────────────┘
```

**Implementation (RabbitMQ Example)**:

```javascript
// publisher.js
import amqp from 'amqplib'

const connection = await amqp.connect('amqp://localhost')
const channel = await connection.createChannel()

await channel.assertExchange('coi_events', 'topic', { durable: true })

export async function publishEvent(eventName, data) {
  channel.publish('coi_events', eventName, Buffer.from(JSON.stringify(data)), {
    persistent: true
  })
}

// In controller
async function submitRequest(req, res) {
  const request = await db.saveRequest(requestData)
  
  await publishEvent('REQUEST_SUBMITTED', { requestId: request.id })
  
  res.json({ success: true })
}

// subscriber.js (Email Worker)
const connection = await amqp.connect('amqp://localhost')
const channel = await connection.createChannel()

await channel.assertQueue('email_queue', { durable: true })
await channel.bindQueue('email_queue', 'coi_events', 'REQUEST_SUBMITTED')

channel.consume('email_queue', async (msg) => {
  const data = JSON.parse(msg.content.toString())
  await sendNotificationEmail(data)
  channel.ack(msg) // Acknowledge message processed
})
```

**Pros**:
- ✅ Distributed (scales across multiple servers)
- ✅ Persistent (events survive server crashes)
- ✅ Retry logic (automatic redelivery on failure)
- ✅ Excellent observability (message tracking, monitoring)
- ✅ Decoupled (email worker can restart without affecting app)
- ✅ Load balancing (multiple workers can process events in parallel)

**Cons**:
- ❌ Complex setup (requires message broker infrastructure)
- ❌ Operational overhead (need to monitor/maintain queue)
- ❌ Learning curve (AMQP protocol, queue management)
- ❌ Potential cost (cloud-hosted queues like AWS SNS/SQS)

**Suitable For**: Production, multi-server deployments, high-volume systems

**Implementation Effort**: 1-2 weeks

---

### Option C: Direct Function Calls with Configuration (Current Approach)

**Description**: Continue calling email functions directly from controllers, but add configuration layer for flexibility.

**Implementation**:

```javascript
// emailConfig.js
export const EMAIL_RULES = {
  REQUEST_SUBMITTED: {
    recipients: ['requester', 'director'],
    template: 'request_confirmation',
    priority: 'high',
    enabled: true
  },
  REQUEST_APPROVED: {
    recipients: ['requester'],
    template: 'approval_notification',
    priority: 'normal',
    enabled: true
  }
}

// In controller
async function submitRequest(req, res) {
  const request = await db.saveRequest(requestData)
  
  // Call email service directly, but with configuration
  await emailService.sendConfiguredEmail('REQUEST_SUBMITTED', { request })
  
  res.json({ success: true })
}

// emailService.js
export async function sendConfiguredEmail(eventName, data) {
  const config = EMAIL_RULES[eventName]
  
  if (!config || !config.enabled) return
  
  for (const recipient of config.recipients) {
    await sendEmail(getRecipientEmail(recipient, data), config.template, data)
  }
}
```

**Pros**:
- ✅ Simplest approach, no new concepts
- ✅ Configuration-driven (can enable/disable emails easily)
- ✅ No additional infrastructure

**Cons**:
- ❌ Still tightly coupled (controller must call email service)
- ❌ Slow response times (controller waits for emails)
- ❌ Hard to test (must mock email service)
- ❌ No audit trail of events
- ❌ Doesn't scale (adding new actions requires modifying controllers)

**Suitable For**: Legacy systems, very simple workflows

**Implementation Effort**: Already in place

---

### Comparison Matrix

| **Criteria**                  | **Option A: EventEmitter** | **Option B: Message Queue** | **Option C: Direct Calls** |
|-------------------------------|----------------------------|----------------------------|----------------------------|
| **Complexity**                | ⭐ Low                     | ⭐⭐⭐ High                  | ⭐ Lowest                  |
| **Scalability**               | ⚠️ Single server           | ✅ Multi-server            | ⚠️ Limited                 |
| **Reliability**               | ⚠️ In-memory only          | ✅ Persistent              | ⚠️ No retry                |
| **Decoupling**                | ✅ Good                    | ✅ Excellent               | ❌ Tight coupling          |
| **Performance**               | ✅ Fast (in-process)       | ⭐⭐⭐ Fast (async)          | ⚠️ Slow (blocking)         |
| **Observability**             | ⚠️ Limited                 | ✅ Excellent               | ❌ Poor                    |
| **Implementation Time**       | 🕒 2-3 hours               | 🕒 1-2 weeks               | 🕒 Already done            |
| **Infrastructure Needs**      | None                       | Message broker required    | None                       |
| **Prototype Suitability**     | ✅ Perfect fit             | ❌ Overkill                | ⚠️ Acceptable but limiting |
| **Production Suitability**    | ⚠️ Limited                 | ✅ Recommended             | ❌ Not scalable            |

---

## 7. Recommendations

### For COI Prototype

**Recommended Solution**: **Option A: Simple Event Emitter**

**Justification**:
- Fast to implement (2-3 hours)
- No external dependencies
- Demonstrates event-driven benefits without complexity
- Easy for stakeholders to understand
- Can be evolved to message queue later without major refactoring

**Implementation Steps**:
1. Create `eventBus.js` with EventEmitter
2. Define event catalog (20+ events)
3. Update controllers to emit events instead of calling services directly
4. Create email service subscriber
5. Add basic event logging subscriber
6. Implement priority-based routing (critical events sent immediately)

**Estimated Effort**: 3-4 hours

---

### For Production Implementation

**Recommended Solution**: **Option B: Message Queue (RabbitMQ or AWS SNS/SQS) + All 5 Noise Reduction Strategies**

**Justification**:
- Scalable to handle high volumes
- Reliable (persistent, retryable)
- Supports distributed architecture (multiple app servers, dedicated workers)
- Best observability and monitoring
- Industry-standard approach for enterprise systems

**Phased Rollout**:

**Phase 1** (Immediate): Implement EventEmitter (as in prototype)
**Phase 2** (Month 1): Add user notification preferences and digest emails
**Phase 3** (Month 2-3): Migrate to message queue infrastructure
**Phase 4** (Month 4): Add advanced features (priority routing, A/B testing)

**Estimated Effort**: 3-4 weeks total

---

### Alternative: Hybrid Approach

If message queue is too complex for production, use **Option A (EventEmitter) + Configuration Layer**:

- Keep EventEmitter for simplicity
- Add user notification preferences
- Implement digest email batching
- Use priority levels for critical alerts
- Plan for future migration to message queue

**Estimated Effort**: 1-2 weeks

---

## 8. Architecture Diagrams

### Current Flow (Without Event-Driven)

```
┌─────────────────────────────────────────────────────────────────┐
│                  CURRENT APPROACH (Tightly Coupled)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   User Action (Submit Request)                                  │
│         │                                                         │
│         ▼                                                         │
│   ┌────────────────┐                                            │
│   │   Controller   │                                            │
│   │                │                                            │
│   │ 1. Save to DB  │                                            │
│   │ 2. Send emails ├──────▶ Email Service                       │
│   │ 3. Log audit   ├──────▶ Audit Service                       │
│   │ 4. Update dashboard ├─▶ Dashboard Service                   │
│   └────────────────┘                                            │
│         │                                                         │
│         ▼                                                         │
│   Return Response (SLOW - waits for all services)              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Event-Driven Flow (Recommended)

```
┌──────────────────────────────────────────────────────────────────┐
│               EVENT-DRIVEN APPROACH (Decoupled)                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│   User Action (Submit Request)                                   │
│         │                                                          │
│         ▼                                                          │
│   ┌────────────────┐                                             │
│   │   Controller   │                                             │
│   │                │                                             │
│   │ 1. Save to DB  │                                             │
│   │ 2. Emit event  ├────▶ "REQUEST_SUBMITTED"                    │
│   └────────────────┘            │                                │
│         │                       │                                 │
│         ▼                       │                                 │
│   Return Response (FAST)        │                                │
│                                 │                                 │
│                                 ▼                                 │
│                       ┌──────────────────┐                       │
│                       │    Event Bus     │                       │
│                       │  (RabbitMQ/SNS)  │                       │
│                       └──────────────────┘                       │
│                                 │                                 │
│                    ┌────────────┼──────────────┐                 │
│                    │            │              │                  │
│                    ▼            ▼              ▼                  │
│            ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│            │   Email   │ │   Audit   │ │ Dashboard │            │
│            │  Worker   │ │  Worker   │ │  Worker   │            │
│            └───────────┘ └───────────┘ └───────────┘            │
│                                                                    │
│   All subscribers process events asynchronously (in parallel)    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

### Event Catalog (Subscriber Matrix)

| **Event**                     | **Email Subscriber** | **Audit Subscriber** | **Dashboard Subscriber** | **In-App Notification** |
|-------------------------------|----------------------|----------------------|--------------------------|-------------------------|
| `REQUEST_SUBMITTED`           | ✅ Yes               | ✅ Yes               | ✅ Yes (counter++)       | ✅ Yes                  |
| `DIRECTOR_APPROVED`           | ✅ Yes               | ✅ Yes               | ✅ Yes (metrics)         | ✅ Yes                  |
| `COMPLIANCE_REJECTED`         | ✅ Yes               | ✅ Yes               | ✅ Yes (metrics)         | ✅ Yes                  |
| `STALE_REQUEST_ALERT`         | ✅ Yes               | ✅ Yes               | ⚠️ No                    | ✅ Yes                  |
| `RULE_LIBRARY_UPDATED`        | ⚠️ Digest only       | ✅ Yes               | ⚠️ No                    | ⚠️ No                   |

---

## 9. Implementation Estimate

### Prototype: Simple Event Emitter

**Total Effort**: 3-4 hours

| **Task**                                     | **Time**    |
|----------------------------------------------|-------------|
| Create EventEmitter class and event catalog  | 30 minutes  |
| Update controllers to emit events            | 1 hour      |
| Create email service subscriber              | 1 hour      |
| Add audit logging subscriber                 | 30 minutes  |
| Add priority-based routing                   | 30 minutes  |
| Testing and validation                       | 30 minutes  |

---

### Production: Message Queue + Noise Reduction

**Total Effort**: 3-4 weeks

| **Task**                                          | **Time**       |
|---------------------------------------------------|----------------|
| Setup RabbitMQ infrastructure (or AWS SNS/SQS)    | 2-3 days       |
| Implement event publishers in controllers         | 2-3 days       |
| Create email worker (subscriber)                  | 2-3 days       |
| Create audit worker                               | 1 day          |
| Create dashboard real-time update worker          | 1-2 days       |
| Implement user notification preferences           | 3-4 days       |
| Implement digest email batching                   | 2-3 days       |
| Add priority-based routing                        | 1-2 days       |
| Testing, monitoring, and observability setup      | 3-4 days       |

---

## Conclusion

**Yes, event-driven architecture is highly beneficial for the COI system.** It provides:

1. **Better Organization**: Clear separation between business logic and notification logic
2. **Scalability**: Easy to add new subscribers without modifying core code
3. **Reliability**: Events can be retried, logged, and tracked
4. **Noise Reduction**: Flexible strategies (digest emails, user preferences, priority routing)
5. **Future-Proof**: Can evolve from simple EventEmitter to enterprise message queue

### Final Recommendations:

- **Prototype**: Use Node.js EventEmitter (3-4 hours implementation)
- **Production**: Use RabbitMQ or AWS SNS/SQS with comprehensive noise reduction strategies (3-4 weeks implementation)
- **Migration Path**: Start simple, add features incrementally, evolve to message queue when scale demands it

This approach balances speed-to-market for the prototype with a clear path to a robust, enterprise-grade solution for production.
