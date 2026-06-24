import { colors, MONO, meta } from '../../../theme';
import {
  aiPipeline,
  classificationDist,
  nerEntities,
  languagesDetected,
  aiModels,
} from '../../../data/modules';
import { Panel, StatCard, ViewHeader } from '../ui';

export function AnalyseView() {
  const maxCat = Math.max(...classificationDist.map((c) => c.count));
  const maxNer = Math.max(...nerEntities.map((n) => n.count));

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
      <ViewHeader
        title="Moteur d'analyse IA"
        sub="Module 2 · SENTINELLE ANALYSE — classification, NER, géolocalisation"
        right={<span style={{ fontSize: 11, color: colors.muted, fontFamily: MONO }}>352 ITEMS/MIN</span>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
        <StatCard value="847" label="Menaces classées · 24 h" accent="#dc2626" />
        <StatCard value="83 %" label="Précision moyenne" accent={colors.cyan} />
        <StatCard value="14 %" label="Faux positifs" accent="#ca8a04" />
        <StatCard value="6" label="Langues détectées" accent="#16a34a" />
      </div>

      {/* Pipeline NLP */}
      <Panel title="Pipeline NLP — étapes d'enrichissement" accent={colors.cyan} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {aiPipeline.map((s) => (
            <div key={s.step} style={{ background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.text2 }}>{s.step}</span>
              </div>
              <div style={{ fontSize: 10.5, color: colors.muted2, marginTop: 5, fontFamily: MONO }}>{s.model}</div>
              <div style={{ fontSize: 10.5, color: colors.cyan, marginTop: 3, fontFamily: MONO }}>{s.perMin}/min</div>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Distribution classification */}
        <Panel title="Classification des menaces · 24 h" accent="#dc2626">
          {classificationDist.map((c) => {
            const m = meta(c.level);
            return (
              <div key={c.category} style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ color: colors.text3 }}>{c.label}</span>
                  <span style={{ fontFamily: MONO, color: m.c }}>{c.count}</span>
                </div>
                <div style={{ height: 7, background: '#eef1ee', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(c.count / maxCat) * 100}%`, background: m.c, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </Panel>

        {/* Langues détectées */}
        <Panel title="Langues détectées" accent={colors.gold}>
          {languagesDetected.map(([lang, pct]) => (
            <div key={lang} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                <span style={{ color: colors.text3 }}>{lang}</span>
                <span style={{ fontFamily: MONO, color: colors.muted }}>{pct} %</span>
              </div>
              <div style={{ height: 7, background: '#eef1ee', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#0a7d3c,#3fb56e)', borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* NER + modèles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14 }}>
        <Panel title="Entités nommées extraites" accent={colors.cyan}>
          {nerEntities.map((n) => (
            <div key={n.type} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                <span style={{ color: colors.text3 }}>{n.label} <span style={{ fontFamily: MONO, color: colors.muted3, fontSize: 10 }}>{n.type}</span></span>
                <span style={{ fontFamily: MONO, color: colors.muted }}>{n.count.toLocaleString('fr-FR')}</span>
              </div>
              <div style={{ height: 6, background: '#eef1ee', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(n.count / maxNer) * 100}%`, background: colors.cyan, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </Panel>

        <Panel title="Modèles déployés" accent={colors.gold} bodyStyle={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr .6fr .6fr .6fr', gap: 8, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
            <span>Modèle</span><span>Tâche</span><span>P</span><span>R</span><span>F1</span>
          </div>
          {aiModels.map((m) => (
            <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr .6fr .6fr .6fr', gap: 8, padding: '11px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: colors.text2 }}>{m.name}</span>
              <span style={{ color: colors.muted }}>{m.task}</span>
              <span style={{ fontFamily: MONO, color: m.precision ? colors.text3 : colors.muted3 }}>{m.precision ? m.precision + '%' : '—'}</span>
              <span style={{ fontFamily: MONO, color: m.recall ? colors.text3 : colors.muted3 }}>{m.recall ? m.recall + '%' : '—'}</span>
              <span style={{ fontFamily: MONO, color: m.f1 ? colors.cyan : colors.muted3 }}>{m.f1 ? m.f1 + '%' : '—'}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
