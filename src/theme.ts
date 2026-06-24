// Design tokens & helpers portés depuis le prototype SENTINELLE

export type Level = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const colors = {
  // Couleurs nationales
  green: '#0a7d3c',
  greenDark: '#0a5a2c',
  greenDeep: '#073f1e',
  greenLight: '#3fb56e',
  red: '#ce1126',
  gold: '#fcd116',
  goldHover: '#ffd92e',

  // Thème clair institutionnel (back-office) — repointé sur des surfaces claires.
  // Les vues référencent ces tokens : le basculement se propage à tout l'admin.
  bg: '#f3f4f2',        // fond de l'application
  panel: '#ffffff',     // cartes / panneaux
  panelAlt: '#fafbfa',  // en-têtes de panneaux, bandeaux
  panelDeep: '#f7f8f6', // surfaces enfoncées (champs, lignes paires)
  sidebar: '#ffffff',   // barre latérale
  border: '#e3e6e2',    // bordure principale
  borderSoft: '#eceee9',// séparateurs discrets
  borderFaint: '#f0f1ee',
  borderNav: '#eceee9',

  // Accent institutionnel (remplace l'ancien cyan néon)
  cyan: '#0a7d3c',
  cyanDim: '#0a5a2c',
  amber: '#b7791f',
  grid: '#eef1ee',

  // Texte (ardoise sur fond clair)
  text: '#16231c',
  text2: '#2a352d',
  text3: '#3a463f',
  text4: '#55615a',
  muted: '#6b766c',
  muted2: '#828c83',
  muted3: '#9aa39a',
  muted4: '#b3bbb3',

  // Thème clair (site public)
  lightBg: '#f7f6f1',
  lightPanel: '#ffffff',
  lightText: '#16231c',
  lightMuted: '#6b766c',
  lightMuted2: '#7d8a80',
  lightBorder: '#ece9de',
  lightBorder2: '#e6e3d8',
  lightField: '#fbfaf5',
  lightFieldBorder: '#d8d4c6',
};

// Niveaux de menace — teintes assombries pour un contraste lisible sur fond clair.
const LEVELS: Record<Level, { c: string; l: string }> = {
  INFO: { c: '#2563eb', l: 'Info' },
  LOW: { c: '#16a34a', l: 'Faible' },
  MEDIUM: { c: '#ca8a04', l: 'Moyen' },
  HIGH: { c: '#ea580c', l: 'Élevé' },
  CRITICAL: { c: '#dc2626', l: 'Critique' },
};

export function meta(level: Level): { c: string; l: string } {
  return LEVELS[level] ?? { c: '#7d8896', l: level };
}

/** Convertit un hex (#rrggbb) en rgba avec alpha. */
export function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatClock(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const MONO = "'IBM Plex Mono', monospace";

/** Couleurs de marque par plateforme surveillée (incl. LinkedIn). */
export const platformColors: Record<string, string> = {
  Facebook: '#1877f2',
  'Twitter / X': '#71767b',
  Telegram: '#2aabee',
  YouTube: '#ff0033',
  LinkedIn: '#0a66c2',
  TikTok: '#ff0050',
  Instagram: '#e1306c',
  WhatsApp: '#25d366',
  Presse: '#d4a017',
};

/** Niveau d'alerte national (configurable côté backend plus tard). */
export const NATIONAL_LEVEL: Level = 'HIGH';
