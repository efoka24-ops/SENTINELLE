import type { Level } from '../theme';

// =====================================================================
// MODULE 1 — SENTINELLE COLLECT (connecteurs + forensic d'ingestion)
// =====================================================================

export type CollectorStatus = 'online' | 'degraded' | 'offline';

export interface Collector {
  platform: string;
  method: string;
  frequency: string;
  topic: string;
  status: CollectorStatus;
  perMin: number; // items / minute
  today: number; // items collectés aujourd'hui
  last: string; // dernier item reçu
  dedup: number; // % de doublons écartés
}

export const collectors: Collector[] = [
  { platform: 'Facebook', method: 'Graph API + Playwright', frequency: '5 min', topic: 'raw.facebook.posts', status: 'online', perMin: 142, today: 34200, last: 'il y a 3 s', dedup: 18 },
  { platform: 'Twitter / X', method: 'API v2 Filtered Stream', frequency: 'streaming', topic: 'raw.twitter.tweets', status: 'online', perMin: 98, today: 21500, last: 'il y a 1 s', dedup: 24 },
  { platform: 'Telegram', method: 'Telethon · MTProto', frequency: 'temps réel', topic: 'raw.telegram.messages', status: 'online', perMin: 64, today: 12800, last: 'il y a 2 s', dedup: 11 },
  { platform: 'LinkedIn', method: 'API + scraping ciblé', frequency: '15 min', topic: 'raw.linkedin.posts', status: 'online', perMin: 21, today: 9400, last: 'il y a 12 s', dedup: 9 },
  { platform: 'YouTube', method: 'Data API v3', frequency: '30 min', topic: 'raw.youtube.contents', status: 'online', perMin: 8, today: 3100, last: 'il y a 41 s', dedup: 6 },
  { platform: 'TikTok', method: 'Research API', frequency: '10 min', topic: 'raw.tiktok.contents', status: 'degraded', perMin: 4, today: 1800, last: 'il y a 2 min', dedup: 14 },
  { platform: 'Instagram', method: 'Graph API', frequency: '15 min', topic: 'raw.instagram.posts', status: 'online', perMin: 12, today: 2600, last: 'il y a 18 s', dedup: 13 },
  { platform: 'Presse', method: 'Scrapy + RSS (15 médias)', frequency: '5 min', topic: 'raw.press.articles', status: 'online', perMin: 3, today: 6200, last: 'il y a 26 s', dedup: 4 },
  { platform: 'WhatsApp', method: 'Canaux publics', frequency: 'temps réel', topic: 'raw.whatsapp.public', status: 'offline', perMin: 0, today: 0, last: '—', dedup: 0 },
];

/** Flux forensic d'ingestion brute (avant normalisation Kafka). */
export interface ForensicItem {
  id: number;
  platform: string;
  handle: string;
  snippet: string;
  hash: string;
  stage: 'collected' | 'normalized' | 'queued';
  time: string;
}

export const forensicSeed: ForensicItem[] = [
  { id: 9001, platform: 'Telegram', handle: '@canal_nord_actu', snippet: 'Rassemblement prévu demain matin à…', hash: '9f3a1c', stage: 'normalized', time: '14:32:07' },
  { id: 9002, platform: 'LinkedIn', handle: 'recrutement-pro-237', snippet: 'Opportunité urgente, postes à pourvoir dans le…', hash: 'b27e44', stage: 'queued', time: '14:32:04' },
  { id: 9003, platform: 'Twitter / X', handle: '@infos_cmr', snippet: '#Cameroun la situation à Bamenda devient…', hash: '1a8d90', stage: 'collected', time: '14:32:02' },
  { id: 9004, platform: 'Facebook', handle: 'Page Sécurité 237', snippet: 'Partage massif d\'une vidéo non vérifiée…', hash: '77c0e1', stage: 'normalized', time: '14:31:58' },
  { id: 9005, platform: 'YouTube', handle: 'Chaîne Actu CMR', snippet: 'Reportage : tensions dans le Sud-Ouest…', hash: '3e55ab', stage: 'normalized', time: '14:31:50' },
  { id: 9006, platform: 'LinkedIn', handle: 'diaspora-network', snippet: 'Article d\'opinion partagé 340 fois en 1h…', hash: 'c91f02', stage: 'collected', time: '14:31:44' },
  { id: 9007, platform: 'Instagram', handle: 'story_237', snippet: 'Story relayant un appel à manifestation…', hash: 'd14b7e', stage: 'queued', time: '14:31:39' },
];

