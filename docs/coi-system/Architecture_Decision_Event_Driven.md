# Architecture Decision: Event-Driven Architecture (EDA)

## Question
Do we need event-driven architecture for the COI system?

## Recommendation
**Not required for prototype. Consider for production based on scale and future requirements.**

---

## Analysis

### Current System Characteristics

#### 1. **Workflow Nature**
- **Sequential**: COI must complete before PRMS project creation
- **Synchronous dependencies**: PRMS validates Engagement Code before allowing project creation
- **Linear approval chain**: Requester → Director → Compliance → Partner → Finance → Admin
- **Not real-time critical**: Approvals can be async, notifications can be delayed

#### 2. **Integration Points**
- **PRMS**: Client Master data (read), Engagement Code validation (read), Project creation trigger (write)
- **HRMS**: Employee Master (read), User groups (read), Email addresses (read)
- **Limited integrations**: Only 2 external systems, not many microservices

#### 3. **Notification Requirements**
- Status change notifications (email + in-app)
- Scheduled alerts (30-day monitoring every 10 days)
- Renewal alerts (90/60/30 days before expiry)
- **Can be handled with**: Simple job scheduler (cron/background jobs)

#### 4. **Data Flow**
- **Unidirectional**: COI → PRMS (Engagement Code)
- **Read operations**: COI reads from PRMS/HRMS
- **No complex event chains**: No cascading events across multiple systems

#### 5. **Scale Expectations**
- **Prototype**: Small team, limited users
- **Production**: Medium-sized organization
- **Not high-volume**: COI requests are not high-frequency transactions

---

## Event-Driven Architecture: Pros & Cons

### ✅ Pros (When EDA Would Help)

1. **System Decoupling**
   - COI, PRMS, HRMS can evolve independently
   - Changes in one system don't break others
   - **Relevance**: Medium - systems are already separate

2. **Scalability**
   - Handle high volumes of requests
   - Async processing for notifications
   - **Relevance**: Low - not high-volume system

3. **Resilience**
   - If PRMS is down, COI can still process requests
   - Events queued and processed when system available
   - **Relevance**: Medium - good for production

4. **Audit Trail**
   - Event sourcing provides complete history
   - **Relevance**: Medium - can be achieved with traditional DB

5. **Real-time Updates**
   - Multiple systems can react to events immediately
   - **Relevance**: Low - not real-time critical

### ❌ Cons (Why EDA Might Be Overkill)

1. **Complexity**
   - Event bus/message queue infrastructure needed
   - Event versioning and schema management
   - Event ordering and idempotency concerns
   - **Impact**: High - adds significant complexity

2. **Infrastructure**
   - Message broker (RabbitMQ, Kafka, etc.)
   - Event store
   - Monitoring and debugging tools
   - **Impact**: High - more infrastructure to manage

3. **Development Time**
   - Longer development cycle
   - More testing required
   - Harder to debug distributed events
   - **Impact**: High - delays prototype delivery

4. **Over-engineering**
   - System doesn't have complex event chains
   - Sequential workflow doesn't benefit from events
   - **Impact**: Medium - simpler solution sufficient

5. **Learning Curve**
   - Team needs to understand event patterns
   - Eventual consistency challenges
   - **Impact**: Medium - requires expertise

---

## Recommended Architecture Approach

### Phase 1: Prototype (Current)
**Use: Request/Response with Background Jobs**

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  COI   │────────▶│  PRMS   │         │  HRMS   │
│ System │  REST   │  API    │         │  API    │
│        │◀────────│         │         │         │
└────────┘         └─────────┘         └─────────┘
     │
     │ Background Jobs
     ▼
┌─────────────┐
│ Job Scheduler│
│ (Notifications)│
└─────────────┘
```

**Components:**
- **API Integration**: REST APIs for PRMS/HRMS (synchronous calls)
- **Background Jobs**: Scheduled tasks for alerts/notifications
- **Database**: Traditional relational DB with audit tables
- **Notifications**: Simple email service + in-app notifications table

**Benefits:**
- ✅ Simple to implement
- ✅ Fast development
- ✅ Easy to debug
- ✅ Sufficient for prototype needs

**Limitations:**
- ⚠️ Tight coupling with PRMS/HRMS APIs
- ⚠️ If external system down, operations may fail
- ⚠️ Not ideal for high-volume scenarios

### Phase 2: Production (Future Consideration)
**Consider: Hybrid Approach (EDA for Critical Paths)**

```
┌─────────┐    Events    ┌──────────┐    Events    ┌─────────┐
│  COI   │─────────────▶│ Event Bus│─────────────▶│  PRMS   │
│ System │              │ (Kafka/  │              │         │
│        │              │ RabbitMQ)│              │         │
└────────┘              └──────────┘              └─────────┘
     │                        │
     │                        │ Events
     │                        ▼
     │                  ┌──────────┐
     │                  │Notification│
     │                  │  Service  │
     │                  └──────────┘
     │
     │ REST API (for synchronous operations)
     ▼
