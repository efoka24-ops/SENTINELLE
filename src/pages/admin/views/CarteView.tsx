import { colors, MONO, meta, rgba, type Level } from '../../../theme';
import { regions } from '../adminUtils';
import { useHeatmap } from '../../../api/hooks';

const CAT: Record<string, string> = {
  terrorism: 'Terrorisme', hate_speech: 'Discours de haine', disinformation: 'Désinformation',
  insurrection: 'Insurrection', foreign_interference: 'Ingérence étrangère',
  cybersecurity: 'Cybersécurité', watch: 'Surveillance ciblée',
};

export function CarteView() {
  const live = useHeatmap();
  const byRegion = Object.fromEntries((live.data ?? []).map((h) => [h.region, h]));

  // Fusion : on garde la disposition (mock) et on superpose les scores live (>0).
  const regionsView = regions.map((r) => {
    const h = byRegion[r.name];
    if (!h || h.threat_count === 0) return r;
    const m = meta(h.threat_level as Level);
    return {
      ...r,
      score: h.risk_score.toFixed(2),
      threat: h.dominant_threat ? (CAT[h.dominant_threat] ?? h.dominant_threat) : r.threat,
      color: m.c, levelLabel: m.l,
      tileBg: rgba(m.c, 0.14), tileBorder: rgba(m.c, 0.55),
      pulse: h.threat_level === 'CRITICAL' || h.threat_level === 'HIGH',
    };
  });

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 358px', gap: 14, padding: 14, minHeight: 0 }}>
      {/* Cartogramme */}
      <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flex: 'none' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Carte nationale des menaces</div>
            <div style={{ fontSize: 11, color: '#7a857b', marginTop: 2 }}>Cartogramme régional · pondéré par score de menace</div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <span style={{ fontSize: 11, color: colors.text2, background: '#eef1ee', border: '1px solid #dfe3de', padding: '6px 12px', borderRadius: 7 }}>Toutes menaces</span>
            <span style={{ fontSize: 11, color: colors.muted, border: `1px solid ${colors.border}`, padding: '6px 12px', borderRadius: 7 }}>Terrorisme</span>
            <span style={{ fontSize: 11, color: colors.muted, border: `1px solid ${colors.border}`, padding: '6px 12px', borderRadius: 7 }}>24 h</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(6,1fr)', gap: 10, minHeight: 0, overflow: 'hidden' }}>
          {regionsView.map((r) => (
            <div key={r.name} style={{ gridColumn: r.gc, gridRow: r.gr, background: r.tileBg, border: `1px solid ${r.tileBorder}`, borderRadius: 11, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', minHeight: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                {r.pulse && (
                  <span style={{ position: 'relative', width: 8, height: 8, display: 'block' }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: r.color }} />
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: r.color, animation: 'pulse 2.2s infinite' }} />
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 21, fontWeight: 600, color: r.color, lineHeight: 1 }}>{r.score}</div>
                <div style={{ fontSize: 11, color: colors.muted, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.threat}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liste régions */}
      <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 15, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 8 }}>Régions · niveau de risque</div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {regionsView.map((r) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #eceee9' }}>
              <div>
                <div style={{ fontSize: 13, color: colors.text2 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#7a857b', marginTop: 1 }}>{r.threat}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: r.color }}>{r.score}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.05em', color: r.color, border: `1px solid ${r.color}`, borderRadius: 4, padding: '2px 5px', textTransform: 'uppercase' }}>{r.levelLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