/** Items injectés dans le flux forensic en temps réel. */
export const forensicPool: Omit<ForensicItem, 'id' | 'time'>[] = [
  { platform: 'Telegram', handle: '@veille_extreme_nord', snippet: 'Message en fulfuldé évoquant un déplacement…', hash: '00aa11', stage: 'collected' },
  { platform: 'LinkedIn', handle: 'talent-acquisition-cm', snippet: 'Offre suspecte ciblant de jeunes diplômés…', hash: '5b6c7d', stage: 'collected' },
  { platform: 'Twitter / X', handle: '@buzz_237', snippet: 'Hashtag en forte progression depuis 20 min…', hash: 'ee44ff', stage: 'queued' },
  { platform: 'Facebook', handle: 'Groupe public Douala', snippet: 'Rumeur économique partagée en boucle…', hash: '2c3d4e', stage: 'normalized' },
  { platform: 'YouTube', handle: 'Live Politique', snippet: 'Direct avec propos à caractère séparatiste…', hash: '8f9a0b', stage: 'collected' },
  { platform: 'TikTok', handle: 'clip_viral_cmr', snippet: 'Montage vidéo détourné, audio modifié…', hash: 'a1b2c3', stage: 'queued' },
];

export const collectKpis = [
  { value: '8 / 9', label: 'Connecteurs en ligne', accent: '#16a34a' },
  { value: '352', label: 'Items / minute', accent: '#2dd4bf' },
  { value: '103 247', label: 'Collectés · 24 h', accent: '#e6edf3' },
  { value: '16 %', label: 'Doublons écartés', accent: '#eab308' },
];

/** Étapes du pipeline de normalisation (ContentNormalizer → Kafka). */
export const normalizerStages = [
  { name: 'Extraction', detail: 'id · url · auteur', ok: true },
  { name: 'Texte & médias', detail: 'content_raw · media_urls', ok: true },
  { name: 'Hash dédup', detail: 'sha256(content)', ok: true },
  { name: 'Engagement', detail: 'likes · shares · comments', ok: true },
  { name: 'Publication Kafka', detail: 'raw.*', ok: true },
];

// =====================================================================
// MODULE 2 — SENTINELLE ANALYSE (Moteur IA)
// =====================================================================

export const aiPipeline = [
  { step: 'Détection langue', model: 'fastText lid.176', perMin: 352, ok: true },
  { step: 'Traduction', model: 'opus-mt → fr', perMin: 88, ok: true },
  { step: 'Classification', model: 'CamemBERT fine-tuné', perMin: 352, ok: true },
  { step: 'Score sévérité', model: 'régression', perMin: 352, ok: true },
  { step: 'Sentiment', model: 'CamemBERT-sent', perMin: 352, ok: true },
  { step: 'Entités (NER)', model: 'spaCy fr/en', perMin: 352, ok: true },
  { step: 'Géolocalisation', model: 'gazetier CMR', perMin: 352, ok: true },
  { step: 'Embedding', model: 'sentence-transformers', perMin: 352, ok: true },
];

export const classificationDist: { category: string; label: string; count: number; level: Level }[] = [
  { category: 'terrorism', label: 'Terrorisme & violence armée', count: 234, level: 'CRITICAL' },
  { category: 'hate_speech', label: 'Discours de haine', count: 198, level: 'HIGH' },
  { category: 'disinformation', label: 'Désinformation', count: 187, level: 'MEDIUM' },
  { category: 'insurrection', label: "Appels à l'insurrection", count: 112, level: 'HIGH' },
  { category: 'foreign_interference', label: 'Ingérence étrangère', count: 67, level: 'MEDIUM' },
  { category: 'cybersecurity', label: 'Cybersécurité', count: 49, level: 'HIGH' },
];

export const nerEntities = [
  { type: 'LOCATION', label: 'Lieux', count: 4821 },
  { type: 'PERSON', label: 'Personnes', count: 2940 },
  { type: 'ORGANIZATION', label: 'Organisations', count: 1733 },
  { type: 'EVENT', label: 'Événements', count: 612 },
  { type: 'IDEOLOGY', label: 'Idéologies', count: 188 },
  { type: 'WEAPON', label: 'Armes', count: 74 },
];

export const languagesDetected: [string, number][] = [
  ['Français', 58],
  ['Anglais', 21],
  ['Pidgin', 9],
  ['Fulfuldé', 7],
  ['Arabe', 3],
  ['Haoussa', 2],
];

