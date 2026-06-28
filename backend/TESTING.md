# SENTINELLE Testing Framework

Comprehensive testing suite for security, workflows, compliance, and performance.

## Overview

The SENTINELLE testing framework covers:
- **Security**: Authentication, authorization, and token handling
- **Workflows**: Citizen reports, escalation, decision-making, and transmission
- **RBAC**: Role-based access control and permission enforcement
- **Notifications**: Escalation alerts, SLA warnings, and message delivery
- **Audit Compliance**: Immutable audit trail and ethics committee reporting
- **Performance**: Response times, scalability, and concurrency handling

## Test Organization

```
backend/tests/
├── __init__.py
├── conftest.py          # Pytest configuration and shared fixtures
├── fixtures.py          # Test data generators
├── test_security.py     # Authentication & authorization tests
├── test_workflows.py    # Business process tests
├── test_rbac.py         # RBAC permission tests
├── test_notifications.py # Notification delivery tests
├── test_audit.py        # Audit trail compliance tests
└── test_performance.py  # Performance & load tests
```

## Installation

```bash
cd backend
pip install -r requirements.txt
```

Key test dependencies:
- `pytest==7.4.4` - Test framework
- `pytest-cov==4.1.0` - Code coverage
- `pytest-asyncio==0.23.3` - Async test support

## Running Tests

### All Tests

```bash
cd backend
bash run_tests.sh
```

### Specific Test Suite

```bash
# Security tests only
pytest tests/test_security.py -v

# RBAC tests only
pytest tests/test_rbac.py -v

# Workflow tests
pytest tests/test_workflows.py -v

# Audit tests
pytest tests/test_audit.py -v

# Performance tests
pytest tests/test_performance.py -v
```

### With Coverage Report

```bash
pytest --cov=app --cov-report=html --cov-report=term-missing tests/
```

This generates:
- HTML report: `coverage_html/index.html`
- Terminal output with uncovered lines

### Run Single Test

```bash
pytest tests/test_security.py::TestAuthentication::test_request_code_creates_login_code -v
```

### Run Tests Matching Pattern

```bash
pytest -k "escalat" -v  # All escalation-related tests
pytest -k "rbac" -v     # All RBAC tests
```

## Test Fixtures

Common fixtures available in all tests:

### Database Fixtures

- **`db`** - Fresh database session for each test
- **`db_engine`** - SQLite in-memory database

### User Fixtures

- **`users`** - Dict of test users: `analyst_jr`, `analyst_sr`, `chief`, `director`, `admin`, `auditor`
- **`auth_tokens`** - JWT tokens for each user
- **`headers_for_role(role)`** - Authorization headers for a specific role

### Data Fixtures

- **`citizen_reports`** - Sample citizen reports
- **`alerts`** - Test alerts with various severity levels
- **`signalements`** - Signalements at different workflow stages
- **`login_codes`** - OTP codes for testing authentication
- **`audit_logs`** - Sample audit trail entries
- **`notifications`** - Test notifications

### API Fixture

- **`client`** - FastAPI TestClient with test database

## Test Coverage

### Security Tests (test_security.py)

#### Authentication
- ✓ Code request creates LoginCode entry
- ✓ Code verification generates JWT token
- ✓ Invalid/expired codes rejected
- ✓ Used codes cannot be reused
- ✓ Password login fallback works

#### Authorization
- ✓ Analyst_jr cannot access users endpoint (403)
- ✓ Permission decorators enforced
- ✓ Token expiration checked
- ✓ Malformed tokens rejected

#### Password Security
- ✓ PBKDF2 hashing works
- ✓ Same password produces different hashes (salt)
- ✓ Correct passwords verify
- ✓ Wrong passwords fail verification

#### User Inactivation
- ✓ Inactive users cannot login
- ✓ Valid token for inactive user rejected

### Workflow Tests (test_workflows.py)

#### Citizen Report Workflow
- ✓ Citizen report submission creates signalement
- ✓ Auto-assignment to least-loaded analyst
- ✓ Creation logged in audit trail

#### Escalation
- ✓ Analyst_jr can escalate
- ✓ Analyst_sr can escalate
- ✓ Chief cannot escalate
- ✓ Escalation creates notification
- ✓ Escalation logged in audit

#### Decision Making
- ✓ Chief can validate signalements
- ✓ Chief can reject signalements
- ✓ Director can make decisions
- ✓ Analyst_jr cannot decide (403)
- ✓ Invalid decisions rejected
- ✓ Decisions logged in audit

