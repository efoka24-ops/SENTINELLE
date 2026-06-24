import { useState } from 'react';
import { colors, MONO, meta, rgba, type Level } from '../../../theme';
import { threatActors } from '../adminUtils';
import { useThreatActors, useFlaggedAuthors } from '../../../api/hooks';
import { downloadFile } from '../../../api/client';
import { Panel, PlatformDot } from '../ui';
import { Hov } from '../../../lib/Hoverable';

const OBJ = [
  { key: '', label: 'Toutes catégories' },
  { key: 'child_safety', label: 'Protection des mineurs' },
  { key: 'trafficking', label: 'Proxénétisme / traite' },
  { key: 'terrorism', label: 'Terrorisme' },
  { key: 'hate_speech', label: 'Discours de haine' },
];

export function RenseignementView() {
  const live = useThreatActors();
  const [cat, setCat] = useState('');
  const flagged = useFlaggedAuthors(cat || undefined);
  const actors = (live.data && live.data.length)
    ? live.data.map((a) => {
        const m = meta(a.level as Level);
        return { ...a, color: m.c, label: m.l, bg: rgba(m.c, 0.12) };
      })
    : threatActors;

  const dossier = (author: string) =>
    downloadFile(`/intel/user-dossier/pdf?author=${encodeURIComponent(author)}`, `dossier-${author.slice(0, 24)}.pdf`);

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
      {/* Auteurs signalés + dossiers détaillés */}
      <Panel
        title="Auteurs signalés · dossiers détaillés"
        accent="#dc2626"
        style={{ marginBottom: 16 }}
        right={
          <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ background: '#f7f8f6', border: `1px solid ${colors.border}`, color: colors.text2, fontSize: 11.5, borderRadius: 6, padding: '4px 8px', outline: 'none' }}>
            {OBJ.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        }
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr .6fr .6fr .9fr', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
          <span>Compte</span><span>Plateforme</span><span>Posts</span><span>Score</span><span>Dossier</span>
        </div>
        {(flagged.data ?? []).length === 0 && (
          <div style={{ padding: 16, fontSize: 12, color: colors.muted2 }}>
            Aucun auteur signalé. Lancez un scan (objectif ciblé) pour alimenter les dossiers.
          </div>
        )}
        {(flagged.data ?? []).map((f, i) => (
          <div key={f.author + i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr .6fr .6fr .9fr', gap: 10, padding: '10px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12.5 }}>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: colors.text2 }}>@{f.author}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: colors.text4, fontSize: 11.5 }}><PlatformDot platform={f.platform} size={7} />{f.platform}</span>
            <span style={{ fontFamily: MONO, color: colors.muted }}>{f.posts}</span>
            <span style={{ fontFamily: MONO, color: f.max_score >= 0.75 ? '#dc2626' : '#ea580c' }}>{f.max_score.toFixed(2)}</span>
            <Hov as="span" onClick={() => dossier(f.author)} base={{ fontSize: 10.5, fontWeight: 600, color: colors.greenDeep, background: colors.gold, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', justifySelf: 'start' }} hover={{ background: colors.goldHover }}>↓ PDF</Hov>
          </div>
        ))}
      </Panel>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Base des acteurs menaçants</div>
          <div style={{ fontSize: 11, color: '#7a857b', marginTop: 2 }}>Threat Intelligence · acteurs suivis et corrélés</div>
        </div>
        <span style={{ fontSize: 11, color: colors.muted, fontFamily: MONO }}>4 ACTEURS ACTIFS</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {actors.map((a) => (
          <div key={a.code} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 17 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: '#7a857b' }}>{a.code}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginTop: 3 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{a.type}</div>
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em', color: a.color, background: a.bg, border: `1px solid ${a.color}`, borderRadius: 5, padding: '3px 7px', textTransform: 'uppercase' }}>{a.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 22, marginTop: 15, paddingTop: 14, borderTop: '1px solid #e3e6e2' }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: colors.text }}>{a.incidents}</div>
                <div style={{ fontSize: 10, color: colors.muted2 }}>Incidents liés</div>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: colors.text }}>{a.accounts}</div>
                <div style={{ fontSize: 10, color: colors.muted2 }}>Comptes</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: colors.text3 }}>{a.platforms}</div>
                <div style={{ fontSize: 10, color: colors.muted2 }}>Plateformes</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: colors.muted3, marginTop: 11, fontFamily: MONO }}>Détecté {a.first} · Vu {a.last}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
