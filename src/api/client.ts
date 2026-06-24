import axios from 'axios';

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:8077/api/v1';

export const api = axios.create({ baseURL: API_URL });

const TOKEN_KEY = 'sentinelle.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null): void {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

/** Télécharge un fichier protégé (PDF) via le token, puis déclenche la sauvegarde. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const resp = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(resp.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
