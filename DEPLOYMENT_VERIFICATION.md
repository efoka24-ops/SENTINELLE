# SENTINELLE Deployment Verification Checklist

## Pre-Deployment Checks

### 1. Code Compilation ✅
```bash
# TypeScript Frontend
npx tsc --noEmit

# Python Backend
python -m py_compile backend/app/routers/data.py
python -m py_compile backend/app/models.py
python -m py_compile backend/app/services/notifications.py
```

### 2. Run Test Suite
```bash
# Install testing dependencies (one-time)
cd backend && pip install pytest pytest-cov pytest-asyncio

# Run all tests
pytest tests/ -v --tb=short

# Run specific test suites
pytest tests/test_security.py -v          # Security tests
pytest tests/test_workflows.py -v         # Workflow tests
pytest tests/test_rbac.py -v              # Permission tests
pytest tests/test_notifications.py -v    # Notification tests
pytest tests/test_audit.py -v             # Audit tests

# Generate coverage report
pytest tests/ --cov=app --cov-report=html
# Open htmlcov/index.html to view coverage
```

### 3. Verify Environment

#### Backend (.env file required)
```bash
# Check required variables
cat backend/.env | grep -E "DATABASE_URL|SMTP_|JWT_SECRET|AUTH_DEV_MODE"

# Key variables needed:
# - DATABASE_URL (PostgreSQL connection)
# - SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (for emails)
# - JWT_SECRET (for token signing)
# - AUTH_DEV_MODE (set to false for production)
# - LOGIN_CODE_TTL_MIN (OTP expiration, default 10)
```

#### Frontend (.env.local or vite.config.ts)
```bash
# Check API base URL
grep -r "http://localhost:8000" src/
# Should point to backend API endpoint
```

---

## Manual Testing Workflow

### Scenario 1: Complete Signalement Journey

**Setup**: Have test accounts ready:
- analyst_jr@sentinelle.test / password
- chief@sentinelle.test / password
- director@sentinelle.test / password
- admin@sentinelle.test / password

**Steps**:

#### 1. Submit Citizen Report (Public)
```bash
curl -X POST http://localhost:8000/public/citizen-reports \
  -H "Content-Type: application/json" \
  -d '{
    "threat_type": "Désinformation",
    "url": "https://example.com/post",
    "description": "False health claims",
    "region": "Yaoundé"
  }'
```

#### 2. Login as analyst_jr
- Visit http://localhost:5173/admin/login
- Enter: analyst_jr@sentinelle.test
- Receive OTP via email (or see in dev mode)
- Enter OTP → dashboard loads
- Should see: Dashboard, Carte, Alertes, Renseignement, Signalements
- Should NOT see: Collecte, Analyse, Endpoints, Audit

#### 3. View Assigned Signalement
- Click "Signalements" in menu
- Should see only signalements assigned to you
- Click to open detail
- Check: SLA timer showing < 24h
- Check: Status is "Nouveau"

#### 4. Escalate Signalement
- Click "Escalade" button
- Add reason: "Needs expert review"
- Submit → notification sent to chief
- Status changes to "Escalade"

#### 5. Login as Chief & Review
- Logout and login as chief@sentinelle.test
- Dashboard shows: team performance, pending escalations
- See signalement in "Pending Escalations"
- Click to open
- See escalation chain: analyst_jr → chief

#### 6. Chief Makes Decision
- Click "Validate" or "Reject" button
- For "Validate": select authority (ANTIC/Armée/Parquet)
- Add decision reason
- Submit → status changes to "Transmitted"
- Notifications sent to:
  - analyst_jr (confirmation)
  - director (for oversight)

#### 7. Verify Audit Trail
- Login as director
- Click "Audit"
- Filter by signalement reference
- Verify timeline shows:
  - SIGNALEMENT_CREATED
  - SIGNALEMENT_ESCALATED
  - SIGNALEMENT_DECIDED
  - TRANSMISSION action

#### 8. Check Notifications
- Check email inbox (or Railway logs)
- Verify escalation email received
- Verify decision confirmation email received
- Verify transmission confirmation email received

---

### Scenario 2: Permission Enforcement

**Test Case**: analyst_jr tries to access /admin/users

```bash
# 1. Login as analyst_jr, get token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst_jr@test", "code":"123456"}' \
  | jq -r '.access_token')

# 2. Try to list users (should fail 403)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/users
# Expected: 403 Forbidden

# 3. Try as admin (should work)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test", "code":"123456"}' \
  | jq -r '.access_token')

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/users
# Expected: 200 OK with user list
```

---

### Scenario 3: OTP Flow Verification

**Test Case**: Verify OTP send and verification

```bash
# 1. Request code
curl -X POST http://localhost:8000/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@sentinelle.test"}'

# Response in dev mode includes dev_code
# In production, code is sent via email

# 2. Check logs for code (dev mode)
# Should see: [SENTINELLE][OTP] test@sentinelle.test -> code 123456

# 3. Verify code
curl -X POST http://localhost:8000/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@sentinelle.test","code":"123456"}'

# Expected response:
# {
#   "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "user": {"id": 1, "email": "test@sentinelle.test", "role": "analyst_jr"},
#   "permissions": ["view:dashboard", "view:carte", ...]
# }
```

