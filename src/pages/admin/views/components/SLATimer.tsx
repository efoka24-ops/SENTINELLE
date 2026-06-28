import { useEffect, useState } from 'react';
import { colors } from '../../../../theme';

interface SLATimerProps {
  dueAt: string;
  variant?: 'compact' | 'prominent';
}

export function SLATimer({ dueAt, variant = 'compact' }: SLATimerProps) {
  const [remaining, setRemaining] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const due = new Date(dueAt);
      const diff = due.getTime() - now.getTime();

      if (diff <= 0) {
        setIsOverdue(true);
        setIsUrgent(false);
        setRemaining('DÉPASSÉ');
      } else {
        setIsOverdue(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        setIsUrgent(hours < 6);
        setRemaining(`${hours}h ${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [dueAt]);

  if (variant === 'prominent') {
    return (
      <div
        style={{
          background: isOverdue ? '#fecaca' : isUrgent ? '#fed7aa' : colors.panel,
          border: `2px solid ${isOverdue ? '#dc2626' : isUrgent ? '#ea580c' : '#16a34a'}`,
          borderRadius: 12,
          padding: '16px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 10.5, letterSpacing: '.05em', textTransform: 'uppercase', color: colors.muted2, marginBottom: 4 }}>
          Délai SLA · 24h
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 28,
            fontWeight: 700,
            color: isOverdue ? '#dc2626' : isUrgent ? '#ea580c' : '#16a34a',
          }}
        >
          {remaining}
        </div>
        {isOverdue && (
          <div style={{ fontSize: 11, color: '#991b1b', marginTop: 8, fontWeight: 600 }}>
            ⚠️ Signalement en retard
          </div>
        )}
        {isUrgent && !isOverdue && (
          <div style={{ fontSize: 11, color: '#92400e', marginTop: 8, fontWeight: 600 }}>
            ⏰ Moins de 6 heures restantes
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: isOverdue ? '#dc2626' : isUrgent ? '#ea580c' : '#16a34a', flex: 'none' }} />
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          fontWeight: 600,
          color: isOverdue ? '#dc2626' : isUrgent ? '#ea580c' : '#16a34a',
        }}
      >
        {remaining}
      </span>
    </div>
  );
}
