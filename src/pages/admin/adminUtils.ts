import { meta, rgba, type Level } from '../../theme';
import {
  regionsRaw,
  alertCountsRaw,
  trendingRaw,
  volumesRaw,
  threatActorsRaw,
  citizenReportsRaw,
  statusCol,
  endpointsRaw,
  epStatusCol,
  type FeedItem,
} from '../../data/mock';

export interface DecoratedFeed extends FeedItem {
  color: string;
  levelLabel: string;
  code: string;
}

/** Ajoute couleur, libellé de niveau et code de fiche à un item de flux. */
export function decorate(item: FeedItem): DecoratedFeed {
  const m = meta(item.level);
  return {
    ...item,
    color: m.c,
    levelLabel: m.l,
    code: '2026-06-21-' + String(item.id || 47).slice(-4).padStart(4, '0'),
  };
}

export interface AdminOutletContext {
  feed: DecoratedFeed[];
  openFiche: (item: DecoratedFeed) => void;
}

// ---------- Données dérivées (décorées avec couleurs) ----------

export const regions = regionsRaw.map((r) => {
  const m = meta(r.level);
  return {
    ...r,
    color: m.c,
    levelLabel: m.l,
    tileBg: rgba(m.c, 0.14),
    tileBorder: rgba(m.c, 0.55),
    pulse: r.level === 'CRITICAL' || r.level === 'HIGH',
  };
});

export const alertCounts = alertCountsRaw.map(([level, n]) => {
  const m = meta(level);
  return { level, n, color: m.c, label: m.l, bg: rgba(m.c, 0.1) };
});

export const trending = trendingRaw.map(([tag, sc], i) => ({
  tag,
  rank: i + 1,
  score: sc.toFixed(1),
  pct: ((sc / 9) * 100).toFixed(0) + '%',
  c: sc >= 6.5 ? '#ea580c' : '#d4a017',
}));

const VMAX = 34200;
export const volumes = volumesRaw.map(([name, v]) => ({
  name,
  value: v.toLocaleString('fr-FR'),
  pct: ((v / VMAX) * 100).toFixed(0) + '%',
}));

export const threatActors = threatActorsRaw.map((a) => {
  const m = meta(a.level as Level);
  return { ...a, color: m.c, label: m.l, bg: rgba(m.c, 0.12) };
});

export const citizenReports = citizenReportsRaw.map((c) => {
  const col = statusCol[c.status] ?? '#7a857b';
  return { ...c, scol: col, sbg: rgba(col, 0.14) };
});

export const endpoints = endpointsRaw.map((e) => ({
  ...e,
  scol: epStatusCol[e.status] ?? '#7a857b',
  tcol: e.threats > 0 ? '#ea580c' : '#9aa39a',
}));
