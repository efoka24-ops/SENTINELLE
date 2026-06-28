import { useOutletContext } from 'react-router-dom';
import { colors, MONO, meta, rgba, type Level } from '../../../theme';
import { kpis as mockKpis } from '../../../data/mock';
import { alertCounts, trending, type AdminOutletContext } from '../adminUtils';
import { useOverview, useAlerts } from '../../../api/hooks';

const LEVELS: Level[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/**
 * Dashboard for chief (team lead) role.
 * Shows: team workload, pending escalations, trending threats, analyst performance.
 */
export function DashboardChief() {
  const ov = useOverview();
  const liveAlerts = useAlerts();

  // KPIs for chief view - team focused
  const kpis = ov.data
    ? [
        { value: '8', label: 'Équipe active' },
        { value: String(ov.data.alerts), label: 'Alertes équipe' },
        { value: '3', label: 'Escaladées' },
        { value: '91%', label: 'SLA équipe' },
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

  // Mock team members and their workload
  const teamMembers = [
    { name: 'K.D. Analyste', alerts: 12, slc: '96%' },
    { name: 'M. Analyst', alerts: 8, slc: '92%' },
    { name: 'P. Fouda', alerts: 15, slc: '88%' },
    { name: 'N. Smith', alerts: 6, slc: '98%' },
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
        {/* Team Workload */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, gap: 14 }}>
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
              Répartition équipe
            </div>
            {teamMembers.map((m) => (
              <div key={m.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: colors.text3 }}>{m.name}</span>
                  <span style={{ fontFamily: MONO, color: colors.muted }}>
                    {m.alerts} alertes · {m.slc}
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: '#eef1ee',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(m.alerts / 16) * 100}%`,
                      background: 'linear-gradient(90deg,#0a7d3c,#3fb56e)',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Alert Distribution */}
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
              Alertes par niveau
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
                <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: a.color }}>
                  {a.n}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Trends & Recent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
          {/* Pending Escalations */}
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
              Escalades en attente
            </div>
            {[
              { id: 1, alert: '#ALR-2026-0047', analyst: 'K.D.', priority: 'HIGH', time: '14 min' },
              { id: 2, alert: '#ALR-2026-0043', analyst: 'P.F.', priority: 'MEDIUM', time: '1 h' },
              { id: 3, alert: '#ALR-2026-0039', analyst: 'M.A.', priority: 'CRITICAL', time: '2 h' },
            ].map((e) => {
              const pm = meta(e.priority as Level);
              return (
                <div
                  key={e.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: rgba(pm.c, 0.08),
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: colors.text2,
                        fontFamily: MONO,
                      }}
                    >
                      {e.alert}
                    </div>
                    <div style={{ fontSize: 10, color: colors.muted3, marginTop: 2 }}>
                      {e.analyst} · {e.time}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '.05em',
                      color: pm.c,
                      border: `1px solid ${pm.c}`,
                      borderRadius: 4,
                      padding: '2px 6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {pm.l}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Trending Threats */}
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
                marginBottom: 15,
              }}
            >
              Tendances · 24 h
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {trending.slice(0, 5).map((t) => (
                <div key={t.tag} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: colors.muted3, width: 12, flex: 'none' }}>
                    {t.rank}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12.5,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ color: colors.text2, fontWeight: 500 }}>{t.tag}</span>
                      <span style={{ fontFamily: MONO, color: t.c }}>{t.score}</span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: '#eef1ee',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: t.pct,
                          background: t.c,
                          borderRadius: 3,
                        }}
                      />
                    </div>
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
