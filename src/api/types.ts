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
