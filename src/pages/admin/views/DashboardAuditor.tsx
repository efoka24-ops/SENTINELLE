import { colors, MONO, rgba } from '../../../theme';
import { kpis as mockKpis } from '../../../data/mock';
import { useOverview } from '../../../api/hooks';

/**
 * Dashboard for auditor role (read-only).
 * Shows: conformity alerts, incident reports, audit log summary, ethics recommendations.
 */
export function DashboardAuditor() {
  const ov = useOverview();

  // KPIs for auditor view - compliance focused
  const kpis = ov.data
    ? [
        { value: '3', label: 'Violations détectées' },
        { value: '12', label: 'Rapports incidents' },
        { value: '98', label: 'Entrées audit' },
        { value: '5', label: 'Recommandations' },
      ]
    : mockKpis.slice(0, 4);

  // Mock conformity alerts
  const conformityAlerts = [
    { id: 1, title: 'Accès non autorisé détecté', severity: 'HIGH', date: '2026-06-27 14:23' },
    { id: 2, title: 'Données sensibles exposées', severity: 'CRITICAL', date: '2026-06-27 10:15' },
    { id: 3, title: 'Procédure non respectée', severity: 'MEDIUM', date: '2026-06-26 18:44' },
  ];

  // Mock incident reports
  const incidentReports = [
    { ref: 'INC-2026-0081', type: 'Fuite données', status: 'Under Review', analyst: 'K.D.' },
    { ref: 'INC-2026-0080', type: 'Accès non autorisé', status: 'Closed', analyst: 'P.F.' },
    { ref: 'INC-2026-0079', type: 'Anomalie système', status: 'Investigating', analyst: 'M.A.' },
  ];

  // Mock ethics recommendations
  const ethicsRecs = [
    { id: 1, title: 'Améliorer la transparence des données', priority: 'HIGH' },
    { id: 2, title: 'Renforcer les contrôles d\'accès', priority: 'MEDIUM' },
    { id: 3, title: 'Documenter les décisions critiques', priority: 'MEDIUM' },
    { id: 4, title: 'Audit des données personnelles', priority: 'LOW' },
    { id: 5, title: 'Former le personnel RGPD', priority: 'MEDIUM' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 1,
          background: '#e3e6e2',
          borderBottom: '1px solid #e3e6e2',
          flex: 'none',
        }}
      >
        {kpis.map((k) => (
          <div key={k.label} style={{ background: colors.panelDeep, padding: '10px 16px' }}>
            <div style={{ fontFamily: MONO, fontSize: 19, fontWeight: 600, color: colors.text }}>
              {k.value}
            </div>
            <div style={{ fontSize: 10, color: colors.muted2, letterSpacing: '.02em', marginTop: 2 }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          padding: 14,
          minHeight: 0,
        }}
      >
        {/* Left: Conformity & Incidents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
          {/* Conformity Alerts */}
          <div
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 15,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.13em',
                textTransform: 'uppercase',
                color: colors.muted2,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Alertes de conformité
            </div>
            {conformityAlerts.map((a) => {
              const severityColor =
                a.severity === 'CRITICAL'
                  ? '#dc2626'
                  : a.severity === 'HIGH'
                    ? '#ea580c'
                    : '#ca8a04';
              return (
                <div
                  key={a.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: rgba(severityColor, 0.08),
                    borderLeft: `3px solid ${severityColor}`,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: colors.text2,
                        }}
                      >
                        {a.title}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: colors.muted3,
                          marginTop: 4,
                          fontFamily: MONO,
                        }}
                      >
                        {a.date}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '.05em',
                        color: severityColor,
                        border: `1px solid ${severityColor}`,
                        borderRadius: 4,
                        padding: '2px 6px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.severity === 'CRITICAL' ? 'CRIT' : a.severity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Incident Reports */}
          <div
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 15,
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.13em',
                textTransform: 'uppercase',
                color: colors.muted2,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Rapports incidents récents
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {incidentReports.map((r) => {
                const statusColor =
                  r.status === 'Closed'
                    ? colors.greenDark
                    : r.status === 'Under Review'
                      ? '#ca8a04'
                      : '#ea580c';
                return (
                  <div
                    key={r.ref}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: colors.panelDeep,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: colors.text2,
                          fontFamily: MONO,
                        }}
                      >
                        {r.ref}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: colors.muted3,
                          marginTop: 2,
                        }}
                      >
                        {r.type} · {r.analyst}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: statusColor,
                        background: rgba(statusColor, 0.1),
                        borderRadius: 5,
                        padding: '3px 8px',
                        whiteSpace: 'nowrap',
                        marginLeft: 8,
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Ethics & Audit Log Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
          {/* Audit Log Summary */}
          <div
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 15,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.13em',
                textTransform: 'uppercase',
                color: colors.muted2,
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              Résumé audit · 7 j
            </div>
            {[
              { action: 'Modifications config', count: 14 },
              { action: 'Créations rapports', count: 8 },
              { action: 'Changements accès', count: 23 },
              { action: 'Exports données', count: 5 },
            ].map((s) => (
              <div key={s.action} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ color: colors.text3 }}>{s.action}</span>
                  <span style={{ fontFamily: MONO, color: colors.muted }}>{s.count}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: '#eef1ee',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(s.count / 24) * 100}%`,
                      background: '#ea580c',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Ethics Committee Recommendations */}
          <div
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 15,
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.13em',
                textTransform: 'uppercase',
                color: colors.muted2,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Comité d'éthique · Recommandations
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              {ethicsRecs.map((r) => {
                const priorityColor =
                  r.priority === 'HIGH'
                    ? '#ea580c'
                    : r.priority === 'MEDIUM'
                      ? '#ca8a04'
                      : '#16a34a';
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: rgba(priorityColor, 0.08),
                      borderLeft: `3px solid ${priorityColor}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: colors.text2,
                        lineHeight: 1.4,
                      }}
                    >
                      {r.title}
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: priorityColor,
                        marginTop: 4,
                        display: 'inline-block',
                      }}
                    >
                      {r.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
