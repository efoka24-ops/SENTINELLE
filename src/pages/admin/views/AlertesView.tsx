import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { colors, MONO, meta, type Level } from '../../../theme';
import { alertsList, alertRules, alertStatusCol } from '../../../data/modules';
import { Panel, PlatformDot, ViewHeader } from '../ui';
import type { AdminOutletContext } from '../adminUtils';
import { Hov } from '../../../lib/Hoverable';
import { useAlerts, useUpdateAlert } from '../../../api/hooks';
import { useAuth } from '../../../auth/AuthContext';

const GRID = '128px 64px 1.7fr 1fr 48px 130px 1fr 96px';
const LEVELS: Level[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES = ['Ouvert', 'En cours', 'Escaladé', 'Clôturé'];
const ellip: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 };

interface Row {
  id?: number;
  number: string;
  level: Level;
  type: string;
  title: string;
  platform: string;
  place: string;
  score: number;
  status: string;
  assigned: string;
}

export function AlertesView() {
  const { openFiche } = useOutletContext<AdminOutletContext>();
  const { user, hasPerm } = useAuth();
  const live = useAlerts();
  const updateAlert = useUpdateAlert();
  const [busy, setBusy] = useState<number | null>(null);

  const isLive = !!(live.data && live.data.length);
  const rows: Row[] = isLive
    ? live.data!.map((a) => ({
        id: a.id, number: a.number, level: a.level as Level, type: a.threat_type, title: a.title,
        platform: a.platform, place: a.place, score: a.score, status: a.status, assigned: a.assigned || '—',
      }))
    : alertsList.map((a) => ({ ...a, level: a.level as Level }));

  const canAct = hasPerm('alerts:ack') || hasPerm('alerts:write');
  const counts = LEVELS.map((lvl) => {
    const m = meta(lvl);
    return { level: lvl, color: m.c, label: m.l, n: rows.filter((r) => r.level === lvl).length };
  });

  const setStatus = async (r: Row, status: string) => {
    if (r.id == null) return;
    setBusy(r.id);
    try { await updateAlert.mutateAsync({ id: r.id, status }); } finally { setBusy(null); }
  };
  const assignToMe = async (r: Row) => {
    if (r.id == null) return;
    setBusy(r.id);
    try { await updateAlert.mutateAsync({ id: r.id, assigned: user?.name ?? 'moi' }); } finally { setBusy(null); }
  };

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto', minWidth: 0 }}>
      <ViewHeader
        title="Alertes & moteur de règles"
        sub="Détection, escalade et notification — traitement opérationnel"
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

      {!isLive && (
        <div style={{ fontSize: 11.5, color: colors.muted2, marginBottom: 10 }}>
          Données de démonstration — lancez un scan pour générer des alertes réelles et activer les actions.
        </div>
      )}

      {/* Liste des alertes */}
      <Panel title="Alertes actives" accent="#dc2626" bodyStyle={{ padding: 0 }} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
          <span>Numéro</span><span>Niveau</span><span>Titre</span><span>Source</span><span>Score</span><span>Statut</span><span>Assigné</span><span>Action</span>
        </div>
        {rows.map((a) => {
          const m = meta(a.level);
          const sc = alertStatusCol[a.status] ?? '#7a857b';
          const rowBusy = a.id != null && busy === a.id;
          return (
            <div key={a.number} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '10px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12.5, opacity: rowBusy ? 0.5 : 1 }}>
              <span style={{ ...ellip, fontFamily: MONO, fontSize: 11, color: colors.muted, cursor: 'pointer' }} onClick={() => openFiche({ id: a.id ?? 0, level: a.level, text: a.title, platform: a.platform, place: a.place, score: a.score, time: '', color: m.c, levelLabel: m.l, code: a.number })}>#{a.number}</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', color: m.c, border: `1px solid ${m.c}`, borderRadius: 4, padding: '2px 5px', textTransform: 'uppercase', justifySelf: 'start' }}>{m.l}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ ...ellip, color: colors.text2 }}>{a.title}</div>
                <div style={{ ...ellip, fontSize: 10.5, color: '#7a857b', marginTop: 1 }}>{a.type} · {a.place}</div>
              </div>
              <span style={{ ...ellip, display: 'flex', alignItems: 'center', gap: 7, color: colors.text4, fontSize: 11.5 }}><PlatformDot platform={a.platform} size={7} />{a.platform}</span>
              <span style={{ fontFamily: MONO, color: m.c }}>{a.score.toFixed(2)}</span>
              {canAct && a.id != null ? (
                <select value={a.status} onChange={(e) => setStatus(a, e.target.value)} disabled={rowBusy}
                  style={{ width: '100%', minWidth: 0, fontSize: 11, fontWeight: 600, color: sc, background: '#f7f8f6', border: `1px solid ${colors.border}`, borderRadius: 6, padding: '4px 6px', outline: 'none', cursor: 'pointer' }}>
                  {STATUSES.map((s) => <option key={s} value={s} style={{ color: colors.text }}>{s}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 600, color: sc }}>{a.status}</span>
              )}
              <span style={{ ...ellip, color: colors.muted, fontSize: 11.5 }}>{a.assigned}</span>
              {canAct && a.id != null ? (
                <Hov as="span" onClick={() => assignToMe(a)} base={{ fontSize: 10, fontWeight: 600, color: colors.greenDeep, background: colors.greenLight, borderRadius: 6, padding: '4px 7px', cursor: 'pointer', textAlign: 'center', whiteSpace: 'nowrap' }} hover={{ background: colors.green, color: '#fff' }}>M'assigner</Hov>
              ) : <span />}
            </div>
          );
        })}
      </Panel>

      {/* Moteur de règles */}
      <Panel title="Moteur de règles" accent={colors.cyan} bodyStyle={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr .7fr 1.3fr 1fr .6fr', gap: 10, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
          <span>Règle</span><span>Condition</span><span>Niveau</span><span>Canaux</span><span>Destinataires</span><span>État</span>
        </div>
        {alertRules.map((r) => {
          const m = meta(r.level);
          return (
            <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr .7fr 1.3fr 1fr .6fr', gap: 10, padding: '12px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12 }}>
              <span style={{ ...ellip, fontFamily: MONO, fontSize: 11, color: colors.cyan }}>{r.name}</span>
              <span style={{ ...ellip, color: colors.text4, fontSize: 11.5 }}>{r.condition}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: m.c, border: `1px solid ${m.c}`, borderRadius: 4, padding: '2px 5px', textTransform: 'uppercase', justifySelf: 'start' }}>{m.l}</span>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {r.channels.map((ch) => (
                  <span key={ch} style={{ fontSize: 9.5, color: colors.text3, background: '#eef1ee', border: '1px solid #dfe3de', borderRadius: 4, padding: '1px 5px' }}>{ch}</span>
                ))}
              </span>
              <span style={{ ...ellip, color: colors.muted, fontSize: 11.5 }}>{r.recipients}</span>
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
