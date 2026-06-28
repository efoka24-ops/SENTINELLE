# SENTINELLE Signalement Workflow — Phase 2 Backend Implementation

## Overview

This document describes the implementation of the alert escalation and citizen report → signalement workflow in SENTINELLE Phase 2.

## Data Model

### Signalement Table

The `Signalement` model represents a formal case or report that flows through an escalation and decision-making workflow.

```python
class Signalement(Base):
    __tablename__ = "signalements"
    
    # Identifiers
    id: int (PK)
    reference: str (unique, indexed) — e.g., "SGN-000001"
    
    # Relationship to source data
    citizen_report_id: int | None (FK → CitizenReport)
    alert_id: int | None (FK → Alert)
    
    # Workflow assignment
    assigned_to: int | None (FK → User) — Initial analyst_jr/analyst_sr
    escalated_to: int | None (FK → User) — Chief/Director handling escalation
    
    # Classification
    category: str — Threat type (child_safety, trafficking, hate_speech, etc.)
    gravity: str — Severity: Faible|Modéré|Grave|Critique
    
    # Workflow state
    status: str — Nouveau|Analyse|Decision|Escalade|Transmitted
    decision: str | None — Validé|Rejeté|Escalade (null until decided)
    decision_reason: str — Justification for decision
    transmitted_to: str | None — ANTIC|Armée|Parquet|etc.
    
    # Audit trail
    notes: str — Analysis and decision notes
    created_at: datetime
    updated_at: datetime
```

## Workflow States

```
Nouveau → Analyse → Decision/Escalade → Transmitted
   ↑       ↑            ↑
   |       |            └─ Chief/Director decides
   |       └─ Analyst works on case
   └─ Auto-created when CitizenReport submitted
```

### State Descriptions

- **Nouveau**: Freshly created, awaiting assignment.
- **Analyse**: Analyst is reviewing and gathering evidence.
- **Escalade**: Ready for escalation; awaiting chief/director decision.
- **Decision**: Decided but awaiting transmission to authority.
- **Transmitted**: Final state; decision implemented (sent to authority or rejected).

## API Endpoints

### POST /api/v1/public/citizen-reports
**Public endpoint** — Create a citizen report, automatically generates a Signalement.

**Request:**
```json
{
  "threat_type": "child_safety",
  "url": "https://example.com/post",
  "description": "Suspicious content",
  "region": "National"
}
```

**Response:**
```json
{
  "reference": "SGN-2026-12345",
  "signalement_reference": "SGN-000001",
  "status": "received"
}
```

**Auto-actions:**
- Creates `CitizenReport` record
- Creates `Signalement` record with status=`Nuevo`
- Assigns to least-loaded analyst_jr using round-robin
- Logs audit entry: `SIGNALEMENT_CREATED`

---

### GET /api/v1/signalements/assigned-to-me
**Auth required** — View signalements assigned to the current user.

**Query parameters:**
- `status` (optional) — Filter by status (Nouveau, Analyse, etc.)

**Response:**
```json
[
  {
    "id": 1,
    "reference": "SGN-000001",
    "status": "Nouveau",
    "category": "child_safety",
    "gravity": "Grave",
    "assigned_to": 5,
    "created_at": "2026-06-28T10:30:00Z",
    "updated_at": "2026-06-28T10:30:00Z"
  }
]
```

**Access control:**
- Analysts can only see their own signalements
- Chiefs see all in their team
- Directors see all

---

### POST /api/v1/signalements/{sig_id}/escalate
**Auth required: alerts:write** — Escalate a signalement to chief/director for decision.

**Roles allowed:** analyst_jr, analyst_sr

**Request:**
```json
{
  "reason": "Complex case requiring senior expertise and legal review"
}
```

**Response:**
```json
{
  "id": 1,
  "reference": "SGN-000001",
  "status": "Escalade",
  "escalated_to": 7,
  "notes": "[2026-06-28 10:45] Escalade by Junior Analyst: Complex case..."
}
```

**Auto-actions:**
- Sets status → `Escalade`
- Assigns escalated_to → first available chief/director
- Appends escalation reason to notes
- Logs audit: `SIGNALEMENT_ESCALATED`
- Notifies escalated_to user via notifications service
- Triggers SLA check (6h warning if approaching deadline)

---

### GET /api/v1/signalements/escalation-pending
**Auth required: reports:validate** — View escalations awaiting decision (chief+ only).

**Response:**
```json
[
  {
    "id": 1,
    "reference": "SGN-000001",
    "status": "Escalade",
    "category": "child_safety",
    "gravity": "Critique",
    "assigned_to": 5,
    "escalated_to": 7,
    "notes": "..."
  }
]
```

**Access control:**
- Chief and above only
- Returns all signalements in `Decision` or `Escalade` status

---

### POST /api/v1/signalements/{sig_id}/decide
**Auth required: reports:validate** — Make a final decision on a signalement.

**Roles allowed:** chief, director

**Request:**
```json
{
  "decision": "Validé",
  "decision_reason": "Confirmed illegal content, immediate intervention required",
  "transmitted_to": "ANTIC"
}
```

