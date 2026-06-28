import { colors, MONO, meta, rgba, type Level } from '../../../theme';
import { kpis as mockKpis } from '../../../data/mock';
import { regions, alertCounts } from '../adminUtils';
import { useOverview, useAlerts, useHeatmap } from '../../../api/hooks';

const LEVELS: Level[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/**
 * Dashboard for director role.
 * Shows: national overview, escalation summary per chief, compliance metrics, transmitted signalements.
 */
export function DashboardDirector() {
  const ov = useOverview();
  const liveAlerts = useAlerts();
  const heat = useHeatmap();

  // KPIs for director view - national level
  const kpis = ov.data
    ? [
        { value: String(ov.data.analyzed), label: 'Contenus analysés' },
        { value: String(ov.data.threats), label: 'Menaces détectées' },
        { value: String(ov.data.alerts), label: 'Total alertes' },
        { value: '4/4', label: 'Chefs actifs' },
      ]
    : mockKpis.slice(0, 4);

  // Alert counts
  const counts = (liveAlerts.data && liveAlerts.data.length)
    ? LEVELS.map((lvl) => {
        const m = meta(lvl);
        return {
          level: lvl,
          color: m.c,
          label: m.l,
          n: liveAlerts.data!.filter((a) => a.level === lvl).length,
          bg: rgba(m.c, 0.1),
        };
      })
    : alertCounts;

  // Risk map by region
  const byRegion = Object.fromEntries((heat.data ?? []).map((h) => [h.region, h]));
  const regionsView = regions.map((r) => {
    const h = byRegion[r.name];
    if (!h || h.threat_count === 0) return r;
    const m = meta(h.threat_level as Level);
    return {
      ...r,
      score: h.risk_score.toFixed(2),
      color: m.c,
      levelLabel: m.l,
      tileBg: rgba(m.c, 0.14),
      tileBorder: rgba(m.c, 0.55),
      pulse: h.threat_level === 'CRITICAL' || h.threat_level === 'HIGH',
    };
  });

  // Mock escalation summary by chief
  const escalationBySupervisor = [
    { chief: 'Chef Équipe 1', count: 5, status: 'In Progress' },
    { chief: 'Chef Équipe 2', count: 3, status: 'On Track' },
    { chief: 'Chef Équipe 3', count: 7, status: 'High Volume' },
    { chief: 'Chef Équipe 4', count: 2, status: 'On Track' },
  ];

  // Mock compliance metrics
  const complianceMetrics = [
    { name: 'SLA Compliance', value: '94%', trend: '+2%' },
    { name: 'Response Time < 4h', value: '96%', trend: '+1%' },
    { name: 'Escalation Rate', value: '3.2%', trend: '-0.5%' },
    { name: 'Citizen Satisfaction', value: '91%', trend: '+3%' },
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
          gridTemplateColumns: '380px 1fr 340px',
          gap: 14,
          padding: 14,
          minHeight: 0,
        }}
      >
        {/* Regional Risk Map */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 15,
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 13,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: '.13em',
                  textTransform: 'uppercase',
                  color: colors.muted2,
                  fontWeight: 600,
                }}
              >
                Carte nationale
              </span>
              <span style={{ fontSize: 10, color: colors.muted3, fontFamily: MONO }}>
                10 RÉGIONS
              </span>
            </div>
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(4,1fr)',
                gridTemplateRows: 'repeat(6,1fr)',
                gap: 6,
                minHeight: 248,
              }}
            >
              {regionsView.map((r) => (
                <div
                  key={r.name}
                  style={{
                    gridColumn: r.gc,
                    gridRow: r.gr,
                    background: r.tileBg,
                    border: `1px solid ${r.tileBorder}`,
                    borderRadius: 7,
                    padding: '6px 7px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: '.03em',
                        color: r.color,
                      }}
                    >
                      {r.short}
                    </span>
                    {r.pulse && (
                      <span style={{ position: 'relative', width: 7, height: 7, display: 'block' }}>
                        <span
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: r.color,
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: r.color,
                            animation: 'pulse 2.2s infinite',
                          }}
                        />
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: colors.text }}>
                    {r.score}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 13, flexWrap: 'wrap' }}>
              {[
                ['#dc2626', 'Critique'],
                ['#ea580c', 'Élevé'],
                ['#ca8a04', 'Moyen'],
                ['#16a34a', 'Faible'],
              ].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                  <span style={{ fontSize: 10, color: colors.muted }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Escalations & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
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
              Escalades par chef d'équipe
            </div>
            {escalationBySupervisor.map((e) => (
              <div
                key={e.chief}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: colors.panelDeep,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: colors.text2,
                    }}
                  >
                    {e.chief}
                  </div>
                  <div style={{ fontSize: 10, color: colors.muted3, marginTop: 2 }}>
                    {e.status}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: e.count >= 5 ? '#ea580c' : colors.greenDark,
                    fontFamily: MONO,
                  }}
                >
                  {e.count}
                </span>
              </div>
            ))}
          </div>

          {/* Alert Summary */}
          <div
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 15,
              flex: 1,
              minHeight: 0,
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
              Distribution des alertes
            </div>
            {counts.map((a) => (
              <div
                key={a.level}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: a.bg,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: a.color }} />
                  <span style={{ fontSize: 13, color: colors.text2, fontWeight: 500 }}>
                    {a.label}
                  </span>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: a.color }}>
                  {a.n}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Compliance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
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
              Conformité
            </div>
            {complianceMetrics.map((m) => (
              <div key={m.name} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11.5,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ color: colors.text3, fontWeight: 500 }}>{m.name}</span>
                  <span>
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: colors.greenDark }}>
                      {m.value}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: '#16a34a',
                        marginLeft: 6,
                        fontWeight: 500,
                      }}
                    >
                      {m.trend}
                    </span>
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: '#eef1ee',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: m.value.replace('%', ''),
                      background: 'linear-gradient(90deg,#0a7d3c,#3fb56e)',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Transmitted Signalements */}
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
              Signalements transmis
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
              {[
                { label: 'Autorités', count: 47, color: colors.cyan },
                { label: 'ANSSI', count: 12, color: '#ea580c' },
                { label: 'MINREX', count: 8, color: colors.amber },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: colors.text3 }}>{s.label}</span>
                    <span style={{ fontFamily: MONO, fontWeight: 600, color: s.color }}>
                      {s.count}
                    </span>
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
                        width: `${(s.count / 50) * 100}%`,
                        background: s.color,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