---

### Scenario 4: Real-Time SLA Tracking

**Test Case**: Verify SLA countdown and warnings

```bash
# 1. Create signalement
SIG_ID=123

# 2. Check SLA status (simulated)
curl http://localhost:8000/signalements/$SIG_ID/check-sla

# Expected response:
# {
#   "hours_remaining": 23,
#   "status": "OK",
#   "at_risk": false
# }

# 3. Check when < 6h remaining
# - Should trigger notify_sla_at_risk()
# - Should email analyst + chief
# - UI should show red warning
```

---

## Deployment Steps

### 1. Production Setup

```bash
# Clone latest from main
git clone https://github.com/your-org/sentinelle.git
cd sentinelle

# Create .env with production values
cat > backend/.env << EOF
DATABASE_URL=postgresql://user:pass@prod-db:5432/sentinelle
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@sentinelle.cm
SMTP_PASSWORD=<secret>
JWT_SECRET=<long-random-secret>
AUTH_DEV_MODE=false
LOGIN_CODE_TTL_MIN=10
EOF

# Build frontend
npm install
npm run build

# Build backend
pip install -r backend/requirements.txt
```

### 2. Database Migrations

```bash
# Create/migrate database tables
# (Models defined in backend/app/models.py are automatically created with SQLAlchemy)
python backend/app/db.py  # or run migrations tool
```

### 3. Start Services

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Frontend (in production, serve from nginx/cloud)
npm run preview  # or use nginx/apache to serve dist/
```

### 4. Health Checks

```bash
# Backend health
curl http://localhost:8000/docs  # Should return OpenAPI UI

# Frontend health
curl http://localhost:5173/  # Should return HTML

# Database health
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer <valid-token>"
# Should return current user
```

---

## Rollback Plan

### If Critical Issue Found

```bash
# Stop services
pkill -f "uvicorn app.main:app"
pkill -f "npm run preview"

# Revert code
git checkout main
npm install
pip install -r backend/requirements.txt

# Restart
python -m uvicorn app.main:app &
npm run preview &

# Alert stakeholders
# Check logs: cat backend/app/logs/*
```

---

## Post-Deployment Verification (24h after)

### Checklist

- [ ] All users can login successfully
- [ ] At least 5 signalements processed through workflow
- [ ] No 403/500 errors in logs for users with correct permissions
- [ ] Email notifications sent for escalations
- [ ] Audit logs recording all actions
- [ ] Dashboard loading in < 2 seconds
- [ ] No database connection errors
- [ ] OTP codes expiring after configured TTL
- [ ] Signalements correctly assigned to analysts

### Monitoring

```bash
# Watch logs in real-time
tail -f backend/app/logs/access.log
tail -f backend/app/logs/error.log

# Check database
SELECT COUNT(*) FROM signalements WHERE status = 'Transmitted';
SELECT COUNT(*) FROM notifications WHERE status = 'error';
SELECT COUNT(*) FROM audit_logs;

# Check performance
SELECT COUNT(*) FROM audit_logs WHERE action LIKE 'AUTH_%';
```

---

## Troubleshooting

### Problem: OTP not sending via email

**Solution**:
```bash
# Check SMTP configuration
grep SMTP backend/.env

# Check mailer logs
grep -i "smtp\|email" backend/app/logs/*

# Test SMTP directly
python -c "from app.mailer import send; send(['test@test.com'], 'Test', 'Body')"
```

### Problem: Analysts see empty signalements list

**Solution**:
```bash
# Check assignments in database
SELECT * FROM signalements WHERE assigned_to IS NULL;

# Check auto-assignment logic
grep "least_loaded_analyst" backend/app/routers/data.py

# Manually assign
UPDATE signalements SET assigned_to = 1 WHERE assigned_to IS NULL;
```

### Problem: Permission denied errors

**Solution**:
```bash
# Check user role
SELECT id, email, role FROM users WHERE email = 'user@test';

# Check role permissions
grep -A5 "analyst_jr" backend/app/rbac.py

# Verify token has permissions
curl http://localhost:8000/auth/me -H "Authorization: Bearer <TOKEN>" | jq '.permissions'
```

---

## Success Criteria

✅ **Deployment is successful if**:

1. **Security**: No unauthorized access
   - analyst_jr cannot access /users
   - All routes require valid token
   - OTP required before authentication

2. **Workflows**: Complete signalement processing
   - Citizen report → signalement creation
   - Analyst escalation → chief notification
   - Chief decision → transmission confirmation

3. **Notifications**: All alerts sent
   - Escalation notifications received
   - SLA warnings at 6h mark
   - Transmission confirmations sent

4. **Audit**: Full logging
   - All actions recorded with timestamp/user/role
   - Audit trail immutable
   - Export capability working

5. **Performance**: System responsive
   - Dashboard < 2 seconds
   - Queries < 1 second
   - 50 concurrent users without degradation

---

**Ready to Deploy? → Run test suite, verify environment, follow deployment steps above.**