#### Transmission
- ✓ Validated signalements transmitted to authority
- ✓ Rejected signalements not transmitted
- ✓ Transmission creates notification

#### SLA Tracking
- ✓ 24-hour SLA deadline enforced
- ✓ 6-hour warning notification triggered
- ✓ Overdue signalements detected

### RBAC Tests (test_rbac.py)

#### Permission Definitions
- ✓ All roles defined with correct labels
- ✓ Analyst_jr has limited read-only access
- ✓ Analyst_sr has additional write permissions
- ✓ Chief has team management permissions
- ✓ Director has audit oversight
- ✓ Admin has all permissions
- ✓ Auditor has read-only access

#### Permission Enforcement
- ✓ `has_perm()` function works correctly
- ✓ Escalation requires alerts:write
- ✓ Decision requires reports:validate
- ✓ User management requires admin role

#### Endpoint Access Control
- ✓ Analyst_jr sees assigned signalements
- ✓ Analyst_jr blocked from escalation queue
- ✓ Chief can access escalation queue
- ✓ Director can access audit logs
- ✓ Auditor cannot write data

#### Role Hierarchy
- ✓ Analyst_sr has all analyst_jr permissions
- ✓ Chief has all analyst_sr permissions
- ✓ Director has all chief permissions
- ✓ Admin has all other permissions

### Notification Tests (test_notifications.py)

#### Notification Creation
- ✓ Escalation creates notification
- ✓ All required fields present
- ✓ Timestamp recorded correctly

#### Channels
- ✓ Email channel notifications
- ✓ SMS channel notifications
- ✓ WhatsApp channel notifications

#### Severity Levels
- ✓ CRITICAL level notifications
- ✓ HIGH level notifications
- ✓ MEDIUM level notifications

#### SLA Warnings
- ✓ 6-hour SLA warning created
- ✓ Overdue notifications marked CRITICAL

#### Targeting
- ✓ Escalations target analyst_sr
- ✓ Decisions target chief
- ✓ Further escalations target director

#### Query Filtering
- ✓ Filter by level
- ✓ Filter by channel
- ✓ Filter by threat type

### Audit Tests (test_audit.py)

#### Audit Log Creation
- ✓ All required fields recorded
- ✓ Timestamps immutable
- ✓ User role recorded at action time

#### Immutability (Append-Only)
- ✓ Logs cannot be deleted
- ✓ Logs cannot be modified
- ✓ Only additions, never deletions

#### Action Logging
- ✓ Signalement creation logged
- ✓ Escalation logged
- ✓ Decision logged
- ✓ Transmission logged
- ✓ User management logged

#### Audit Completeness
- ✓ Complete workflow trail
- ✓ Chronological order maintained
- ✓ All fields present for reporting

#### Citizen Anonymization
- ✓ Citizen names not in logs
- ✓ Only identifiers logged (SIG-XXXX)

#### Export
- ✓ Query by date range
- ✓ Query by user
- ✓ Query by action type
- ✓ All fields available for reporting

### Performance Tests (test_performance.py)

#### Response Times
- ✓ Health check < 100ms
- ✓ Alerts endpoint < 1s
- ✓ Contents endpoint < 1s
- ✓ Signalements endpoint < 500ms

#### Scalability
- ✓ Query 1000 alerts < 2s
- ✓ Query 1000 contents < 2s
- ✓ Query 1000 signalements < 2s

#### Concurrency
- ✓ Multiple concurrent users
- ✓ Writes don't block reads significantly

#### Database Efficiency
- ✓ Filtered queries efficient
- ✓ Ordered queries efficient
- ✓ Count queries efficient

## Test Data Generation

The `fixtures.py` module provides functions to generate realistic test data:

```python
# Create users with different roles
users = create_test_users(db)

# Create citizen reports at different stages
reports = create_test_citizen_reports(db)

# Create alerts with various threat levels
alerts = create_test_alerts(db)

# Create signalements at different workflow stages
signalements = create_test_signalements(db, users, reports, alerts)

# Create OTP codes for authentication testing
codes = create_test_login_codes(db, users)

# Create audit log entries
logs = create_audit_logs(db, users)

# Create notifications
notifs = create_notifications(db, users)
```

## Audit Report Generation

Export audit logs for ethics committee review:

