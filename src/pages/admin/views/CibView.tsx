import { useState } from 'react';
import { colors, MONO, meta, type Level } from '../../../theme';
import { Hov } from '../../../lib/Hoverable';
import { Panel, ViewHeader, LevelTag, PlatformDot } from '../ui';
import { useCib, type CibCluster } from '../../../api/hooks';

const CAT_LABELS: Record<string, string> = {
  terrorism: 'Terrorisme', hate_speech: 'Discours de haine', disinformation: 'Désinformation',
  insurrection: 'Insurrection', foreign_interference: 'Ingérence étrangère',
  cybersecurity: 'Cybersécurité', watch: 'Surveillance ciblée', neutral: 'Amplification',
};

function DiffusionGraph({ cluster }: { cluster: CibCluster }) {
  const m = meta((cluster.level as Level) ?? 'HIGH');
  const authors = cluster.authors.slice(0, 14);
  const cx = 200, cy = 175, r = 130;
  const pts = authors.map((a, i) => {
    const ang = (2 * Math.PI * i) / authors.length - Math.PI / 2;
    return { a, x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
  });
  return (
    <svg viewBox="0 0 400 350" width="100%" height="100%" style={{ display: 'block' }}>
      {pts.map((p, i) => (
        <line key={'l' + i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={m.c} strokeWidth={1} strokeOpacity={0.35} />
      ))}
      {pts.map((p, i) => (
        <g key={'n' + i}>
          <circle cx={p.x} cy={p.y} r={5.5} fill={colors.panel} stroke={m.c} strokeWidth={1.5} />
          <text x={p.x} y={p.y - 9} fill={colors.muted} fontSize={7} fontFamily="monospace" textAnchor="middle">
            {p.a.length > 14 ? p.a.slice(0, 13) + '…' : p.a}
          </text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r={16} fill={m.c} fillOpacity={0.18} stroke={m.c} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={5} fill={m.c} />
      <text x={cx} y={cy + 30} fill={colors.text2} fontSize={9} fontFamily="monospace" textAnchor="middle" fontWeight="600">
        CAMPAGNE · {cluster.size} posts
      </text>
    </svg>
  );
}

export function CibView() {
  const cib = useCib();
  const clusters = cib.data ?? [];
  const [idx, setIdx] = useState(0);
  const sel = clusters[idx];

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
      <ViewHeader
        title="CIB"
        sub="Comportements coordonnés inauthentiques — graphes de diffusion"
        right={<span style={{ fontFamily: MONO, fontSize: 11, color: colors.muted }}>{clusters.length} GRAPPES</span>}
      />

      {clusters.length === 0 && (
        <Panel title="Détection CIB" accent={colors.cyan}>
          <div style={{ fontSize: 12.5, color: colors.muted2, lineHeight: 1.7 }}>
            Aucune grappe coordonnée pour l'instant. Lancez un scan multi-réseaux
            (bouton <span style={{ color: colors.gold }}>« Lancer un scan »</span>) pour alimenter
            le moteur — il détecte les messages quasi-identiques diffusés par plusieurs comptes.
            <br /><span style={{ fontSize: 11, color: colors.muted3 }}>(API requise sur le port 8077.)</span>
          </div>
        </Panel>
      )}

      {clusters.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }}>
          <Panel title="Grappes coordonnées détectées" accent="#dc2626" bodyStyle={{ padding: 0 }}>
            {clusters.map((c, i) => {
              const m = meta((c.level as Level) ?? 'HIGH');
              const active = i === idx;
              return (
                <Hov
                  key={c.signature}
                  onClick={() => setIdx(i)}
                  base={{ padding: '11px 14px', borderBottom: '1px solid #eceee9', cursor: 'pointer', background: active ? 'rgba(10,125,60,.07)' : 'transparent', borderLeft: `2px solid ${active ? colors.cyan : 'transparent'}` }}
                  hover={{ background: '#f5f7f4' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <LevelTag color={m.c} label={m.l} />
                    <span style={{ fontFamily: MONO, fontSize: 11, color: m.c }}>{c.score.toFixed(2)}</span>
                    <span style={{ fontSize: 11.5, color: colors.text3 }}>{CAT_LABELS[c.dominant_category] ?? c.dominant_category}</span>
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                      {c.platforms.map((p) => <PlatformDot key={p} platform={p} size={7} />)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: colors.text4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>« {c.sample} »</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: colors.muted2, marginTop: 4 }}>
                    {c.author_count} comptes · {c.size} posts · {c.platforms.length} plateformes
                  </div>
                </Hov>
              );
            })}
          </Panel>

          {sel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Panel title="Graphe de diffusion" accent={colors.cyan} bodyStyle={{ height: 300 }}>
                <DiffusionGraph cluster={sel} />
              </Panel>
              <Panel title="Détail de la grappe" accent={colors.gold}>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 8, fontSize: 12.5 }}>
                  <span style={{ color: colors.muted2 }}>Criticité</span><span><LevelTag color={meta((sel.level as Level)).c} label={meta((sel.level as Level)).l} /> <span style={{ fontFamily: MONO, color: meta((sel.level as Level)).c, marginLeft: 6 }}>{sel.score.toFixed(2)}</span></span>
                  <span style={{ color: colors.muted2 }}>Comptes</span><span style={{ color: colors.text2, fontFamily: MONO }}>{sel.author_count}</span>
                  <span style={{ color: colors.muted2 }}>Posts</span><span style={{ color: colors.text2, fontFamily: MONO }}>{sel.size}</span>
                  <span style={{ color: colors.muted2 }}>Plateformes</span><span style={{ color: colors.text2 }}>{sel.platforms.join(', ')}</span>
                  <span style={{ color: colors.muted2 }}>Catégorie</span><span style={{ color: colors.text2 }}>{CAT_LABELS[sel.dominant_category] ?? sel.dominant_category}</span>
                  <span style={{ color: colors.muted2 }}>Signature</span><span style={{ color: colors.text4, fontFamily: MONO, fontSize: 11 }}>{sel.signature}</span>
                </div>
                <div style={{ marginTop: 12, fontSize: 10, letterSpacing: '.1em', color: colors.muted2, fontFamily: MONO }}>COMPTES IMPLIQUÉS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                  {sel.authors.map((a) => (
                    <span key={a} style={{ fontSize: 10.5, fontFamily: MONO, color: '#6b766c', background: '#eef1ee', border: '1px solid #dfe3de', borderRadius: 4, padding: '2px 6px' }}>{a}</span>
                  ))}
                </div>
              </Panel>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
