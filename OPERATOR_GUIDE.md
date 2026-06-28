# SENTINELLE Back Office - Operator Guide
## Quick Reference for Daily Operations

**Document Version**: 1.0  
**Last Updated**: 2026-06-28  
**Target Audience**: Analysts, Chiefs, Directors, Auditors

---

## Table of Contents
1. [Login & Authentication](#login--authentication)
2. [Your Role Dashboard](#your-role-dashboard)
3. [Processing Signalements](#processing-signalements)
4. [Escalation Workflow](#escalation-workflow)
5. [Making Decisions](#making-decisions)
6. [Viewing Reports](#viewing-reports)
7. [Common Tasks](#common-tasks)

---

## Login & Authentication

### Step 1: Go to Back Office
- Navigate to: `https://sentinelle.minpostel.cm/admin/login`

### Step 2: Enter Email
- Professional email: `firstname.lastname@sentinelle.cm`
- Click "Recevoir mon code"

### Step 3: Enter OTP Code
- Check your email for code (valid 10 minutes)
- Example: `123456`
- Paste into field on screen
- Click "Se connecter"

### Step 4: You're In!
- Dashboard loads automatically based on your role
- You'll see only features you're authorized to use

**💡 Tip**: Bookmark `/admin/dashboard` for quick access

---

## Your Role Dashboard

### 🔵 Analyst Junior (analyst_jr)

**What You See**:
- Your assigned signalements
- Your performance metrics
- Pending escalations you submitted
- Alerts you've acknowledged

**Available Actions**:
- Read signalements assigned to you
- Analyze and qualify each report
- Escalate to your Chief (required if uncertain)
- View related OSINT intelligence

**Menu Tabs**:
```
SUPERVISION    → Tableau de bord, Carte
RENSEIGNEMENT  → Acteurs menaçants
OPÉRATIONS     → Alertes, Signalements
```

---

### 🟠 Analyst Senior (analyst_sr)

**What You See** (everything analyst_jr has, plus):
- Collecte (data collection metrics)
- Analyse (IA classification results)
- Rapports (reports library)
- Team's escalations (read-only)

**Available Actions** (everything analyst_jr has, plus):
- Launch scans on platforms
- Generate reports
- View team performance
- Suggest bulk reassignments

**Menu Tabs**:
```
SUPERVISION    → Tableau de bord, Carte
VEILLE         → Collecte, Analyse IA
RENSEIGNEMENT  → Acteurs menaçants
OPÉRATIONS     → Alertes, Signalements
PRODUCTION     → Rapports
```

---

### 🔴 Chef d'équipe (chief)

**What You See**:
- All team member signalements
- Team performance analytics
- Pending escalations needing decision
- Regional threat trends
- System endpoints health

**Available Actions** (everything senior has, plus):
- Decide on escalated signalements
- Reassign signalements between analysts
- Validate and sign-off on reports
- Override analyst decisions if needed

**Critical Responsibility**: 
⚠️ **SLA Enforcement** - Ensure < 24h response time per signalement

**Menu Tabs**:
```
PRODUCTION     → Endpoints (system health)
(All senior tabs)
```

---

### 🟣 Directeur (director)

**What You See**:
- National dashboard (all regions)
- All escalations nationally
- Audit journal (full transparency)
- Compliance metrics

**Available Actions** (everything chief has, plus):
- Transmit final decisions to authorities
- Override chief decisions
- Generate compliance reports
- View ethics committee feedback

**Critical Responsibility**: 
⚠️ **Authority Liaison** - Ensure ANTIC/Armée/Parquet timely notification

**Menu Tabs**:
```
PRODUCTION & GOUVERNANCE → Audit, Journal d'Audit
(All tabs accessible)
```

---

### 🟡 Auditeur CEC (auditor)

**What You See**:
- Complete audit trail (read-only)
- All decisions and rationales
- Compliance metrics
- Ethics alerts and anomalies

**Available Actions**:
- Annotate signalements (questions, concerns)
- Generate audit reports
- Flag procedure violations
- Export records for committee

**Cannot**:
- Modify any signalement
- Make decisions
- Reassign
- Delete history

---

## Processing Signalements

### What is a Signalement?

A **signalement** is a citizen report of online threats that you must:
1. **Read** - Understand the citizen's concern
2. **Analyze** - Qualify the threat (category, gravity)
3. **Decide** - Validate (transmit to authority) or reject
4. **Escalate** - If uncertain, ask your chief

---

### Signalement Status Flow

```
┌──────────────┐
│   NOUVEAU    │  ← Just received, unread
└──────┬───────┘
       │ You open it
       ↓
┌──────────────┐
│  ANALYSE     │  ← You're analyzing
└──────┬───────┘
       │ You decide action
       ├─ Escalade →  Chief will decide
       ├─ Validé → Transmit to authority
       └─ Rejeté → Reject & close
       ↓
┌──────────────┐
│ TRANSMITTED  │  ← Decision made & sent
└──────────────┘
```

---

### Step-by-Step: Process a Signalement

#### For Analyst:

1. **Open Signalment**
   - Click "Signalements" in menu
   - Click on signalement to open details

2. **Read Full Details**
   - URL/Source
   - Description from citizen
   - Screenshots/evidence
   - Timestamp received

3. **Analyze**
   - Note threat category: Terrorisme / Désinformation / Cyberattaque / etc.
   - Note gravity: Faible / Modéré / Grave / Critique
   - Write notes in "Observations" field

4. **Decide Action**

   **If CONFIDENT → Propose Decision**
   ```
   Decision: ⭕ Validé (send to authorities)
   Authority: ANTIC  [or Armée, Parquet]
   Reason: "Clear false health claims"
   ```
   → Chief reviews & approves

   **If UNCERTAIN → Escalate**
   ```
   Escalade → Chief
   Reason: "Unclear jurisdiction - military context"
   ```
   → Chief makes final decision

5. **Submit**
   - Click "Proposer" (propose) or "Escalader" (escalate)
   - You'll receive notification when chief decides

---

#### For Chief:

1. **View Dashboard**
   - See pending escalations/decisions
   - Prioritize by: Gravity, Region, Time

2. **Open Escalated Signalment**
   - Review analyst's notes
   - Check evidence
   - Read escalation reason

3. **Make Final Decision**
   ```
   Radio button: Validé  [✓ most common]
                 Rejeté
                 Escalade (to Director)
   
   Why? [required]: "Confirmed disinformation campaign"
   Authority: ANTIC or Armée
   ```

4. **Submit Decision**
   - Analyst receives confirmation
   - Authority receives notification
   - Audit trail records action

---

## Escalation Workflow

### When to Escalate?

**As Analyst, escalate if**:
- ❓ Unsure about category or gravity
- 🌍 Multi-regional threat
- 🎯 Targeting government/military
- 🔐 Possible coordinated campaign

**As Chief, escalate to Director if**:
- 🚨 Affects multiple regions
- 🏛️ Involves government response
- ⚖️ Legal/jurisdiction questions

---

### Escalation Chain

```
Citizen Report
    ↓
Analyst Junior/Senior
    ↓ [Unsure?]
    ├─→ ESCALADE to Chief
            ↓ [Still uncertain?]
            ├─→ ESCALADE to Director
                    ↓ [Final Decision]
                    └─→ Transmit to Authority
```

**Key**: Each level adds expertise/authority

---

### What Happens When You Escalate?

1. **Your Chief gets notified**
   - Email: "Signalement #REF escalé par vous"
   - In-app notification
   - Appears in "Pending Escalations"

2. **Time Starts Ticking**
   ⏰ 24-hour SLA for decision
   - You'll see red warning at < 6h

3. **You Receive Decision**
   - Email notification
   - Dashboard shows final status
   - Can view chief's reasoning

---

## Making Decisions

### Decision Types

#### ✅ VALIDÉ (Approve & Transmit)

Use when threat is **confirmed and actionable**.

```
Example:
- Category: Désinformation
- Gravity: Grave
- Threat: False malaria cure claims
- Authority: ANTIC (cyber health threats)
- Reason: "Endangers public health, coordinated campaign"
```

**Result**: Transmitted to authority, marked DONE

---

#### ❌ REJETÉ (Reject)

Use when:
- **Not a threat** (legitimate speech)
- **Out of scope** (not cybersecurity/national threat)
- **Insufficient evidence**
- **Already handled**

```
Example:
- Category: Discours de haine
- Gravity: Faible
- Reason: "Generic complaint, not targeted harassment"
```

**Result**: Marked DONE, not transmitted

---

#### ⬆️ ESCALADE (Escalate Higher)

Use when:
- **Need higher authority** (Director decision)
- **Multiple agencies involved**
- **Precedent-setting** (first of type)

```
Example:
To Director: "Potential foreign influence campaign,
needs MINPOSTEL coordination with ANTIC"
```

**Result**: Director reviews, makes final call

---

## Viewing Reports

### What Reports are Available?

- **Daily Activity** - Yesterday's signalements (chief+)
- **Weekly Trends** - Top threats by region (chief+)
- **Performance** - Your metrics vs team (chief+)
- **SLA Compliance** - % < 24h (chief+)
- **Audit Report** - Full trail (director+)

### How to Generate

1. Click "Rapports" in menu
2. Select type (Daily, Weekly, SLA, etc.)
3. Click "Générer"
4. Download as PDF or Excel

### How to Read

- **Numbers to watch**: % on-time, % validated, avg gravity
- **Trends**: What threat types increasing? Which regions?
- **Performance**: Your numbers vs team average

---

## Common Tasks

### Task 1: I have 10 new signalements, where do I start?

1. Sort by "Gravity" (Critique first)
2. Then by "Time received" (oldest first)
3. Process critical ones immediately
4. Flag < 5h remaining SLA items

### Task 2: I think this is a duplicate, what do I do?

1. In signalement detail, click "C'est un doublon"
2. Search for original signalement
3. Reference the original ID
4. Submit - marks as duplicate, closes it

### Task 3: I need to ask my chief for clarification

1. Click "Escalade" button
2. In "Reason" field, ask specific question
3. Chief will see it + signalement context
4. They'll reply with decision

### Task 4: I want to see what my team did this week

1. As chief: Click "Rapports"
2. Select "Rapport de performance individuelle"
3. Filter by date range
4. See each analyst's: volume, % validated, avg time

### Task 5: I need to produce audit report for ethics committee

1. As director: Click "Audit"
2. Filter by date range and severity
3. Click "Exporter" button
4. File downloads (PDF, can print & sign)

### Task 6: A signalement is taking too long, remind team

1. View signalement detail
2. See SLA timer (red if < 6h)
3. For chief: Reassign to less busy analyst
4. For director: Email team about overdue SLA

---

## Important Reminders ⚠️

### Deadlines
- **24 hours** from citizen report received
- **Red warning** at < 6 hours remaining
- **Override escalation** if chief hasn't decided by 20h

### Quality Standards
- **Every decision** needs written reason
- **Every escalation** needs specific question/reason
- **No decisions** without evidence review

### Security
- **Don't** share signalements outside system
- **Don't** modify another analyst's work
- **Don't** close signalements without decision
- **Do** logout when done

### Accuracy
- **Gravity levels matter**: 
  - Faible = annoying but not urgent
  - Critique = immediate danger
- **Authority matters**: 
  - ANTIC = cyber security
  - Armée = military threat
  - Parquet = criminal matter

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close detail panel |
| `E` | Open Escalade dialog |
| `D` | Open Decision dialog |
| `S` | Open Search |
| `/` | Focus search |
| `?` | Show all shortcuts |

---

## Help & Support

### If Login Doesn't Work
- Check email address (use @sentinelle.cm)
- Check email for OTP (check spam folder)
- OTP expires after 10 minutes
- Click "Renvoyer le code" for new one

### If You Can't See Something
- Check your role (top right corner)
- Check your permissions (hover over X button)
- Ask your chief to verify your role assignment

### If Something is Broken
- Refresh page (Ctrl+R or Cmd+R)
- Clear browser cache
- Try a different browser
- Report to IT: sentinelle-support@minpostel.cm

### Contact Your Manager
- **Analyst**: Contact your chief
- **Chief**: Contact director
- **Director**: Contact ANTIC liaison
- **Auditor**: Contact ethics committee chair

---

## Performance Tips

### Go Faster ⚡

1. **Use keyboard shortcuts** - E for escalade, D for decide
2. **Filter first** - Show only Nouveau (unread)
3. **Batch decisions** - Do similar gravity together
4. **Know your OSINT** - Acteurs menaçants shows repeat offenders
5. **Use templates** - Common reasons auto-populate

### Stay Organized 📊

1. **Morning**: 5 min review of overnight escalations
2. **Hourly**: Check new arrivals
3. **2h before deadline**: Handle < 6h SLA items
4. **EOD**: Close out day's work, review tomorrow's load

### Quality Checks ✅

1. **Before submitting**: 
   - Did I read all evidence?
   - Did I write a reason?
   - Did I pick the right authority?

2. **Before escalading**:
   - Is this really uncertain?
   - What specific question does chief need to answer?

3. **Before rejecting**:
   - Have I verified it's not a threat?
   - Did I check for related reports?

---

## FAQ

**Q: How do I know if my decision was transmitted to authority?**  
A: Status changes to "Transmitted" + you get notification email. Check "Audit" view to see exact time.

**Q: Can I undo a decision?**  
A: No, all decisions are final. But director can override if needed. Contact your chief if wrong decision made.

**Q: What if two analysts work on same signalement?**  
A: Can't happen - system assigns to ONE person. If reassigned, previous analyst loses access.

**Q: Do I have to decide within 24 hours?**  
A: Yes. SLA is < 24h. System will warn you at 6h remaining. Contact chief if you need extension.

**Q: What happens if I escalate to chief but chief doesn't decide in time?**  
A: Director is notified, SLA violation logged, escalation escalated to director.

**Q: Can auditor see what I write in private notes?**  
A: Yes. All notes are logged. Write professional observations only.

---

## Quick Links

- **Back Office**: https://sentinelle.minpostel.cm/admin/
- **Public Portal**: https://sentinelle.minpostel.cm/signaler
- **Help & Docs**: https://sentinelle.minpostel.cm/docs
- **Report Issue**: sentinelle-support@minpostel.cm

---

**Version 1.0** | Last updated: 2026-06-28 | Next review: 2026-07-28
