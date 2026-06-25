import { useState } from 'react';
import { colors, MONO } from '../../theme';
import { regionNames } from '../../data/mock';
import { Hov } from '../../lib/Hoverable';
import { PlatformDot } from './ui';
import { usePlatforms, useLaunchScan, useScan } from '../../api/hooks';

const FALLBACK = [
  'Presse', 'Facebook', 'Twitter / X', 'LinkedIn', 'Telegram', 'YouTube', 'Instagram', 'TikTok',
];

export function ScanLauncher({ onClose }: { onClose: () => void }) {
  const platforms = usePlatforms();
  const launch = useLaunchScan();
  const [selected, setSelected] = useState<string[]>(['Presse', 'Facebook', 'LinkedIn', 'Twitter / X']);
  const [region, setRegion] = useState('National');
  const [objective, setObjective] = useState('');
  const [keywords, setKeywords] = useState('');
  const [targets, setTargets] = useState('');
  const [limit, setLimit] = useState(30);
  const [scanId, setScanId] = useState<number | null>(null);
  const [err, setErr] = useState('');

  const job = useScan(scanId);
  const list = platforms.data ?? FALLBACK.map((p) => ({ platform: p, live: p === 'Presse' }));

  const toggle = (p: string) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const start = async () => {
    setErr('');
    try {
      const kws = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      const tg = targets.split(/[\n,]/).map((t) => t.trim()).filter(Boolean);
      const res = await launch.mutateAsync({ platforms: selected, region, keywords: kws, targets: tg, objective, limit });
      setScanId(res.id);
    } catch (e) {
      const ex = e as { response?: { data?: { detail?: string } } };
      setErr(ex.response?.data?.detail ?? "Backend injoignable. Démarrez l'API (port 8000).");
    }
  };

  const running = job.data && (job.data.status === 'pending' || job.data.status === 'running');
  const done = job.data && job.data.status === 'done';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', width: 540, maxHeight: '88vh', overflowY: 'auto', background: '#ffffff', border: `1px solid ${colors.border}`, borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${colors.borderSoft}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 3, height: 16, borderRadius: 2, background: colors.cyan }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>Lancer un scan des réseaux sociaux</div>
              <div style={{ fontSize: 11, color: colors.muted2, marginTop: 1 }}>Collecte → NLP → détection de menaces</div>
            </div>
          </div>
          <Hov as="span" onClick={onClose} base={{ cursor: 'pointer', color: colors.muted2, fontSize: 20 }} hover={{ color: colors.text }}>✕</Hov>
        </div>

        <div style={{ padding: 20 }}>
          {/* Plateformes */}
          <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 10 }}>Sources à scanner</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
            {list.map((p) => {
              const on = selected.includes(p.platform);
              return (
                <div key={p.platform} onClick={() => toggle(p.platform)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', background: on ? 'rgba(10,125,60,.08)' : colors.panelAlt, border: `1px solid ${on ? colors.cyan : colors.border}` }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${on ? colors.cyan : colors.muted3}`, background: on ? colors.cyan : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#eef5ef', fontWeight: 700, flex: 'none' }}>{on ? '✓' : ''}</span>
                  <PlatformDot platform={p.platform} />
                  <span style={{ fontSize: 12.5, color: colors.text2, flex: 1 }}>{p.platform}</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.04em', color: p.live ? '#16a34a' : colors.muted3, border: `1px solid ${p.live ? '#16a34a' : colors.muted3}`, borderRadius: 4, padding: '1px 4px' }}>{p.live ? 'LIVE' : 'DÉMO'}</span>
                </div>
              );
            })}
          </div>

          {/* Objectif du scan (préset de détection) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 8 }}>Objectif du scan</div>
            <select
              value={objective}
              onChange={(e) => {
                const v = e.target.value;
                setObjective(v);
                if (v === 'child_safety' || v === 'trafficking') setSelected(['Facebook', 'TikTok', 'Twitter / X']);
              }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: '#f7f8f6', border: `1px solid ${colors.border}`, color: colors.text, fontSize: 13, outline: 'none' }}
            >
              <option value="">Veille générale (toutes menaces)</option>
              <option value="child_safety">🛡️ Protection des mineurs / pédopiégeage</option>
              <option value="trafficking">🚫 Proxénétisme / traite (emojis)</option>
              <option value="terrorism">Terrorisme & recrutement</option>
              <option value="hate_speech">Discours de haine</option>
            </select>
            {(objective === 'child_safety' || objective === 'trafficking') && (
              <div style={{ fontSize: 10.5, color: colors.amber, marginTop: 5 }}>
                Réseaux pré-sélectionnés (Facebook, TikTok, X). Détection par lexiques + emojis ; usage réservé aux autorités.
              </div>
            )}
          </div>

          {/* Instructions de recherche (mots-clés ciblés) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 8 }}>Instructions de recherche · mots-clés (optionnel)</div>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="ex. recrutement, jihad, élection, nom d'un compte…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: '#f7f8f6', border: `1px solid ${colors.border}`, color: colors.text, fontSize: 13, outline: 'none' }}
            />
            <div style={{ fontSize: 10.5, color: colors.muted3, marginTop: 5 }}>Séparez par des virgules. Les correspondances renforcent le score de criticité.</div>
          </div>

          {/* Cibles publiques à surveiller (collecte réelle Apify) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 8 }}>Cibles à surveiller · URLs / comptes publics</div>
            <textarea
              value={targets}
              onChange={(e) => setTargets(e.target.value)}
              placeholder={"https://www.facebook.com/cameroontribune\nhttps://x.com/infos_cmr\nhttps://www.tiktok.com/@compte\nhttps://www.youtube.com/@chaine"}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: '#f7f8f6', border: `1px solid ${colors.border}`, color: colors.text, fontSize: 12.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div style={{ fontSize: 10.5, color: colors.muted3, marginTop: 5 }}>
              Une cible par ligne. La collecte <strong style={{ color: colors.cyan }}>réelle</strong> (pages, groupes, comptes publics) est effectuée via Apify quand une cible correspond à une plateforme sélectionnée. Sans cible (ou sans clé API), le moteur reste en mode démonstration.
            </div>
          </div>

          {/* Périmètre + volume */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 8 }}>Périmètre (région)</div>
              <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: '#f7f8f6', border: `1px solid ${colors.border}`, color: colors.text, fontSize: 13, outline: 'none' }}>
                <option value="National">Tout le pays</option>
                {regionNames.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600, marginBottom: 8 }}>Items / source</div>
              <input type="number" min={5} max={100} value={limit} onChange={(e) => setLimit(Math.max(5, Math.min(100, +e.target.value || 30)))} style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: '#f7f8f6', border: `1px solid ${colors.border}`, color: colors.text, fontSize: 13, outline: 'none' }} />
            </div>
          </div>

          {err && <div style={{ fontSize: 12, color: '#ea580c', marginBottom: 12 }}>{err}</div>}

          {/* Progression */}
          {job.data && (
            <div style={{ background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: done ? '#16a34a' : colors.cyan, animation: running ? 'blink 1.2s infinite' : 'none' }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.text2 }}>Scan #{job.data.id} — {job.data.status === 'done' ? 'Terminé' : job.data.status === 'running' ? 'En cours…' : job.data.status === 'error' ? 'Erreur' : 'Démarrage…'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[['Collectés', job.data.collected, colors.text], ['Menaces', job.data.threats, '#ca8a04'], ['Alertes', job.data.alerts, '#dc2626']].map(([l, v, c]) => (
                  <div key={l as string} style={{ textAlign: 'center', background: colors.panel, borderRadius: 8, padding: '8px 4px' }}>
                    <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: c as string }}>{v as number}</div>
                    <div style={{ fontSize: 9.5, color: colors.muted2 }}>{l as string}</div>
                  </div>
                ))}
              </div>
              {job.data.error && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 8 }}>{job.data.error}</div>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Hov as="span" onClick={onClose} base={{ flex: 'none', textAlign: 'center', fontSize: 13, fontWeight: 500, color: colors.text2, background: '#eef1ee', border: '1px solid #dfe3de', borderRadius: 9, padding: '11px 18px', cursor: 'pointer' }} hover={{ background: colors.border }}>Fermer</Hov>
            <Hov
              as="span"
              onClick={selected.length && !launch.isPending ? start : undefined}
              base={{ flex: 1, textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: colors.greenDeep, background: selected.length ? colors.gold : '#9aa39a', borderRadius: 9, padding: 11, cursor: selected.length ? 'pointer' : 'default' }}
              hover={selected.length ? { background: colors.goldHover } : {}}
            >
              {launch.isPending ? 'Lancement…' : done ? 'Relancer un scan' : '⟲ Lancer le scan'}
            </Hov>
          </div>
        </div>
      </div>
    </div>
  );
}
