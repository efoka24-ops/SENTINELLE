import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  ApiAlert,
  ApiContent,
  ApiUser,
  HeatRegion,
  LoginResponse,
  Overview,
  PlatformInfo,
  RoleOption,
  ScanJob,
  ApiSignalement,
  SignalementHistory,
  SignalementDecision,
} from './types';

// ---- Auth ----
export function useLoginMutation() {
  return useMutation({
    mutationFn: async (vars: { email: string; password: string; otp?: string }) => {
      const { data } = await api.post<LoginResponse>('/auth/login', vars);
      return data;
    },
  });
}

export interface RequestCodeResult {
  sent: boolean;
  dev_mode: boolean;
  dev_code?: string;
  name?: string;
  detail?: string;
}

export function useRequestCode() {
  return useMutation({
    mutationFn: async (vars: { email: string }) =>
      (await api.post<RequestCodeResult>('/auth/request-code', vars)).data,
  });
}

export function useVerifyCode() {
  return useMutation({
    mutationFn: async (vars: { email: string; code: string }) =>
      (await api.post<LoginResponse>('/auth/verify-code', vars)).data,
  });
}

// ---- Scans ----
export function usePlatforms(enabled = true) {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: async () => (await api.get<PlatformInfo[]>('/scans/platforms')).data,
    enabled,
  });
}

export function useScans(enabled = true) {
  return useQuery({
    queryKey: ['scans'],
    queryFn: async () => (await api.get<ScanJob[]>('/scans')).data,
    enabled,
    refetchInterval: 4000,
  });
}

export function useScan(id: number | null) {
  return useQuery({
    queryKey: ['scan', id],
    queryFn: async () => (await api.get<ScanJob>(`/scans/${id}`)).data,
    enabled: id != null,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === 'done' || s === 'error' ? false : 2000;
    },
  });
}

export function useLaunchScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { platforms: string[]; region: string; keywords: string[]; targets?: string[]; objective: string; limit: number }) =>
      (await api.post<ScanJob>('/scans', vars)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

// ---- Notifications & rapports ----
export interface NotifyVars {
  content_id?: number;
  channel: string;
  target: string;
  level: string;
  platform?: string;
  author?: string;
  post_url?: string;
  evidence_text?: string;
  evidence_time?: string;
  threat_type?: string;
}

export function useNotify() {
  return useMutation({
    mutationFn: async (vars: NotifyVars) =>
      (await api.post<{ id: number; status: string; message: string; email_active: boolean }>('/notify', vars)).data,
  });
}

export interface ReportVars {
  title: string;
  type: string;
  recipients: string[];
  email: boolean;
  schedule: string;
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: async (vars: ReportVars) =>
      (await api.post<{ number: string; title: string; body_md: string; emailed: boolean; email_active: boolean; scheduled: boolean }>('/reports/generate', vars)).data,
  });
}

// ---- Données ----
export function useContents(params: Record<string, string | number | undefined> = {}, enabled = true) {
  return useQuery({
    queryKey: ['contents', params],
    queryFn: async () => (await api.get<ApiContent[]>('/contents', { params })).data,
    enabled,
    refetchInterval: 5000,
  });
}

export function useAlerts(enabled = true) {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => (await api.get<ApiAlert[]>('/alerts')).data,
    enabled,
    refetchInterval: 5000,
  });
}

export function useHeatmap(enabled = true) {
  return useQuery({
    queryKey: ['heatmap'],
    queryFn: async () => (await api.get<HeatRegion[]>('/map/heatmap')).data,
    enabled,
    refetchInterval: 8000,
  });
}

export function useOverview(enabled = true) {
  return useQuery({
    queryKey: ['overview'],
    queryFn: async () => (await api.get<Overview>('/stats/overview')).data,
    enabled,
    refetchInterval: 6000,
  });
}

export interface CibCluster {
  signature: string;
  sample: string;
  size: number;
  authors: string[];
  author_count: number;
  platforms: string[];
  dominant_category: string;
  score: number;
  level: string;
}

export function useCib(enabled = true) {
  return useQuery({
    queryKey: ['cib'],
    queryFn: async () => (await api.get<CibCluster[]>('/intel/cib')).data,
    enabled,
    refetchInterval: 10000,
  });
}

export interface FlaggedAuthor {
  author: string;
  platform: string;
  posts: number;
  max_score: number;
}

