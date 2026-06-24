import { useOutletContext } from 'react-router-dom';
import { Hov } from '../../../lib/Hoverable';
import { colors, MONO, meta, rgba, type Level } from '../../../theme';
import { kpis as mockKpis } from '../../../data/mock';
import {
  regions,
  alertCounts,
  trending,
  volumes,
  type AdminOutletContext,
} from '../adminUtils';
import { useOverview, useAlerts, useHeatmap } from '../../../api/hooks';

const LEVELS: Level[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function DashboardView() {
  const { feed, openFiche } = useOutletContext<AdminOutletContext>();
  const ov = useOverview();
  const liveAlerts = useAlerts();
  const heat = useHeatmap();

  // KPIs : live si dispo, sinon mock.
  const kpis = ov.data
    ? [
        { value: ov.data.analyzed.toLocaleString('fr-FR'), label: 'Contenus analysés' },
        { value: String(ov.data.threats), label: 'Menaces détectées' },
        { value: String(ov.data.alerts), label: 'Alertes émises' },
        ...mockKpis.slice(3),
      ]
    : mockKpis;

  // Compteurs d'alertes : live si dispo.
  const counts = (liveAlerts.data && liveAlerts.data.length)
    ? LEVELS.map((lvl) => {
        const m = meta(lvl);
        return { level: lvl, color: m.c, label: m.l, n: liveAlerts.data!.filter((a) => a.level === lvl).length, bg: rgba(m.c, 0.1) };
      })
    : alertCounts;

  // Carte des risques : superposition live (>0).
  const byRegion = Object.fromEntries((heat.data ?? []).map((h) => [h.region, h]));
  const regionsView = regions.map((r) => {
    const h = byRegion[r.name];
    if (!h || h.threat_count === 0) return r;
    const m = meta(h.threat_level as Level);
    return { ...r, score: h.risk_score.toFixed(2), color: m.c, levelLabel: m.l, tileBg: rgba(m.c, 0.14), tileBorder: rgba(m.c, 0.55), pulse: h.threat_level === 'CRITICAL' || h.threat_level === 'HIGH' };
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1, background: '#e3e6e2', borderBottom: '1px solid #e3e6e2', flex: 'none' }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: colors.panelDeep, padding: '10px 16px' }}>
            <div style={{ fontFamily: MONO, fontSize: 19, fontWeight: 600, color: colors.text }}>{k.value}</div>
            <div style={{ fontSize: 10, color: colors.muted2, letterSpacing: '.02em', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '362px 1fr 338px', gap: 14, padding: 14, minHeight: 0 }}>
        {/* Carte des risques */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 15, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }}>
              <span style={{ fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>Carte des risques</span>
              <span style={{ fontSize: 10, color: colors.muted3, fontFamily: MONO }}>10 RÉGIONS</span>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(6,1fr)', gap: 6, minHeight: 248 }}>
              {regionsView.map((r) => (
                <div key={r.name} style={{ gridColumn: r.gc, gridRow: r.gr, background: r.tileBg, border: `1px solid ${r.tileBorder}`, borderRadius: 7, padding: '6px 7px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.03em', color: r.color }}>{r.short}</span>
                    {r.pulse && (
                      <span style={{ position: 'relative', width: 7, height: 7, display: 'block' }}>
                        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: r.color }} />
                        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: r.color, animation: 'pulse 2.2s infinite' }} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: colors.text }}>{r.score}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 13, flexWrap: 'wrap' }}>
              {[['#dc2626', 'Critique'], ['#ea580c', 'Élevé'], ['#ca8a04', 'Moyen'], ['#16a34a', 'Faible'], ['#2563eb', 'Info']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                  <span style={{ fontSize: 10, color: colors.muted }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Flux + volumes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 15px 11px', borderBottom: '1px solid #e3e6e2' }}>
              <span style={{ fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>Flux temps réel</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: MONO, color: '#16a34a' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', animation: 'blink 1.4s infinite' }} />LIVE
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 11px' }}>
              {feed.map((f) => (
                <Hov
                  key={f.id}
                  onClick={() => openFiche(f)}
                  base={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 5px', borderBottom: '1px solid #eceee9', cursor: 'pointer' }}
                  hover={{ background: '#f5f7f4' }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 11, color: colors.muted3, width: 36, flex: 'none' }}>{f.time}</span>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: f.color, flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: colors.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.text}</div>
                    <div style={{ fontSize: 11, color: '#7a857b', marginTop: 1 }}>{f.platform} · {f.place}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.05em', color: f.color, border: `1px solid ${f.color}`, borderRadius: 4, padding: '2px 5px', flex: 'none', textTransform: 'uppercase' }}>{f.levelLabel}</span>
                </Hov>
              ))}
            </div>
          </div>

          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 15, flex: 'none' }}>
            <div style={{ fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 14 }}>Volumes par plateforme · 24 h</div>
            {volumes.map((v) => (
              <div key={v.name} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: colors.text3 }}>{v.name}</span>
                  <span style={{ fontFamily: MONO, color: colors.muted }}>{v.value}</span>
                </div>
                <div style={{ height: 6, background: '#eef1ee', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: v.pct, background: 'linear-gradient(90deg,#0a7d3c,#3fb56e)', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes + tendances */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 15, flex: 'none' }}>
            <div style={{ fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 13 }}>Alertes actives</div>
            {counts.map((a) => (
              <div key={a.level} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: a.bg, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: a.color }} />
                  <span style={{ fontSize: 13, color: colors.text2, fontWeight: 500 }}>{a.label}</span>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: a.color }}>{a.n}</span>
              </div>
            ))}
          </div>

          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 15, flex: 1, minHeight: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 15 }}>Tendances · 24 h</div>
            {trending.map((t) => (
              <div key={t.tag} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: colors.muted3, width: 12, flex: 'none' }}>{t.rank}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ color: colors.text2, fontWeight: 500 }}>{t.tag}</span>
                    <span style={{ fontFamily: MONO, color: t.c }}>{t.score}</span>
                  </div>
                  <div style={{ height: 5, background: '#eef1ee', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: t.pct, background: t.c, borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
