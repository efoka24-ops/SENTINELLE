import { colors, MONO } from '../../../theme';
import { auditStats, auditLog } from '../../../data/modules';
import { Panel, StatCard, ViewHeader } from '../ui';
import { useAuditLogs } from '../../../api/hooks';

const GRID = '150px 1.1fr .8fr 1.3fr 1.4fr';

const ACTION_COL: Record<string, string> = {
  ALERT_CREATED: '#2563eb',
  ALERT_OPENED: '#2563eb',
  ALERT_VALIDATED: '#16a34a',
  ALERT_ESCALATED: '#dc2626',
  REPORT_GENERATED: '#0a7d3c',
  CONTENT_VIEWED: '#7a857b',
  CONTENT_SEARCHED: '#7a857b',
  PLATFORM_REPORT_SENT: '#ca8a04',
};

export function AuditView() {
  const live = useAuditLogs();
  const rows = (live.data && live.data.length)
    ? live.data.map((r) => ({
        time: new Date(r.time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        user: r.user, role: r.role, action: r.action, target: r.target,
      }))
    : auditLog;

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
      <ViewHeader
        title="Journal d'audit & conformité"
        sub="Module 11 · journal immuable — Comité d'Éthique et de Contrôle"
        right={<span style={{ fontSize: 11, color: '#16a34a', fontFamily: MONO }}>● IMMUABLE</span>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
        {auditStats.map((s, i) => (
          <StatCard key={s.label} value={s.value} label={s.label} accent={[colors.text, colors.cyan, colors.gold, '#16a34a'][i]} />
        ))}
      </div>

      <Panel title="Journal des actions" accent={colors.cyan} bodyStyle={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
          <span>Horodatage</span><span>Analyste</span><span>Rôle</span><span>Action</span><span>Cible</span>
        </div>
        {rows.map((a, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '12px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12.5 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: colors.muted }}>{a.time}</span>
            <span style={{ color: a.user === 'Système' ? colors.muted3 : colors.text2 }}>{a.user}</span>
            <span style={{ color: colors.muted2, fontSize: 11.5 }}>{a.role}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: ACTION_COL[a.action] ?? colors.text4 }}>{a.action}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: colors.text4 }}>{a.target}</span>
          </div>
        ))}
        <div style={{ padding: '12px 16px', fontSize: 11, color: colors.muted3, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: '#ca8a04' }}>⚠</span> Ce journal est immuable — aucune modification ni suppression possible (append-only).
        </div>
      </Panel>
    </div>
  );
}
