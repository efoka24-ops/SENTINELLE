import type { Level } from '../theme';

// ---------- Types ----------

export interface FeedItem {
  id: number;
  level: Level;
  text: string;
  platform: string;
  place: string;
  score: number;
  time: string;
}

export interface RegionRaw {
  name: string;
  short: string;
  level: Level;
  score: string;
  threat: string;
  gc: number; // grid-column
  gr: number; // grid-row
}

export interface ThreatActorRaw {
  code: string;
  name: string;
  type: string;
  level: Level;
  platforms: string;
  incidents: number;
  accounts: number;
  first: string;
  last: string;
}

export interface CitizenReportRaw {
  ref: string;
  type: string;
  region: string;
  status: string;
  sla: string;
  time: string;
}

export interface EndpointRaw {
  host: string;
  dept: string;
  os: string;
  agent: string;
  status: string;
  threats: number;
  seen: string;
}

export interface ReportType {
  key: string;
  icon: string;
  label: string;
  desc: string;
}

// ---------- Catalogue des types de signalement ----------

export const typeDefs: ReportType[] = [
  {
    key: 'terrorism',
    icon: '🛑',
    label: 'Terrorisme / Violence armée',
    desc: "Recrutement, propagande, menace d'attaque",
  },
  {
    key: 'hate',
    icon: '⚠️',
    label: 'Discours de haine',
    desc: 'Incitation ethnique, religieuse ou régionale',
  },
  {
    key: 'fake',
    icon: '📰',
    label: 'Fausse information',
    desc: 'Rumeur, manipulation, désinformation',
  },
  {
    key: 'cyber',
    icon: '🖥️',
    label: 'Cyberattaque',
    desc: 'Phishing, fraude, piratage',
  },
  {
    key: 'other',
    icon: '🚩',
    label: 'Autre menace',
    desc: 'Tout autre contenu préoccupant',
  },
];

export const regionNames = [
  'Adamaoua',
  'Centre',
  'Est',
  'Extrême-Nord',
  'Littoral',
  'Nord',
  'Nord-Ouest',
  'Ouest',
  'Sud',
  'Sud-Ouest',
];

// ---------- Flux temps réel ----------

export const initFeed: FeedItem[] = [
  { id: 147, level: 'CRITICAL', text: 'Recrutement armé détecté', platform: 'Telegram', place: 'Mora, Extrême-Nord', score: 0.91, time: '14:32' },
  { id: 146, level: 'HIGH', text: 'Discours de haine ethnique viral', platform: 'Facebook', place: 'Bamenda, Nord-Ouest', score: 0.79, time: '14:28' },
  { id: 145, level: 'MEDIUM', text: 'Fausse information sanitaire', platform: 'Twitter / X', place: 'Douala, Littoral', score: 0.61, time: '14:15' },
  { id: 144, level: 'HIGH', text: 'Propagande séparatiste', platform: 'YouTube', place: 'Buea, Sud-Ouest', score: 0.74, time: '14:03' },
  { id: 143, level: 'LOW', text: 'Appel à manifestation', platform: 'Facebook', place: 'Yaoundé, Centre', score: 0.48, time: '13:58' },
  { id: 142, level: 'MEDIUM', text: 'Rumeur amplifiée — délestage', platform: 'WhatsApp', place: 'Bafoussam, Ouest', score: 0.55, time: '13:41' },
];

