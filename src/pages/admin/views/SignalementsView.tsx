import { colors, MONO, rgba } from '../../../theme';
import { citizenReports } from '../adminUtils';
import { statusCol } from '../../../data/mock';
import { useCitizenReports } from '../../../api/hooks';

const GRID = '170px 1.4fr 1fr 1fr 1fr 1fr';

export function SignalementsView() {
  const live = useCitizenReports();
  const rows = (live.data && live.data.length)
    ? live.data.map((c) => {
        const col = statusCol[c.status] ?? '#7a857b';
        return {
          ref: c.ref, type: c.type, region: c.region || '—', status: c.status,
          sla: '—', time: new Date(c.time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
          scol: col, sbg: rgba(col, 0.14),
        };
      })
    : citizenReports;

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Signalements citoyens</div>
          <div style={{ fontSize: 11, color: '#7a857b', marginTop: 2 }}>File de traitement · signal.sentinelle.cm</div>
        </div>
        <div style={{ display: 'flex', gap: 22 }}>
          {[
            ['128', 'Reçus · 24 h', colors.text],
            ['14', 'En attente', '#ca8a04'],
            ['100 %', 'Dans le SLA', '#16a34a'],
          ].map(([n, l, c]) => (
            <div key={l} style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: c }}>{n}</div>
              <div style={{ fontSize: 10, color: colors.muted2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, padding: '12px 18px', background: colors.panelAlt, borderBottom: `1px solid ${colors.border}`, fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
          <span>Référence</span><span>Type</span><span>Région</span><span>Statut</span><span>SLA</span><span>Reçu</span>
        </div>
        {rows.map((c) => (
          <div key={c.ref} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, padding: '14px 18px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 13 }}>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: colors.muted }}>{c.ref}</span>
            <span style={{ color: colors.text2 }}>{c.type}</span>
            <span style={{ color: colors.text4 }}>{c.region}</span>
            <span>
              <span style={{ fontSize: 11, fontWeight: 600, color: c.scol, background: c.sbg, borderRadius: 5, padding: '3px 9px' }}>{c.status}</span>
            </span>
            <span style={{ color: colors.muted, fontSize: 12 }}>{c.sla}</span>
            <span style={{ color: '#7a857b', fontSize: 12 }}>{c.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
