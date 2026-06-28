import { useOutletContext } from 'react-router-dom';
import { Hov } from '../../../lib/Hoverable';
import { colors, MONO, meta, rgba, type Level } from '../../../theme';
import { kpis as mockKpis } from '../../../data/mock';
import { alertCounts, volumes, type AdminOutletContext } from '../adminUtils';
import { useOverview, useAlerts } from '../../../api/hooks';

const LEVELS: Level[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/**
 * Dashboard for analyst_jr and analyst_sr roles.
 * Shows: my alerts, SLA status, recent escalations, performance metrics.
 */
export function DashboardAnalyst() {
  const { feed, openFiche } = useOutletContext<AdminOutletContext>();
  const ov = useOverview();
  const liveAlerts = useAlerts();

  // KPIs for analyst view
  const kpis = ov.data
    ? [
        { value: String(ov.data.alerts), label: 'Mes alertes' },
        { value: '94%', label: 'SLA compliance' },
        { value: '2', label: 'Escaladées' },
        { value: '87.5%', label: 'Taux traitement' },
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
        {/* My Alerts */}
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
            <div style={{ fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 14 }}>
              Mes alertes assignées
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

            <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${colors.borderSoft}` }}>
              <div style={{ fontSize: 10.5, color: colors.muted2, marginBottom: 8 }}>
                SLA Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 8, background: '#eef1ee', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: '94%',
                      background: 'linear-gradient(90deg,#0a7d3c,#3fb56e)',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.greenDark, fontFamily: MONO }}>
                  94%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
          {/* Recent Feed */}
          <div
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 15px 11px',
                borderBottom: '1px solid #e3e6e2',
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
                Activités récentes
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  fontFamily: MONO,
                  color: '#16a34a',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#16a34a',
                    animation: 'blink 1.4s infinite',
                  }}
                />
                LIVE
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 11px' }}>
              {feed.slice(0, 8).map((f) => (
                <Hov
                  key={f.id}
                  onClick={() => openFiche(f)}
                  base={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '9px 5px',
                    borderBottom: '1px solid #eceee9',
                    cursor: 'pointer',
                  }}
                  hover={{ background: '#f5f7f4' }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 11, color: colors.muted3, width: 36, flex: 'none' }}>
                    {f.time}
                  </span>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: f.color, flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: colors.text2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {f.text}
                    </div>
                    <div style={{ fontSize: 11, color: '#7a857b', marginTop: 1 }}>
                      {f.platform} · {f.place}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '.05em',
                      color: f.color,
                      border: `1px solid ${f.color}`,
                      borderRadius: 4,
                      padding: '2px 5px',
                      flex: 'none',
                      textTransform: 'uppercase',
                    }}
                  >
                    {f.levelLabel}
                  </span>
                </Hov>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 15,
              flex: 'none',
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
              Performance · 7 j
            </div>
            {volumes.slice(0, 3).map((v) => (
              <div key={v.name} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: colors.text3 }}>{v.name}</span>
                  <span style={{ fontFamily: MONO, color: colors.muted }}>{v.value}</span>
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
                      width: v.pct,
                      background: 'linear-gradient(90deg,#0a7d3c,#3fb56e)',
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
  );
}
