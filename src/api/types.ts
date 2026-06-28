export interface ApiUser {
  id: number;
  email: string;
  name: string;
  role: string;
  department: string;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
  permissions: string[];
}

export interface PlatformInfo {
  platform: string;
  live: boolean;
}

export interface ScanJob {
  id: number;
  status: 'pending' | 'running' | 'done' | 'error';
  platforms: string[];
  region: string;
  requested_by: string;
  collected: number;
  threats: number;
  alerts: number;
  error: string;
  started_at: string;
  finished_at: string | null;
}

export interface ApiContent {
  id: number;
  platform: string;
  author: string;
  text: string;
  lang: string;
  region: string;
  city: string;
  threat_category: string;
  threat_subcategory: string;
  threat_score: number;
  sentiment: string;
  source_url: string;
  collected_at: string;
}

export interface ApiAlert {
  id: number;
  number: string;
  level: string;
  threat_type: string;
  title: string;
  platform: string;
  region: string;
  place: string;
  score: number;
  status: string;
  assigned: string;
  created_at: string;
}

export interface HeatRegion {
  region: string;
  risk_score: number;
  threat_level: string;
  threat_count: number;
  dominant_threat: string | null;
}

export interface Overview {
  analyzed: number;
  threats: number;
  alerts: number;
  by_platform: { platform: string; count: number }[];
  by_category: { category: string; key: string; count: number }[];
}

export interface RoleOption {
  key: string;
  label: string;
}

// Signalement (Citizen Reports) Types
export interface ApiSignalement {
  id: number;
  ref: string;
  type: string;
  threat_category: string;
  threat_subcategory?: string;
  gravity: 'Faible' | 'Modéré' | 'Grave' | 'Critique';
  region: string;
  status: 'Nouveau' | 'Analyse' | 'Decision' | 'Escalade' | 'Transmitted';
  assigned_to?: string;
  assigned_analyst_id?: number;
  created_at: string;
  due_at: string;
  notes?: string;
  decision?: string;
  decision_reason?: string;
  decision_authority?: string;
  escalation_reason?: string;
  escalation_comment?: string;
  escalated_by?: string;
  escalated_at?: string;
  geolocation?: string;
  evidence_files?: string[];
  related_links?: string[];
}

export interface SignalementHistory {
  id: number;
  signalement_id: number;
  actor: string;
  action: string;
  timestamp: string;
  notes?: string;
}

export interface SignalementDecision {
  signalement_id: number;
  threat_category: string;
  threat_subcategory: string;
  gravity: string;
  notes: string;
  decision: 'Validé' | 'Rejeté' | 'Escalade';
  decision_reason: string;
  decision_authority?: string;
  escalation_comment?: string;
  geolocation?: string;
  evidence_files?: string[];
  related_links?: string[];
}