/** Pool d'événements injectés aléatoirement dans le flux live. */
export const feedPool: Omit<FeedItem, 'id' | 'time'>[] = [
  { level: 'CRITICAL', text: "Planification d'attaque évoquée", platform: 'Telegram', place: 'Kousséri, Extrême-Nord', score: 0.88 },
  { level: 'HIGH', text: 'Appel à la violence communautaire', platform: 'Facebook', place: 'Kumba, Sud-Ouest', score: 0.76 },
  { level: 'MEDIUM', text: 'Campagne de désinformation politique', platform: 'Facebook', place: 'Yaoundé, Centre', score: 0.58 },
  { level: 'INFO', text: 'Pic de mentions #Cameroun', platform: 'Twitter / X', place: 'National', score: 0.4 },
  { level: 'HIGH', text: 'Recrutement jihadiste en fulfuldé', platform: 'Telegram', place: 'Maroua, Extrême-Nord', score: 0.83 },
  { level: 'LOW', text: 'Contenu satirique signalé', platform: 'TikTok', place: 'Douala, Littoral', score: 0.46 },
  { level: 'MEDIUM', text: 'Faux compte institutionnel', platform: 'Facebook', place: 'Garoua, Nord', score: 0.62 },
  { level: 'MEDIUM', text: "Campagne d'influence diaspora", platform: 'LinkedIn', place: 'National', score: 0.57 },
  { level: 'HIGH', text: 'Recrutement déguisé en offre d\'emploi', platform: 'LinkedIn', place: 'Douala, Littoral', score: 0.72 },
];

// ---------- Carte des régions ----------

export const regionsRaw: RegionRaw[] = [
  { name: 'Extrême-Nord', short: 'EXT-N', level: 'CRITICAL', score: '0.88', threat: 'Terrorisme', gc: 3, gr: 1 },
  { name: 'Nord', short: 'NORD', level: 'MEDIUM', score: '0.42', threat: 'Surveillance active', gc: 3, gr: 2 },
  { name: 'Adamaoua', short: 'ADAM', level: 'LOW', score: '0.28', threat: 'Situation calme', gc: 3, gr: 3 },
  { name: 'Nord-Ouest', short: 'N-O', level: 'HIGH', score: '0.74', threat: 'Tension séparatiste', gc: 1, gr: 4 },
  { name: 'Ouest', short: 'OUEST', level: 'LOW', score: '0.35', threat: 'Situation calme', gc: 2, gr: 4 },
  { name: 'Centre', short: 'CENTRE', level: 'MEDIUM', score: '0.49', threat: 'Campagnes politiques', gc: 3, gr: 4 },
  { name: 'Est', short: 'EST', level: 'INFO', score: '0.18', threat: 'Situation calme', gc: 4, gr: 4 },
  { name: 'Sud-Ouest', short: 'S-O', level: 'HIGH', score: '0.71', threat: 'Tension séparatiste', gc: 1, gr: 5 },
  { name: 'Littoral', short: 'LITT', level: 'MEDIUM', score: '0.58', threat: 'Désinformation', gc: 2, gr: 5 },
  { name: 'Sud', short: 'SUD', level: 'INFO', score: '0.15', threat: 'Situation calme', gc: 2, gr: 6 },
];

// ---------- KPIs ----------

export const kpis = [
  { value: '103 247', label: 'Contenus analysés · 24 h' },
  { value: '847', label: 'Menaces détectées' },
  { value: '53', label: 'Alertes émises' },
  { value: '14 %', label: 'Faux positifs' },
  { value: '12 h', label: 'Anticipation moy.' },
  { value: '8', label: 'Sources surveillées' },
];

// ---------- Alertes actives ----------

export const alertCountsRaw: [Level, number][] = [
  ['CRITICAL', 2],
  ['HIGH', 8],
  ['MEDIUM', 17],
  ['LOW', 26],
];

// ---------- Tendances ----------

export const trendingRaw: [string, number][] = [
  ['#Maroua', 8.7],
  ['#BokoHaram', 7.2],
  ['#Crise_NO', 6.8],
  ['#Élections', 5.1],
  ['#Douala', 4.9],
];

// ---------- Volumes par plateforme ----------

export const volumesRaw: [string, number][] = [
  ['Facebook', 34200],
  ['Twitter / X', 21500],
  ['Telegram', 12800],
  ['LinkedIn', 9400],
  ['Presse', 6200],
  ['YouTube', 3100],
];

// ---------- Acteurs menaçants ----------