export function useFlaggedAuthors(category?: string, enabled = true) {
  return useQuery({
    queryKey: ['flagged-authors', category ?? 'all'],
    queryFn: async () =>
      (await api.get<FlaggedAuthor[]>('/intel/flagged-authors', { params: category ? { category } : {} })).data,
    enabled,
    refetchInterval: 8000,
  });
}

export function useThreatActors(enabled = true) {
  return useQuery({
    queryKey: ['threat-actors'],
    queryFn: async () => (await api.get('/threat-actors')).data as {
      code: string; name: string; type: string; level: string; platforms: string;
      incidents: number; accounts: number; first: string; last: string;
    }[],
    enabled,
  });
}

export function useAuditLogs(enabled = true) {
  return useQuery({
    queryKey: ['audit'],
    queryFn: async () => (await api.get('/audit/logs')).data as {
      time: string; user: string; role: string; action: string; target: string;
    }[],
    enabled,
  });
}

export function useCitizenReports(enabled = true) {
  return useQuery({
    queryKey: ['citizen'],
    queryFn: async () => (await api.get('/citizen-reports')).data as {
      ref: string; type: string; region: string; status: string; time: string;
    }[],
    enabled,
  });
}

// ---- Utilisateurs (RBAC) ----
export function useUsers(enabled = true) {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<ApiUser[]>('/users')).data,
    enabled,
  });
}

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<RoleOption[]>('/meta/roles')).data,
    enabled,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { email: string; name: string; password: string; role: string; department: string }) =>
      (await api.post<ApiUser>('/users', vars)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: number; name?: string; role?: string; department?: string; password?: string }) =>
      (await api.patch<ApiUser>(`/users/${id}`, patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) =>
      (await api.patch<ApiUser>(`/users/${id}/status`, null, { params: { active } })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

// ---- Alertes (actions opérationnelles) ----
export function useUpdateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: number; status?: string; assigned?: string }) =>
      (await api.patch<ApiAlert>(`/alerts/${id}`, patch)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });
}

// ---- Signalements (Citizen Reports) ----
export function useSignalements(filter?: Record<string, string | number | undefined>, limit = 100, enabled = true) {
  return useQuery({
    queryKey: ['signalements', filter ?? {}],
    queryFn: async () => (await api.get<ApiSignalement[]>('/signalements', { params: { limit, ...filter } })).data,
    enabled,
    refetchInterval: 5000,
  });
}

export function useSignalement(id: number | null) {
  return useQuery({
    queryKey: ['signalement', id],
    queryFn: async () => (await api.get<ApiSignalement>(`/signalements/${id}`)).data,
    enabled: id != null,
  });
}

export function useSignalementHistory(signalementId: number | null) {
  return useQuery({
    queryKey: ['signalement-history', signalementId],
    queryFn: async () => (await api.get<SignalementHistory[]>(`/signalements/${signalementId}/history`)).data,
    enabled: signalementId != null,
  });
}

export function useDecideSignalement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: SignalementDecision) =>
      (await api.post<ApiSignalement>('/signalements/decide', vars)).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['signalements'] });
      qc.invalidateQueries({ queryKey: ['signalement', data.id] });
    },
  });
}

export function useEscalateSignalement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, escalation_comment }: { id: number; escalation_comment: string }) =>
      (await api.patch<ApiSignalement>(`/signalements/${id}/escalate`, { escalation_comment })).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['signalements'] });
      qc.invalidateQueries({ queryKey: ['signalement', data.id] });
    },
  });
}

export function useReassignSignalement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assigned_analyst_id }: { id: number; assigned_analyst_id: number }) =>
      (await api.patch<ApiSignalement>(`/signalements/${id}/assign`, { assigned_analyst_id })).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['signalements'] });
      qc.invalidateQueries({ queryKey: ['signalement', data.id] });
    },
  });
}

// ---- Notifications ----
export interface Notification {
  id: number;
  ts: string;
  channel: string;
  target: string;
  level: string;
  platform: string;
  author: string;
  threat_type: string;
  notification_type: string;
  message: string;
  status: string;
  is_read: boolean;
  signalement_ref: string | null;
}

export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<Notification[]>('/notifications', { params: { limit } })).data,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notifId: number) =>
      (await api.patch(`/notifications/${notifId}/read`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
