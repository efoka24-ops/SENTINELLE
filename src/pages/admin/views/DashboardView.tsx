import { useAuth } from '../../../auth/AuthContext';
import { DashboardAnalyst } from './DashboardAnalyst';
import { DashboardChief } from './DashboardChief';
import { DashboardDirector } from './DashboardDirector';
import { DashboardAuditor } from './DashboardAuditor';
import { colors } from '../../../theme';

/**
 * Router component that selects the appropriate dashboard based on user role.
 *
 * Role mapping:
 * - analyst_jr, analyst_sr → DashboardAnalyst
 * - chief → DashboardChief
 * - director → DashboardDirector
 * - auditor → DashboardAuditor
 * - admin → DashboardDirector (full view)
 */
export function DashboardView() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: colors.muted }}>Veuillez vous connecter</div>
      </div>
    );
  }

  // Route to appropriate dashboard based on role
  switch (user.role) {
    case 'analyst_jr':
    case 'analyst_sr':
      return <DashboardAnalyst />;
    case 'chief':
      return <DashboardChief />;
    case 'director':
    case 'admin':
      return <DashboardDirector />;
    case 'auditor':
      return <DashboardAuditor />;
    default:
      return <DashboardAnalyst />; // Fallback to analyst view
  }
}
