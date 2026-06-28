import { colors } from '../../../../theme';
import type { ApiSignalement } from '../../../../api/types';

interface EscalationChainProps {
  signalement: ApiSignalement;
}

export function EscalationChain({ signalement }: EscalationChainProps) {
  // Simple escalation chain: analyst_jr → chief → director
  const chain = [
    { role: 'Analyste junior', name: signalement.assigned_to || '—', active: signalement.status === 'Analyse' },
    { role: "Chef d'équipe", name: signalement.status === 'Escalade' ? '(En attente)' : '—', active: signalement.status === 'Escalade' },
    { role: 'Directeur', name: signalement.status === 'Decision' ? '(En attente)' : '—', active: signalement.status === 'Decision' },
  ];

  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.text2, marginBottom: 14 }}>
        Chaîne d'escalade
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {chain.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div
              style={{
                background: item.active ? colors.greenLight : colors.panelDeep,
                border: `2px solid ${item.active ? colors.green : colors.border}`,
                borderRadius: 8,
                padding: '12px 10px',
                textAlign: 'center',
                flex: 1,
              }}
            >
              <div style={{ fontSize: 10.5, color: colors.muted2, marginBottom: 4 }}>
                {item.role}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: item.active ? colors.greenDark : colors.text }}>
                {item.name}
              </div>
            </div>
            {idx < chain.length - 1 && (
              <div style={{ fontSize: 18, color: colors.border, flex: 'none' }}>→</div>
            )}
          </div>
        ))}
      </div>

      {signalement.escalation_comment && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 10, color: colors.muted2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Motif d'escalade
          </div>
          <div style={{ fontSize: 12, color: colors.text, lineHeight: 1.5 }}>
            {signalement.escalation_comment}
          </div>
        </div>
      )}
    </div>
  );
}
