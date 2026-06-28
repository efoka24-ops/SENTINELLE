import { colors } from '../../../../theme';
import type { SignalementHistory } from '../../../../api/types';

interface HistoryPanelProps {
  history: SignalementHistory[];
  isLoading?: boolean;
}

const actionIcons: Record<string, string> = {
  created: '📝',
  viewed: '👁️',
  assigned: '👤',
  escalated: '⬆️',
  decided: '✓',
  transmitted: '📤',
  annotated: '📌',
};

export function HistoryPanel({ history, isLoading }: HistoryPanelProps) {
  if (isLoading) {
    return (
      <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.text2, marginBottom: 14 }}>
          Historique d'actions
        </div>
        <div style={{ textAlign: 'center', padding: '24px 16px', color: colors.muted }}>
          Chargement...
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.text2, marginBottom: 14 }}>
          Historique d'actions
        </div>
        <div style={{ textAlign: 'center', padding: '24px 16px', color: colors.muted }}>
          Aucune action enregistrée
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.text2, marginBottom: 14 }}>
        Historique d'actions
      </div>
      <div>
        {history.map((entry, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: 12,
              paddingBottom: 14,
              marginBottom: 14,
              borderBottom: idx < history.length - 1 ? `1px solid ${colors.borderSoft}` : 'none',
            }}
          >
            <div style={{ fontSize: 20, flex: 'none' }}>
              {actionIcons[entry.action.toLowerCase()] || '•'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.text2 }}>
                  {entry.actor}
                </div>
                <div style={{ fontSize: 11, color: colors.muted }}>
                  {new Date(entry.timestamp).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <div style={{ fontSize: 12, color: colors.text4, marginBottom: 2 }}>
                {entry.action}
              </div>
              {entry.notes && (
                <div style={{ fontSize: 11, color: colors.muted, lineHeight: 1.5, marginTop: 6 }}>
                  <em>{entry.notes}</em>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
