import { colors, MONO, platformColors } from '../../../theme';
import { Panel, StatCard, PlatformDot, ViewHeader } from '../ui';
import { usePlatforms, useScans, useOverview, useContents } from '../../../api/hooks';

const CAT: Record<string, string> = {
  terrorism: 'Terrorisme', hate_speech: 'Discours de haine', disinformation: 'Désinformation',
  insurrection: 'Insurrection', foreign_interference: 'Ingérence étrangère', cybersecurity: 'Cybersécurité',
  child_safety: 'Protection mineurs', trafficking: 'Proxénétisme', watch: 'Surveillance', neutral: 'Neutre',
};
const SCAN_ST: Record<string, { c: string; l: string }> = {
  pending: { c: '#ca8a04', l: 'En attente' },
  running: { c: '#2563eb', l: 'En cours' },
  done: { c: '#16a34a', l: 'Terminé' },
  error: { c: '#dc2626', l: 'Erreur' },
};
const ellip: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 };

function hhmm(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function CollecteView() {
  const platforms = usePlatforms();
  const scans = useScans();
  const ov = useOverview();
  const contents = useContents({ limit: 25 });

  const plats = platforms.data ?? [];
  const online = plats.filter((p) => p.live).length;
  const scanList = scans.data ?? [];
  const items = contents.data ?? [];
  const byPlatform = ov.data?.by_platform ?? [];
  const maxVol = Math.max(1, ...byPlatform.map((v) => v.count));

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto', minWidth: 0 }}>
      <ViewHeader
        title="Collecte"
        sub="Sources publiques multi-réseaux — scans et ingestion réels"
        right={<span style={{ fontSize: 11, color: colors.muted, fontFamily: MONO }}>{online}/{plats.length || 9} CONNECTEURS LIVE</span>}
      />

      {/* KPIs réels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
        <StatCard value={`${online}/${plats.length || 9}`} label="Connecteurs en collecte réelle" accent={colors.cyan} />
        <StatCard value={ov.data ? ov.data.analyzed.toLocaleString('fr-FR') : '—'} label="Contenus collectés" accent={colors.green} />
        <StatCard value={ov.data ? String(ov.data.threats) : '—'} label="Menaces détectées" accent="#dc2626" />
        <StatCard value={String(scanList.length)} label="Scans lancés" accent="#ca8a04" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 14 }}>
        {/* Connecteurs — état live réel */}
        <Panel title="Connecteurs · état réel" accent={colors.cyan} bodyStyle={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr', gap: 10, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
            <span>Plateforme</span><span>Collecte</span>
          </div>
          {(plats.length ? plats : [{ platform: 'Presse', live: true }]).map((p) => (
            <div key={p.platform} style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr', gap: 10, padding: '10px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12.5 }}>
              <span style={{ ...ellip, display: 'flex', alignItems: 'center', gap: 8, color: colors.text2, fontWeight: 500 }}>
                <PlatformDot platform={p.platform} />{p.platform}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', color: p.live ? '#16a34a' : colors.muted3, border: `1px solid ${p.live ? '#16a34a' : colors.muted3}`, borderRadius: 4, padding: '2px 6px', justifySelf: 'start' }}>{p.live ? 'LIVE' : 'DÉMO'}</span>
            </div>
          ))}
          <div style={{ padding: '10px 16px', fontSize: 10.5, color: colors.muted3 }}>
            « LIVE » = clé API/Apify configurée. Sinon collecte de démonstration.
          </div>
        </Panel>

        {/* Scans récents — réels */}
        <Panel title="Scans récents" accent={colors.gold} bodyStyle={{ padding: 0 }}>
          {scanList.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: colors.muted2 }}>
              Aucun scan. Cliquez sur « Lancer un scan » pour démarrer la collecte.
            </div>
          )}
          {scanList.slice(0, 8).map((s) => {
            const st = SCAN_ST[s.status] ?? { c: colors.muted, l: s.status };
            return (
              <div key={s.id} style={{ padding: '10px 16px', borderBottom: '1px solid #eceee9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: colors.muted }}>#{s.id}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: st.c, border: `1px solid ${st.c}`, borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase' }}>{st.l}</span>
                  <span style={{ ...ellip, fontSize: 11.5, color: colors.text4 }}>{s.platforms.join(', ')}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: colors.muted2, marginTop: 4 }}>
                  {s.region} · {s.collected} collectés · <span style={{ color: '#ca8a04' }}>{s.threats} menaces</span> · <span style={{ color: '#dc2626' }}>{s.alerts} alertes</span>
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 14, marginTop: 14 }}>
        {/* Flux des contenus collectés — réel */}
        <Panel
          title="Contenus collectés · flux"
          accent={colors.green}
          right={<span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: MONO, color: '#16a34a' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />{items.length} ITEMS</span>}
          bodyStyle={{ padding: '4px 12px', overflowY: 'auto', maxHeight: 360 }}
        >
          {items.length === 0 && (
            <div style={{ padding: 12, fontSize: 12, color: colors.muted2 }}>
              Aucun contenu collecté. Lancez un scan pour alimenter le flux.
            </div>
          )}
          {items.map((c) => {
            const flagged = c.threat_category && c.threat_category !== 'neutral';
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 4px', borderBottom: '1px solid #eceee9' }}>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: colors.muted3, width: 42, flex: 'none', marginTop: 1 }}>{hhmm(c.collected_at)}</span>
                <PlatformDot platform={c.platform} size={7} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...ellip, fontSize: 12, color: colors.text2 }}>{c.text}</div>
                  <div style={{ ...ellip, fontSize: 10.5, color: '#7a857b', marginTop: 1 }}>{c.platform} · {c.author || '—'} · {c.region}</div>
                </div>
                {flagged && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', border: '1px solid #dc2626', borderRadius: 4, padding: '2px 5px', flex: 'none' }}>{CAT[c.threat_category] ?? c.threat_category}</span>
                )}
              </div>
            );
          })}
        </Panel>

        {/* Volumes par plateforme — réels */}
        <Panel title="Volumes par plateforme" accent={colors.cyan}>
          {byPlatform.length === 0 && (
            <div style={{ fontSize: 12, color: colors.muted2 }}>Aucune donnée — lancez un scan.</div>
          )}
          {byPlatform.map((v) => (
            <div key={v.platform} style={{ marginBottom: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ ...ellip, display: 'flex', alignItems: 'center', gap: 7, color: colors.text3 }}><PlatformDot platform={v.platform} size={7} />{v.platform}</span>
                <span style={{ fontFamily: MONO, color: colors.muted }}>{v.count.toLocaleString('fr-FR')}</span>
              </div>
              <div style={{ height: 6, background: '#eef1ee', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(v.count / maxVol) * 100}%`, background: platformColors[v.platform] ?? colors.cyan, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