**Valid decisions:**
- `Validé` — Threat confirmed, transmit to authority (default: ANTIC)
- `Rejeté` — False positive, close case
- `Escalade` — Escalate to director (chain of command)

**Response:**
```json
{
  "id": 1,
  "reference": "SGN-000001",
  "status": "Transmitted",
  "decision": "Validé",
  "transmitted_to": "ANTIC",
  "decision_reason": "Confirmed illegal content..."
}
```

**Auto-actions:**
- Sets decision, decision_reason, transmitted_to
- If Validé: status → `Transmitted`, logs authority transmission
- If Rejeté: status → `Transmitted` (case closed)
- If Escalade: escalates to director, notifies them
- Logs audit: `SIGNALEMENT_DECIDED`
- Notifies relevant parties

---

### PATCH /api/v1/signalements/{sig_id}/reassign
**Auth required: reports:validate** — Reassign to another analyst (chief only).

**Request:**
```json
{
  "assigned_to_id": 6
}
```

**Response:**
```json
{
  "id": 1,
  "assigned_to": 6
}
```

**Auto-actions:**
- Reassigns analysis responsibility
- Logs audit: `SIGNALEMENT_REASSIGNED`

---

### GET /api/v1/signalements/{sig_id}
**Auth required** — Get details of a specific signalement.

**Access control:**
- Analysts: can only view their assigned signalements
- Chiefs+: can view all

**Response:**
```json
{
  "id": 1,
  "reference": "SGN-000001",
  "status": "Escalade",
  "citizen_report_id": 5,
  "alert_id": null,
  "assigned_to": 5,
  "escalated_to": 7,
  "category": "child_safety",
  "gravity": "Grave",
  "decision": null,
  "decision_reason": "",
  "transmitted_to": null,
  "notes": "Analysis notes...",
  "created_at": "2026-06-28T10:30:00Z",
  "updated_at": "2026-06-28T10:45:00Z"
}
```

---

## Notifications Service

**Location:** `backend/app/services/notifications.py`

The notifications service logs all critical escalation and decision events. In Phase 4, email sending will be integrated here.

### Notification Functions

#### notify_escalation(db, signalement, escalated_to_user)
Notifies when a signalement is escalated to a chief/director.
- Logs: `[NOTIF] Escalade → {email}: ...`
- Creates Notification record with level based on gravity
- Current: stdout only; Phase 4 → email

#### notify_sla_at_risk(db, signalement)
Alerts when < 6 hours remain before SLA breach (24h total).
- Logs: `[NOTIF] SLA à risque: ...`
- Notifies assigned analyst

#### notify_decision_needed(db, signalement, chief_user)
Alerts chief/director that a decision is required.
- Logs: `[NOTIF] Décision requise → {email}: ...`
- Creates notification with high priority

#### notify_transmitted(db, signalement, authority)
Confirms transmission to authority.
- Logs: `[NOTIF] Transmission → {authority}: ...`
- Creates info-level notification

---

## RBAC & Permissions

### Modified Permissions

| Role | New Permissions |
|------|-----------------|
| analyst_jr | + `alerts:write` (to escalate) |
| analyst_sr | (unchanged) |
| chief | (unchanged) |
| director | (unchanged) |
| admin | * (all) |
| auditor | (unchanged) |

### Endpoint Access Matrix

| Endpoint | analyst_jr | analyst_sr | chief | director | admin |
|----------|:----------:|:----------:|:-----:|:--------:|:-----:|
| GET /signalements/assigned-to-me | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /signalements/escalation-pending | ✗ | ✗ | ✓ | ✓ | ✓ |
| POST /escalate | ✓ | ✓ | ✗ | ✗ | ✓ |
| POST /decide | ✗ | ✗ | ✓ | ✓ | ✓ |
| PATCH /reassign | ✗ | ✗ | ✓ | ✓ | ✓ |
| GET /{id} | own only | own only | all | all | all |

---

## Audit Logging

All signalement operations are logged to the `audit_logs` table.

### Audit Actions

| Action | User | Trigger |
|--------|------|---------|
| `SIGNALEMENT_CREATED` | Système | Citizen report submitted |
| `SIGNALEMENT_ESCALATED` | analyst_jr/sr | Escalation requested |
| `SIGNALEMENT_DECIDED` | chief/director | Decision made |
| `SIGNALEMENT_REASSIGNED` | chief | Reassignment |

**Example audit entry:**
```json
{
  "ts": "2026-06-28T10:45:30Z",
  "user": "Analyste junior",
  "role": "analyst_jr",
  "action": "SIGNALEMENT_ESCALATED",
  "target": "SGN-000001"
}
```

---

## Database Schema

### SQL Create Statement

```sql
CREATE TABLE IF NOT EXISTS signalements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference VARCHAR(40) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'Nouveau',
    citizen_report_id INTEGER,
    alert_id INTEGER,
    assigned_to INTEGER,
    escalated_to INTEGER,
    category VARCHAR(40),
    gravity VARCHAR(20) DEFAULT 'Modéré',
    decision VARCHAR(20),
    decision_reason TEXT,
    transmitted_to VARCHAR(100),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (citizen_report_id) REFERENCES citizen_reports(id),
    FOREIGN KEY (alert_id) REFERENCES alerts(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (escalated_to) REFERENCES users(id)
);
CREATE INDEX idx_signalements_reference ON signalements(reference);
```