┌─────────┐
│  HRMS   │
│  API    │
└─────────┘
```

**When to Consider EDA in Production:**

1. **If PRMS/HRMS become unreliable**
   - Need resilience when external systems are down
   - Events can be queued and processed later

2. **If multiple systems need to react**
   - Audit system, reporting system, analytics system
   - All need to know about COI status changes

3. **If high volume expected**
   - Hundreds of COI requests per day
   - Need async processing for performance

4. **If real-time updates needed**
   - Multiple dashboards need live updates
   - Real-time collaboration features

5. **If complex event chains emerge**
   - COI approval triggers multiple downstream processes
   - Need event orchestration

---

## Specific Use Cases Analysis

### Use Case 1: Engagement Code to PRMS
**Current**: COI sends Engagement Code via API call
**With EDA**: COI publishes "EngagementApproved" event, PRMS subscribes

**Verdict**: **Not needed** - Simple API call sufficient, synchronous validation required

### Use Case 2: Client Request Notification
**Current**: Email notification to PRMS Admin
**With EDA**: Publish "ClientRequested" event, notification service subscribes

**Verdict**: **Not needed** - Simple email service sufficient

### Use Case 3: 30-Day Monitoring Alerts
**Current**: Scheduled job runs every day, checks for alerts needed
**With EDA**: Publish "ProposalExecuted" event, scheduler subscribes and schedules alerts

**Verdict**: **Not needed** - Scheduled job simpler and more reliable

### Use Case 4: Status Change Notifications
**Current**: After status update, send notifications synchronously
**With EDA**: Publish "StatusChanged" event, notification service subscribes

**Verdict**: **Optional** - Could help if notification service becomes unreliable, but not critical

### Use Case 5: Director Approval
**Current**: Director approves, system updates status, sends notifications
**With EDA**: Publish "DirectorApproved" event, multiple services react

**Verdict**: **Not needed** - Simple workflow, no complex reactions needed

---

## Decision Matrix

| Factor | Weight | Without EDA | With EDA | Winner |
|--------|--------|-------------|----------|--------|
| **Development Speed** | High | ✅ Fast | ❌ Slower | Without EDA |
| **Complexity** | High | ✅ Simple | ❌ Complex | Without EDA |
| **Infrastructure Cost** | Medium | ✅ Low | ❌ Higher | Without EDA |
| **Maintainability** | High | ✅ Easy | ❌ Harder | Without EDA |
| **Scalability** | Low | ⚠️ Limited | ✅ Better | With EDA |
| **Resilience** | Medium | ⚠️ Dependent | ✅ Better | With EDA |
| **Decoupling** | Medium | ⚠️ Coupled | ✅ Decoupled | With EDA |

**Overall Winner**: **Without EDA** (for prototype and initial production)

---

## Final Recommendation

### For Prototype: **NO EDA**
- Use simple REST APIs
- Background jobs for scheduled tasks
- Traditional database with audit tables
- Simple email notification service

### For Production: **EVALUATE BASED ON**
1. **System Reliability**: If PRMS/HRMS are unreliable → Consider EDA
2. **Volume**: If >100 requests/day → Consider EDA
3. **Integration Complexity**: If more systems need to react → Consider EDA
4. **Team Expertise**: If team has EDA experience → Consider EDA

### Migration Path (If Needed Later)
1. Start with simple architecture
2. Identify pain points (coupling, reliability, performance)
3. Introduce event bus for specific use cases
4. Gradually migrate critical paths to events
5. Keep synchronous APIs for real-time validations

---

## Alternative: Lightweight Event Pattern

If you want some benefits of EDA without full complexity:

### Option: Database Events + Webhooks
- Use database triggers or change data capture (CDC)
- Publish events to simple message queue (Redis Pub/Sub)
- Subscribers handle notifications/updates
- **Benefit**: Decoupling without full EDA infrastructure

### Option: Event Sourcing Lite
- Store all state changes as events in database
- Rebuild state from events for audit
- **Benefit**: Complete audit trail without event bus

---

## Conclusion

**For this COI system:**
- ✅ **Prototype**: Simple request/response architecture
- ⚠️ **Production**: Monitor for pain points, add EDA only if needed
- ✅ **Future**: Can migrate to EDA if requirements change

**EDA is not required** for the current scope and requirements. Start simple, add complexity only when justified by actual needs.

---

## Related Documents
- User Journeys: `User_Journeys_End_to_End.md`
- Implementation Decisions: `Q&A/Implementation_Decisions_Summary.md`