export const aiModels = [
  { name: 'camembert-threat-v1.3', task: 'Classification', precision: 85, recall: 80, f1: 82, active: true },
  { name: 'xlm-roberta-large', task: 'Classification multilingue', precision: 81, recall: 77, f1: 79, active: true },
  { name: 'fasttext-lid.176', task: 'Détection langue', precision: 96, recall: 95, f1: 95, active: true },
  { name: 'spacy-ner-fr/en', task: 'Entités nommées', precision: 88, recall: 83, f1: 85, active: true },
  { name: 'mistral-7b-instruct', task: 'Résumés & rapports', precision: 0, recall: 0, f1: 0, active: true },
];

// =====================================================================
// MODULE 5 — SENTINELLE ALERT (moteur de règles + liste)
// =====================================================================

export interface AlertRow {
  number: string;
  level: Level;
  type: string;
  title: string;
  platform: string;
  place: string;
  score: number;
  status: string;
  assigned: string;
  time: string;
}

export const alertStatusCol: Record<string, string> = {
  Ouvert: '#3b82f6',
  'En cours': '#eab308',
  Escaladé: '#ef4444',
  Clôturé: '#16a34a',
};

export const alertsList: AlertRow[] = [
  { number: '2026-06-21-0047', level: 'CRITICAL', type: 'Terrorisme', title: 'Recrutement armé détecté', platform: 'Telegram', place: 'Mora, Extrême-Nord', score: 0.91, status: 'Ouvert', assigned: '—', time: 'il y a 4 min' },
  { number: '2026-06-21-0046', level: 'CRITICAL', type: 'Désinformation', title: 'Fake news attentat Douala', platform: 'Facebook', place: 'Douala, Littoral', score: 0.83, status: 'En cours', assigned: 'P. Ekwalla', time: 'il y a 12 min' },
  { number: '2026-06-21-0045', level: 'HIGH', type: 'Haine', title: 'Discours haine ethnique viral', platform: 'Twitter / X', place: 'Bamenda, Nord-Ouest', score: 0.79, status: 'En cours', assigned: 'K. Djoumessi', time: 'il y a 28 min' },
  { number: '2026-06-21-0044', level: 'HIGH', type: 'Ingérence', title: "Campagne d'influence diaspora", platform: 'LinkedIn', place: 'National', score: 0.74, status: 'Ouvert', assigned: '—', time: 'il y a 41 min' },
  { number: '2026-06-21-0043', level: 'HIGH', type: 'Cybersécurité', title: 'Phishing ciblant l\'ANTIC', platform: 'Presse', place: 'National', score: 0.75, status: 'Ouvert', assigned: '—', time: 'il y a 1 h 12' },
  { number: '2026-06-21-0042', level: 'HIGH', type: 'Insurrection', title: 'Appel insurrection Buea', platform: 'Facebook', place: 'Buea, Sud-Ouest', score: 0.72, status: 'Escaladé', assigned: 'N. Manga', time: 'il y a 2 h' },
  { number: '2026-06-21-0041', level: 'MEDIUM', type: 'Désinformation', title: 'Désinformation électorale', platform: 'Telegram', place: 'Yaoundé, Centre', score: 0.68, status: 'Clôturé', assigned: 'P. Ekwalla', time: 'il y a 3 h' },
];

export interface RuleRow {
  name: string;
  condition: string;
  level: Level;
  channels: string[];
  recipients: string;
  active: boolean;
}

export const alertRules: RuleRow[] = [
  { name: 'high_threat_score', condition: 'score ≥ 0.85', level: 'CRITICAL', channels: ['SMS', 'WhatsApp', 'Push', 'Email'], recipients: 'Cellule de crise', active: true },
  { name: 'terrorism_extreme_nord', condition: 'terrorisme + Extrême-Nord + score ≥ 0.65', level: 'HIGH', channels: ['SMS', 'Email', 'Push'], recipients: 'Équipe sécurité', active: true },
  { name: 'viral_hate_speech', condition: 'haine + partages ≥ 1000 + score ≥ 0.60', level: 'HIGH', channels: ['Email', 'Push'], recipients: 'Équipe analystes', active: true },
  { name: 'linkedin_recruitment', condition: 'LinkedIn + recrutement + score ≥ 0.60', level: 'HIGH', channels: ['Email', 'Push'], recipients: 'Équipe analystes', active: true },
  { name: 'volume_spike', condition: 'volume +200 % en 1 h', level: 'MEDIUM', channels: ['Email'], recipients: 'Chefs d\'équipe', active: false },
];