export const threatActorsRaw: ThreatActorRaw[] = [
  { code: 'TA-0012', name: 'Réseau Nord — recrutement', type: 'Groupe armé non-étatique', level: 'CRITICAL', platforms: 'Telegram, Facebook', incidents: 23, accounts: 7, first: '2024-03-15', last: '2026-06-20' },
  { code: 'TA-0027', name: 'Cellule désinformation diaspora', type: 'Réseau coordonné', level: 'HIGH', platforms: 'Facebook, X', incidents: 41, accounts: 18, first: '2023-11-02', last: '2026-06-21' },
  { code: 'TA-0033', name: 'Faux comptes amplification', type: 'Botnet local', level: 'MEDIUM', platforms: 'X, TikTok', incidents: 67, accounts: 120, first: '2025-01-20', last: '2026-06-19' },
  { code: 'TA-0009', name: 'Propagande NOSO', type: 'Mouvement séparatiste', level: 'HIGH', platforms: 'YouTube, Telegram', incidents: 54, accounts: 31, first: '2022-08-11', last: '2026-06-18' },
];

// ---------- Signalements citoyens ----------

export const statusCol: Record<string, string> = {
  Nouveau: '#3b82f6',
  'En cours': '#eab308',
  Escaladé: '#ef4444',
  Validé: '#16a34a',
  'Faux signalement': '#76828f',
};

export const citizenReportsRaw: CitizenReportRaw[] = [
  { ref: 'SGN-2026-08472', type: 'Discours de haine', region: 'Nord-Ouest', status: 'En cours', sla: '2 h restantes', time: 'il y a 22 min' },
  { ref: 'SGN-2026-08471', type: 'Fausse information', region: 'Littoral', status: 'Nouveau', sla: '24 h', time: 'il y a 38 min' },
  { ref: 'SGN-2026-08470', type: 'Terrorisme', region: 'Extrême-Nord', status: 'Escaladé', sla: 'CRITICAL', time: 'il y a 1 h' },
  { ref: 'SGN-2026-08469', type: 'Cyberattaque', region: 'Centre', status: 'Validé', sla: '—', time: 'il y a 2 h' },
  { ref: 'SGN-2026-08468', type: 'Autre menace', region: 'Sud-Ouest', status: 'Faux signalement', sla: '—', time: 'il y a 3 h' },
];

// ---------- Endpoints (EDR) ----------

export const epStatusCol: Record<string, string> = {
  'En ligne': '#16a34a',
  Alerte: '#f97316',
  'Hors ligne': '#76828f',
  Isolé: '#ef4444',
};

export const endpointsRaw: EndpointRaw[] = [
  { host: 'SRV-COLLECT-01', dept: 'Collecte', os: 'Ubuntu 22.04', agent: '4.2.1', status: 'En ligne', threats: 0, seen: 'il y a 12 s' },
  { host: 'SRV-NLP-02', dept: 'IA & NLP', os: 'Ubuntu 22.04', agent: '4.2.1', status: 'En ligne', threats: 0, seen: 'il y a 8 s' },
  { host: 'WS-ANALYSTE-07', dept: 'Analyse', os: 'Windows 11', agent: '4.1.9', status: 'Alerte', threats: 2, seen: 'il y a 3 s' },
  { host: 'SRV-KAFKA-01', dept: 'Ingestion', os: 'Ubuntu 22.04', agent: '4.2.1', status: 'En ligne', threats: 0, seen: 'il y a 5 s' },
  { host: 'WS-ANALYSTE-03', dept: 'Analyse', os: 'Windows 11', agent: '4.0.2', status: 'Hors ligne', threats: 0, seen: 'il y a 2 h' },
  { host: 'SRV-DB-PG01', dept: 'Stockage', os: 'Ubuntu 22.04', agent: '4.2.1', status: 'En ligne', threats: 0, seen: 'il y a 9 s' },
  { host: 'WS-ANALYSTE-11', dept: 'Analyse', os: 'Windows 11', agent: '4.1.9', status: 'Isolé', threats: 1, seen: 'il y a 1 min' },
  { host: 'SRV-DASH-01', dept: 'Visualisation', os: 'Ubuntu 22.04', agent: '4.2.1', status: 'En ligne', threats: 0, seen: 'il y a 4 s' },
];
