interface IconProps {
  size?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function IconDashboard({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconMap({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconEndpoints({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <path d="M7 7h.01" />
      <path d="M7 17h.01" />
    </svg>
  );
}

export function IconShield({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6z" />
    </svg>
  );
}

export function IconFlag({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2 4 2 4H5" />
    </svg>
  );
}

export function IconLogout({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function IconCollect({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 12a8 8 0 0 1 8-8" />
      <path d="M4 12a8 8 0 0 0 8 8" />
      <path d="M7.5 12a4.5 4.5 0 0 1 4.5-4.5" />
      <circle cx="12" cy="12" r="1.6" />
      <path d="M12 13.5V21" />
    </svg>
  );
}

export function IconAI({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  );
}

export function IconBell({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function IconReport({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

export function IconAudit({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconUsers({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.5a4 4 0 0 1 0 7" />
    </svg>
  );
}

export function IconScan({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconNetwork({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="5" cy="18" r="2.2" />
      <circle cx="19" cy="18" r="2.2" />
      <path d="M12 7.2 6.5 16M12 7.2 17.5 16M7 18h10" />
    </svg>
  );
}

export function IconSearch({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9aa39a" strokeWidth={2} strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  );
}