// =====================================================================
// MODULE 8 — RAPPORTS
// =====================================================================

export interface ReportRow {
  number: string;
  type: string;
  title: string;
  period: string;
  status: string;
  at: string;
}

export const reportsList: ReportRow[] = [
  { number: 'RPT-2026-0089', type: 'Quotidien', title: 'Rapport quotidien — 21 juin 2026', period: '20/06 06h → 21/06 06h', status: 'Validé', at: "Aujourd'hui 06:00" },
  { number: 'RPT-2026-0088', type: 'Quotidien', title: 'Rapport quotidien — 20 juin 2026', period: '19/06 06h → 20/06 06h', status: 'Validé', at: 'Hier 06:00' },
  { number: 'RPT-2026-0087', type: 'Hebdomadaire', title: 'Synthèse hebdomadaire — S25', period: '16/06 → 20/06', status: 'Validé', at: 'Ven. 17:00' },
  { number: 'RPT-2026-0086', type: 'Quotidien', title: 'Rapport quotidien — 19 juin 2026', period: '18/06 06h → 19/06 06h', status: 'Validé', at: '19/06 06:00' },
  { number: 'RPT-2026-0085', type: 'Mensuel', title: 'Bilan mensuel — Mai 2026', period: '01/05 → 31/05', status: 'Publié', at: '01/06 09:00' },
];

export const dailyReport = {
  level: 'HIGH' as Level,
  trend: 'Stable par rapport à hier',
  figures: [
    ['103 247', 'Contenus analysés'],
    ['847', 'Menaces détectées'],
    ['53', 'Alertes émises'],
    ['12 (14 %)', 'Faux positifs'],
  ],
  topThreats: [
    'Recrutement armé — Telegram — Mora (EN) — 0.91',
    'Fake news attentat — Facebook — Douala — 0.83',
    'Haine ethnique — Twitter / X — Bamenda — 0.79',
    "Campagne d'influence — LinkedIn — National — 0.74",
    'Phishing institutionnel — Web — National — 0.75',
  ],
  recommendations: [
    'Renforcer la surveillance Extrême-Nord (canaux Telegram en fulfuldé).',
    'Fact-check urgent sur la fake news « attentat Douala » (viralité ×4).',
    'Signalement à Meta + LinkedIn des comptes de recrutement déguisé.',
  ],
};

// =====================================================================
// MODULE 11 — AUDIT & CONFORMITÉ (journal immuable)
// =====================================================================

export interface AuditRow {
  time: string;
  user: string;
  role: string;
  action: string;
  target: string;
}

export const auditStats = [
  { value: '12', label: 'Analystes actifs' },
  { value: '14 872', label: 'Actions tracées · mois' },
  { value: '47', label: 'Transmissions hiérarchie' },
  { value: '0', label: 'Anomalies détectées' },
];

export const auditLog: AuditRow[] = [
  { time: '21/06 14:35:12', user: 'K. Djoumessi', role: 'Analyste sr', action: 'ALERT_OPENED', target: '#2026-06-21-0047' },
  { time: '21/06 14:33:05', user: 'Système', role: '—', action: 'ALERT_CREATED', target: '#2026-06-21-0047' },
  { time: '21/06 14:28:43', user: 'P. Ekwalla', role: 'Analyste sr', action: 'ALERT_VALIDATED', target: '#2026-06-21-0046' },
  { time: '21/06 14:25:11', user: 'P. Ekwalla', role: 'Analyste sr', action: 'REPORT_GENERATED', target: 'RPT-2026-0089' },
  { time: '21/06 14:20:07', user: 'K. Djoumessi', role: 'Analyste sr', action: 'CONTENT_VIEWED', target: 'CNT-9821' },
  { time: '21/06 14:18:33', user: 'N. Manga', role: 'Analyste jr', action: 'ALERT_ESCALATED', target: '#2026-06-21-0042' },
  { time: '21/06 14:12:09', user: 'Système', role: '—', action: 'PLATFORM_REPORT_SENT', target: 'LinkedIn · compte recrutement' },
  { time: '21/06 14:10:22', user: 'P. Ekwalla', role: 'Analyste sr', action: 'CONTENT_SEARCHED', target: '"mora"' },
];
