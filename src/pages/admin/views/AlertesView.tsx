import { useOutletContext } from 'react-router-dom';
import { colors, MONO, meta, type Level } from '../../../theme';
import { alertsList, alertRules, alertStatusCol, type AlertRow } from '../../../data/modules';
import { Panel, PlatformDot, ViewHeader } from '../ui';
import type { AdminOutletContext } from '../adminUtils';
import { Hov } from '../../../lib/Hoverable';
import { useAlerts } from '../../../api/hooks';

const GRID = '150px .6fr 1.6fr 1fr .5fr .8fr .9fr';
const LEVELS: Level[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function AlertesView() {
  const { openFiche } = useOutletContext<AdminOutletContext>();
  const live = useAlerts();

  // Données live si l'API répond, sinon repli mock.
  const rows: AlertRow[] = (live.data && live.data.length)
    ? live.data.map((a) => ({
        number: a.number, level: a.level as Level, type: a.threat_type, title: a.title,
        platform: a.platform, place: a.place, score: a.score, status: a.status,
        assigned: a.assigned || '—', time: '',
      }))
    : alertsList;

  const counts = LEVELS.map((lvl) => {
    const m = meta(lvl);
    return { level: lvl, color: m.c, label: m.l, n: rows.filter((r) => r.level === lvl).length };
  });

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
      <ViewHeader
        title="Alertes & moteur de règles"
        sub="Module 5 · SENTINELLE ALERT — détection, escalade, notification"
        right={
          <div style={{ display: 'flex', gap: 14 }}>
            {counts.map((a) => (
              <div key={a.level} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: a.color }} />
                <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: a.color }}>{a.n}</span>
                <span style={{ fontSize: 10.5, color: colors.muted2 }}>{a.label}</span>
              </div>
            ))}
          </div>
        }
      />

      {/* Liste des alertes */}
      <Panel title="Alertes actives" accent="#dc2626" bodyStyle={{ padding: 0 }} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
          <span>Numéro</span><span>Niveau</span><span>Titre</span><span>Source</span><span>Score</span><span>Statut</span><span>Assigné</span>
        </div>
        {rows.map((a) => {
          const m = meta(a.level);
          const sc = alertStatusCol[a.status] ?? '#7a857b';
          return (
            <Hov
              key={a.number}
              onClick={() => openFiche({ id: parseInt(a.number.slice(-4)), level: a.level, text: a.title, platform: a.platform, place: a.place, score: a.score, time: a.time, color: m.c, levelLabel: m.l, code: a.number })}
              base={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '12px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12.5, cursor: 'pointer' }}
              hover={{ background: '#f5f7f4' }}
            >
              <span style={{ fontFamily: MONO, fontSize: 11, color: colors.muted }}>#{a.number}</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', color: m.c, border: `1px solid ${m.c}`, borderRadius: 4, padding: '2px 5px', textTransform: 'uppercase', justifySelf: 'start' }}>{m.l}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: colors.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                <div style={{ fontSize: 10.5, color: '#7a857b', marginTop: 1 }}>{a.type} · {a.place}</div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: colors.text4, fontSize: 11.5 }}><PlatformDot platform={a.platform} size={7} />{a.platform}</span>
              <span style={{ fontFamily: MONO, color: m.c }}>{a.score.toFixed(2)}</span>
              <span><span style={{ fontSize: 11, fontWeight: 600, color: sc }}>{a.status}</span></span>
              <span style={{ color: colors.muted, fontSize: 11.5 }}>{a.assigned}</span>
            </Hov>
          );
        })}
      </Panel>

      {/* Moteur de règles */}
      <Panel title="Moteur de règles" accent={colors.cyan} bodyStyle={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr .7fr 1.3fr 1fr .6fr', gap: 10, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
          <span>Règle</span><span>Condition</span><span>Niveau</span><span>Canaux</span><span>Destinataires</span><span>État</span>
        </div>
        {alertRules.map((r) => {
          const m = meta(r.level);
          return (
            <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr .7fr 1.3fr 1fr .6fr', gap: 10, padding: '12px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: colors.cyan }}>{r.name}</span>
              <span style={{ color: colors.text4, fontSize: 11.5 }}>{r.condition}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: m.c, border: `1px solid ${m.c}`, borderRadius: 4, padding: '2px 5px', textTransform: 'uppercase', justifySelf: 'start' }}>{m.l}</span>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {r.channels.map((ch) => (
                  <span key={ch} style={{ fontSize: 9.5, color: '#6b766c', background: '#eef1ee', border: '1px solid #dfe3de', borderRadius: 4, padding: '1px 5px' }}>{ch}</span>
                ))}
              </span>
              <span style={{ color: colors.muted, fontSize: 11.5 }}>{r.recipients}</span>
              <span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: r.active ? '#16a34a' : colors.muted3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.active ? '#16a34a' : colors.muted3 }} />
                  {r.active ? 'Actif' : 'Inactif'}
                </span>
              </span>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
