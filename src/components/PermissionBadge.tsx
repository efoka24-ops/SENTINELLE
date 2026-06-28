import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { colors, rgba } from '../theme';
import { Hov } from '../lib/Hoverable';

const ROLE_LABELS: Record<string, { label: string; level: number }> = {
  analyst_jr: { label: 'Analyste Junior', level: 1 },
  analyst_sr: { label: 'Analyste Senior', level: 2 },
  chief: { label: "Chef d'équipe", level: 3 },
  director: { label: 'Directeur', level: 4 },
  admin: { label: 'Administrateur', level: 5 },
  auditor: { label: 'Auditeur', level: 2 },
};

/**
 * Permission badge component showing user role + level in top-right corner.
 * Click to see full permission list for debugging.
 */
export function PermissionBadge() {
  const { user, permissions } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (!user) return null;

  const roleInfo = ROLE_LABELS[user.role] || { label: user.role, level: 0 };

  return (
    <>
      <Hov
        as="div"
        onClick={() => setShowDetails(!showDetails)}
        base={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 12px',
          borderRadius: 8,
          background: rgba(colors.green, 0.1),
          border: `1px solid ${rgba(colors.green, 0.3)}`,
          cursor: 'pointer',
          fontSize: 11,
          color: colors.muted2,
          fontWeight: 600,
        }}
        hover={{ background: rgba(colors.green, 0.15) }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.green }} />
        <span style={{ color: colors.greenDark }}>
          {roleInfo.label}
        </span>
        <span style={{ fontSize: 9, color: colors.muted3 }}>
          L{roleInfo.level}
        </span>
      </Hov>

      {showDetails && (
        <div
          style={{
            position: 'fixed',
            top: 60,
            right: 20,
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,.15)',
            zIndex: 1000,
            minWidth: 280,
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${colors.borderSoft}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: colors.muted }}>
              {roleInfo.label} (Level {roleInfo.level})
            </div>
            {user.email && (
              <div style={{ fontSize: 10, color: colors.muted3, marginTop: 4 }}>
                {user.email}
              </div>
            )}
          </div>

          <div style={{ fontSize: 10, fontWeight: 600, color: colors.muted2, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
            Permissions ({permissions.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {permissions.length === 0 ? (
              <div style={{ fontSize: 11, color: colors.muted3, fontStyle: 'italic' }}>
                Aucune permission
              </div>
            ) : (
              permissions.map((p) => (
                <div
                  key={p}
                  style={{
                    fontSize: 11,
                    color: colors.text3,
                    background: colors.panelDeep,
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontFamily: 'Monaco, monospace',
                    wordBreak: 'break-all',
                  }}
                >
                  {p}
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setShowDetails(false)}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '6px 8px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: colors.panelDeep,
              color: colors.muted,
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>
      )}
    </>
  );
}