### Indexes

- `reference` (unique) — Quick lookup by case reference
- Implicit indexes on foreign keys for joins

---

## Testing

### Test File Location

`backend/tests/test_signalements.py`

### Test Coverage

1. **test_create_signalement_on_citizen_report** — Verify auto-creation
2. **test_escalate_signalement** — Escalation happy path
3. **test_cannot_escalate_as_unauthorized_role** — RBAC enforcement
4. **test_decide_signalement_validated** — Validation & transmission
5. **test_decide_signalement_rejected** — Rejection path
6. **test_cannot_decide_as_unauthorized_role** — RBAC enforcement
7. **test_reassign_signalement** — Reassignment workflow
8. **test_get_signalements_assigned_to_me** — View own signalements
9. **test_get_escalation_pending** — View escalations
10. **test_get_signalement_detail** — View detail with access control
11. **test_signalement_full_workflow** — E2E test: create → escalate → decide → transmit

### Running Tests

```bash
cd backend
pytest tests/test_signalements.py -v
pytest tests/test_signalements.py::TestSignalementWorkflow::test_signalement_full_workflow -v
```

### Test Fixtures

Fixtures in `tests/fixtures.py` provide:
- `users` — 6 test users (one per role)
- `citizen_reports` — 3 test reports
- `alerts` — 4 test alerts
- `signalements` — 6 test signalements in various states
- `auth_tokens` — JWT tokens for each role

---

## Round-Robin Assignment Algorithm

When a citizen report is submitted, the system assigns it to the least-loaded analyst_jr.

```python
def _get_least_loaded_analyst(db: Session) -> User | None:
    analysts = db.scalars(
        select(User).where(User.role == "analyst_jr", User.is_active == True)
    ).all()
    
    assigned_counts = {}
    for analyst in analysts:
        count = db.scalar(
            select(func.count()).select_from(Signalement)
            .where(
                Signalement.assigned_to == analyst.id,
                Signalement.status.in_(["Nouveau", "Analyse"])
            )
        ) or 0
        assigned_counts[analyst.id] = count
    
    return min(analysts, key=lambda a: assigned_counts[a.id])
```

This ensures even distribution of workload across the junior analyst team.

---

## SLA Management

- **SLA window**: 24 hours from creation
- **Alert threshold**: 6 hours remaining
- **Action**: notify_sla_at_risk() called on each escalation/decision check

Future enhancement: Automatic escalation if SLA exceeded.

---

## Phase 4 Integration Points

### Email Notifications

The notifications service is designed to be extended with actual email sending:

```python
# Current (Phase 2 — logs only)
print(f"[NOTIF] Escalade → {escalated_to_user.email}: {message}")

# Phase 4 (to add)
mailer.send(
    [escalated_to_user.email],
    f"[SENTINELLE] Escalade de signalement {signalement.reference}",
    message
)
```

### SMS/WhatsApp

The `Notification` model's `channel` field supports future expansion:
- `email` (current)
- `sms` (Phase 4)
- `whatsapp` (Phase 4)
- `internal` (dashboard UI)

---

## Future Enhancements

1. **Auto-escalation on SLA breach** — Trigger escalation if > 24h
2. **Bulk actions** — Escalate/decide multiple signalements
3. **Templates** — Pre-canned decision reasons
4. **Analytics** — Average resolution time, escalation rate, etc.
5. **Integration with external systems** — ANTIC, Armée APIs
6. **Role-based UI views** — Separate dashboards per role
7. **Priority queues** — Sort by gravity and age
8. **Comments/Discussion** — Back-and-forth notes during review

---

## Troubleshooting

### Signalement not created on citizen report submission

1. Check if `analyst_jr` users exist and are active
2. Verify Signalement table was created (check alembic migrations)
3. Review server logs for errors in `_get_least_loaded_analyst()`

### Escalation notification not received

1. Verify Notification record was created in database
2. Check notifications.py print output in server logs
3. In Phase 4, verify email sending configuration

### RBAC denials

1. Confirm user role in database
2. Check that required permission is in ROLE_PERMS dict (rbac.py)
3. Verify JWT token includes correct role claim

---

## Security Considerations

1. **Analyst visibility** — Analysts only see their assigned signalements (enforced in GET endpoints)
2. **Permission checks** — All endpoints use require() decorator
3. **Audit trail** — All mutations logged with user identity
4. **Data integrity** — Foreign keys prevent orphaned references
5. **SLA enforcement** — Protects against indefinite delays

---

## Performance Notes

- **Indexes**: Reference field indexed for O(1) lookups
- **Foreign keys**: Automatic indexes on FK lookups
- **Batch operations**: Future enhancement for bulk actions
- **Pagination**: Limit 100 default to prevent memory issues

---

## API Version

- **Endpoint prefix**: `/api/v1/`
- **Content-Type**: `application/json`
- **Auth method**: Bearer token (JWT)
- **Error format**: Standard HTTP status codes + JSON error details