```bash
# Export last 30 days (all formats)
python scripts/export_audit_report.py --days 30

# Export specific date range (CSV only)
python scripts/export_audit_report.py --start 2024-01-01 --end 2024-01-31 --format csv

# Export with anonymization (redacted targets)
python scripts/export_audit_report.py --days 30 --anonymize

# Generate summary report
python scripts/export_audit_report.py --days 7 --format summary
```

This generates:
- **CSV**: `audit_report_YYYYMMDD_HHMMSS.csv` - Spreadsheet format for analysis
- **JSON**: `audit_report_YYYYMMDD_HHMMSS.json` - Machine-readable format
- **Summary**: `audit_summary_YYYYMMDD_HHMMSS.txt` - Human-readable report

## Coverage Requirements

Minimum coverage threshold: **80%**

Target coverage by module:
- `app/security.py`: 100% (authentication is critical)
- `app/rbac.py`: 100% (authorization is critical)
- `app/audit.py`: 100% (compliance is critical)
- `app/routers/auth_users.py`: 95%
- `app/routers/data.py`: 85%
- Overall: 80%

Check coverage:

```bash
pytest --cov=app --cov-report=term-missing --cov-fail-under=80 tests/
```

## Debugging Tests

### Verbose Output

```bash
pytest -vv tests/test_security.py
```

### Stop on First Failure

```bash
pytest -x tests/
```

### Run Last Failed

```bash
pytest --lf tests/
```

### Print Output

```bash
pytest -s tests/test_security.py  # Shows print() statements
```

### Drop Into Debugger

```python
# In test file
def test_example(db):
    import pdb; pdb.set_trace()
    # Test code...
```

## CI/CD Integration

The test suite is designed to run in CI/CD pipelines:

```bash
# GitHub Actions, GitLab CI, etc.
cd backend
pip install -r requirements.txt
bash run_tests.sh
```

Exit codes:
- `0`: All tests passed, coverage >= 80%
- `1`: Tests failed or coverage < 80%

## Best Practices

### Writing New Tests

1. **Use descriptive names**: `test_analyst_jr_cannot_access_users_endpoint`
2. **One assertion per test** when possible (or group related assertions)
3. **Use fixtures** instead of creating data inline
4. **Test the happy path AND error cases**
5. **Document non-obvious test logic** with comments

Example:

```python
def test_escalation_creates_notification(self, client, db, users, headers_for_role, signalements):
    """Test that escalation creates notification for target."""
    sig = signalements[0]
    headers = headers_for_role("analyst_jr")
    
    # Analyst_jr escalates signalement
    response = client.post(
        f"/api/v1/signalements/{sig.id}/escalate",
        json={"reason": "Requires review"},
        headers=headers,
    )
    assert response.status_code == 200
    
    # Notification should be created for analyst_sr
    notif = db.query(Notification).filter_by(
        target=users["analyst_sr"].email
    ).first()
    assert notif is not None
```

### Testing Security

- Test both positive (allowed) and negative (denied) cases
- Verify correct error codes (401, 403)
- Test permission boundaries
- Verify token validation

### Testing Workflows

- Follow complete workflow paths
- Test invalid state transitions
- Verify audit logs at each step
- Check notification creation

### Testing RBAC

- Test each role's permissions
- Verify permission hierarchy
- Test boundary cases (missing permission)
- Verify unauthorized access blocked

## Known Limitations

1. Tests use in-memory SQLite (no PostgreSQL-specific features tested)
2. Concurrent tests sequential (TestClient not designed for true concurrency)
3. Email sending mocked (actual SMTP not tested)
4. External APIs not called (Apify, Twitter, etc.)

## Troubleshooting

### Import Errors

```
ModuleNotFoundError: No module named 'app'
```

Solution: Run tests from `backend/` directory

### Database Lock

```
sqlite3.OperationalError: database is locked
```

Solution: Each test gets fresh in-memory database; likely a test cleanup issue

### Test Timeout

Tests shouldn't timeout; if they do, check for:
- Infinite loops in test code
- Database deadlocks
- Network calls (shouldn't happen in tests)

## Contributing Tests

When adding features:

1. **Write tests first** (TDD approach)
2. **Cover all roles** (analyst_jr, analyst_sr, chief, director, admin, auditor)
3. **Test error cases** (404, 403, 400, 500)
4. **Add audit logging** tests for compliance
5. **Update this document** with new test coverage

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/advanced/testing-dependencies/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/20/faq/sqlalchemy_sql.html#session-scoping)
- [OWASP Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

## Contact

For questions about testing:
- Email: emm.foka@gmail.com
- Code: See `backend/tests/` directory
