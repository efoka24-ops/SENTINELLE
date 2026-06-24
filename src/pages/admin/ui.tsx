import type { CSSProperties, ReactNode } from 'react';
import { colors, platformColors, MONO } from '../../theme';

/**
 * Panneau institutionnel épuré : carte blanche, bordure discrète, en-tête sobre
 * avec un fin liseré d'accent à gauche du titre.
 */
export function Panel({
  title,
  accent = colors.green,
  right,
  children,
  style,
  bodyStyle,
}: {
  title?: string;
  accent?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}) {
  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,32,24,.04)', ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${colors.borderSoft}`, background: colors.panelAlt }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 3, height: 14, background: accent, borderRadius: 2 }} />
            <span style={{ fontSize: 12.5, letterSpacing: '.02em', color: colors.text2, fontWeight: 600 }}>{title}</span>
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: 16, flex: 1, minHeight: 0, ...bodyStyle }}>{children}</div>
    </div>
  );
}

/** KPI : libellé discret, grande valeur, liseré d'accent à gauche. */
export function StatCard({ value, label, accent = colors.green }: { value: string; label: string; accent?: string }) {
  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,32,24,.04)' }}>
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
      <div style={{ fontSize: 10.5, letterSpacing: '.04em', textTransform: 'uppercase', color: colors.muted, marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, color: colors.text, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

/** Pastille colorée de plateforme. */
export function PlatformDot({ platform, size = 8 }: { platform: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: 2, background: platformColors[platform] ?? colors.muted3, flex: 'none', display: 'inline-block' }} />;
}

const liveStatus: Record<string, string> = {
  online: '#16a34a',
  degraded: '#ea580c',
  offline: '#dc2626',
  collected: '#2563eb',
  normalized: '#16a34a',
  queued: '#ca8a04',
};

export function statusColor(s: string): string {
  return liveStatus[s] ?? colors.muted3;
}

/** En-tête de vue : surtitre d'accent + titre. */
export function ViewHeader({ title, sub, right }: { title: string; sub: string; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${colors.border}` }}>
      <div>
        <div style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: colors.green, fontWeight: 600, marginBottom: 5 }}>{title}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: colors.text, letterSpacing: '-.01em' }}>{sub}</div>
      </div>
      {right}
    </div>
  );
}

/** Badge de niveau compact : pastille teintée, texte coloré. */
export function LevelTag({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em', color, background: rgbaLocal(color, 0.1), border: `1px solid ${rgbaLocal(color, 0.35)}`, borderRadius: 6, padding: '2px 7px', textTransform: 'uppercase' }}>{label}</span>
  );
}

function rgbaLocal(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
