import { useEffect, useRef, useState } from 'react';
import { colors, rgba } from '../../../theme';
import { useNotifications } from '../../../api/hooks';

interface NotificationItem {
  id: number;
  ts: string;
  channel: string;
  target: string;
  level: string;
  notification_type: string;
  message: string;
  is_read: boolean;
  signalement_ref: string | null;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: notifications = [], refetch } = useNotifications();

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Show toast for new unread notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter((n) => !n.is_read && new Date(n.ts).getTime() > lastNotificationTime);
    if (unreadNotifications.length > 0) {
      // Toast would be displayed via a toast provider
      setLastNotificationTime(Date.now());
    }
  }, [notifications, lastNotificationTime]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayNotifications = notifications.slice(0, 5);

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'ESCALATION':
        return '#ef4444'; // Red
      case 'SLA_WARNING':
        return '#eab308'; // Yellow
      case 'TRANSMISSION':
        return '#10b981'; // Green
      case 'DECISION_NEEDED':
        return '#3b82f6'; // Blue
      default:
        return '#8b5cf6'; // Purple
    }
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'ESCALATION':
        return '⬆️';
      case 'SLA_WARNING':
        return '⏰';
      case 'TRANSMISSION':
        return '✓';
      case 'DECISION_NEEDED':
        return '?';
      default:
        return '●';
    }
  };

  const formatTime = (ts: string): string => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: colors.text,
          transition: 'all 0.2s',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = rgba(colors.border, 0.5);
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'none';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#ef4444',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${colors.bg}`,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '360px',
            maxHeight: '500px',
            borderRadius: '12px',
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>
              Notifications {unreadCount > 0 && <span style={{ color: '#ef4444' }}>({unreadCount})</span>}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  // Mark all as read - would need to call API
                  setIsOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.muted2,
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Marquer tout comme lu
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {displayNotifications.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: colors.muted2,
                  fontSize: '13px',
                }}
              >
                Aucune notification
              </div>
            ) : (
              displayNotifications.map((notif) => (
                <NotificationItem key={notif.id} notification={notif} />
              ))
            )}
          </div>

          {/* Footer - View All Link */}
          {notifications.length > 5 && (
            <div
              style={{
                padding: '12px 16px',
                borderTop: `1px solid ${colors.border}`,
                textAlign: 'center',
              }}
            >
              <a
                href="/admin/notifications"
                style={{
                  color: '#3b82f6',
                  fontSize: '12px',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                Voir toutes les notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification }: { notification: NotificationItem }) {
  const color = getNotificationTypeColor(notification.notification_type);
  const icon = getNotificationTypeIcon(notification.notification_type);

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${colors.border}`,
        background: notification.is_read ? 'transparent' : rgba(color, 0.08),
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = rgba(colors.border, 0.3);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = notification.is_read
          ? 'transparent'
          : rgba(color, 0.08);
      }}
      onClick={() => {
        // Mark as read and navigate to signalement if applicable
        if (notification.signalement_ref) {
          window.location.href = `/admin/signalements/${notification.signalement_ref}`;
        }
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Icon with badge */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: rgba(color, 0.15),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          {icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: notification.is_read ? '400' : '600',
              color: colors.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {notification.signalement_ref && (
              <span style={{ color, fontWeight: '600' }}>{notification.signalement_ref} · </span>
            )}
            {notification.notification_type}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: colors.muted2,
              marginTop: '4px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {notification.message}
          </div>
          <div style={{ fontSize: '10px', color: colors.muted2, marginTop: '6px' }}>
            {formatTime(notification.ts)}
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.is_read && (
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: color,
              flexShrink: 0,
              marginTop: '6px',
            }}
          />
        )}
      </div>
    </div>
  );
}

function getNotificationTypeColor(type: string): string {
  switch (type) {
    case 'ESCALATION':
      return '#ef4444';
    case 'SLA_WARNING':
      return '#eab308';
    case 'TRANSMISSION':
      return '#10b981';
    case 'DECISION_NEEDED':
      return '#3b82f6';
    default:
      return '#8b5cf6';
  }
}

function getNotificationTypeIcon(type: string): string {
  switch (type) {
    case 'ESCALATION':
      return '⬆️';
    case 'SLA_WARNING':
      return '⏰';
    case 'TRANSMISSION':
      return '✓';
    case 'DECISION_NEEDED':
      return '?';
    default:
      return '●';
  }
}

function formatTime(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins}m`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
}
