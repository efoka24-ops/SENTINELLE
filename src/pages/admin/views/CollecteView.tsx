import { useEffect, useState } from 'react';
import { colors, MONO, platformColors } from '../../../theme';
import { volumes } from '../adminUtils';
import {
  collectors,
  collectKpis,
  forensicSeed,
  forensicPool,
  normalizerStages,
  type ForensicItem,
} from '../../../data/modules';
import { Panel, StatCard, PlatformDot, statusColor, ViewHeader } from '../ui';

const STATUS_LABEL: Record<string, string> = {
  online: 'En ligne',
  degraded: 'Dégradé',
  offline: 'Hors ligne',
};
const STAGE_LABEL: Record<string, string> = {
  collected: 'Collecté',
  normalized: 'Normalisé',
  queued: 'En file',
};

export function CollecteView() {
  // Flux forensic temps réel
  const [stream, setStream] = useState<ForensicItem[]>(forensicSeed);

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      const it = forensicPool[Math.floor(Math.random() * forensicPool.length)];
      const stamp = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      setStream((prev) => [{ ...it, id: d.getTime(), time: stamp }, ...prev].slice(0, 14));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
      <ViewHeader
        title="Collecte & forensic d'ingestion"
        sub="Module 1 · SENTINELLE COLLECT — sources publiques multi-réseaux"
        right={<span style={{ fontSize: 11, color: colors.muted, fontFamily: MONO }}>9 CONNECTEURS</span>}
      />

      {/* KPIs collecte */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
        {collectKpis.map((k) => (
          <StatCard key={k.label} value={k.value} label={k.label} accent={k.accent} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 14 }}>
        {/* Connecteurs */}
        <Panel title="Connecteurs de collecte" accent={colors.cyan} bodyStyle={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr .7fr .8fr .8fr', gap: 10, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
            <span>Plateforme</span><span>Méthode</span><span>Statut</span><span>Items/min</span><span>Dernier</span>
          </div>
          {collectors.map((c) => (
            <div key={c.platform} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr .7fr .8fr .8fr', gap: 10, padding: '11px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12.5 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.text2, fontWeight: 500 }}>
                <PlatformDot platform={c.platform} />{c.platform}
              </span>
              <span style={{ color: colors.muted, fontSize: 11.5 }}>{c.method}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: statusColor(c.status) }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(c.status), animation: c.status === 'online' ? 'blink 1.6s infinite' : 'none' }} />
                {STATUS_LABEL[c.status]}
              </span>
              <span style={{ fontFamily: MONO, color: c.perMin > 0 ? colors.cyan : colors.muted3 }}>{c.perMin}</span>
              <span style={{ color: '#7a857b', fontSize: 11.5 }}>{c.last}</span>
            </div>
          ))}
        </Panel>

        {/* Forensic temps réel */}
        <Panel
          title="Forensic — ingestion brute"
          accent="#16a34a"
          right={<span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: MONO, color: '#16a34a' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', animation: 'blink 1.4s infinite' }} />LIVE</span>}
          bodyStyle={{ padding: '4px 11px', overflowY: 'auto', maxHeight: 360 }}
        >
          {stream.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 4px', borderBottom: '1px solid #eceee9' }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: colors.muted3, width: 52, flex: 'none', marginTop: 1 }}>{f.time}</span>
              <PlatformDot platform={f.platform} size={7} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: colors.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.snippet}</div>
                <div style={{ fontSize: 10.5, color: '#7a857b', marginTop: 1 }}>
                  {f.platform} · {f.handle} · <span style={{ fontFamily: MONO }}>{f.hash}</span>
                </div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', color: statusColor(f.stage), border: `1px solid ${statusColor(f.stage)}`, borderRadius: 4, padding: '2px 5px', flex: 'none', textTransform: 'uppercase' }}>{STAGE_LABEL[f.stage]}</span>
            </div>
          ))}
        </Panel>
      </div>

      {/* Pipeline normalisation + volumes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 14, marginTop: 14 }}>
        <Panel title="Pipeline de normalisation → Kafka" accent={colors.gold}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {normalizerStages.map((s, i) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: 9, padding: '9px 12px', minWidth: 116 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors.text2 }}>{s.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: colors.muted2, marginTop: 4, fontFamily: MONO }}>{s.detail}</div>
                </div>
                {i < normalizerStages.length - 1 && <span style={{ color: colors.muted3, fontSize: 14 }}>→</span>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 11.5, color: colors.muted2, lineHeight: 1.6 }}>
            Déduplication par <span style={{ fontFamily: MONO, color: colors.cyan }}>sha256(content)</span> · métadonnées plateforme conservées brutes pour analyse forensique · publication sur topics <span style={{ fontFamily: MONO, color: colors.cyan }}>raw.*</span>.
          </div>
        </Panel>

        <Panel title="Volumes par plateforme · 24 h" accent={colors.cyan}>
          {volumes.map((v) => (
            <div key={v.name} style={{ marginBottom: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: colors.text3 }}><PlatformDot platform={v.name} size={7} />{v.name}</span>
                <span style={{ fontFamily: MONO, color: colors.muted }}>{v.value}</span>
              </div>
              <div style={{ height: 6, background: '#eef1ee', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: v.pct, background: platformColors[v.name] ?? colors.cyan, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
