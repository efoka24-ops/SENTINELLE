import { colors, MONO } from '../../../theme';
import { endpoints } from '../adminUtils';

const GRID = '1.3fr 1fr 1fr .8fr 1fr .7fr 1fr';

export function EndpointsView() {
  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Surveillance des endpoints</div>
          <div style={{ fontSize: 11, color: '#7a857b', marginTop: 2 }}>EDR · agents déployés sur l'infrastructure SENTINELLE</div>
        </div>
        <span style={{ fontSize: 11, color: colors.muted, fontFamily: MONO }}>AGENT v4.2.1</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
        {[
          ['42', 'Endpoints surveillés', colors.text],
          ['39', 'En ligne', '#16a34a'],
          ['3', 'Alertes EDR', '#ea580c'],
          ['1', 'Poste isolé', '#dc2626'],
        ].map(([n, l, c]) => (
          <div key={l} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, color: c }}>{n}</div>
            <div style={{ fontSize: 11, color: colors.muted2, marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, padding: '12px 18px', background: colors.panelAlt, borderBottom: `1px solid ${colors.border}`, fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
          <span>Hôte</span><span>Service</span><span>Système</span><span>Agent</span><span>Statut</span><span>Menaces</span><span>Dernier contact</span>
        </div>
        {endpoints.map((e) => (
          <div key={e.host} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, padding: '13px 18px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 13 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: colors.text2 }}>{e.host}</span>
            <span style={{ color: colors.text4 }}>{e.dept}</span>
            <span style={{ color: colors.muted, fontSize: 12 }}>{e.os}</span>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#7a857b' }}>{e.agent}</span>
            <span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: e.scol }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.scol }} />{e.status}
              </span>
            </span>
            <span style={{ fontFamily: MONO, color: e.tcol }}>{e.threats}</span>
            <span style={{ color: '#7a857b', fontSize: 12 }}>{e.seen}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
