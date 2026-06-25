import { useState } from 'react';
import { colors, MONO } from '../../../theme';
import { Hov } from '../../../lib/Hoverable';
import { Panel, ViewHeader } from '../ui';
import { useAuth } from '../../../auth/AuthContext';
import { useUsers, useRoles, useCreateUser, useUpdateUser, useSetUserStatus } from '../../../api/hooks';
import type { ApiUser } from '../../../api/types';

const ROLE_COL: Record<string, string> = {
  admin: '#dc2626',
  director: '#ea580c',
  chief: '#ca8a04',
  analyst_sr: '#0a7d3c',
  analyst_jr: '#2563eb',
  auditor: '#7c3aed',
};

// Définition des rôles : ce que chaque accréditation autorise (aligné sur le RBAC backend).
const ROLE_DEFS: { key: string; label: string; scope: string }[] = [
  { key: 'analyst_jr', label: 'Analyste junior', scope: 'Tableau de bord, carte, alertes (acquittement), renseignement, signalements. Lecture et premier traitement.' },
  { key: 'analyst_sr', label: 'Analyste senior', scope: '+ Collecte, analyse IA, lancement de scans, création/gestion d’alertes, génération de rapports.' },
  { key: 'chief', label: "Chef d'équipe", scope: '+ Système, validation des rapports. Supervise une équipe d’analystes.' },
  { key: 'director', label: 'Directeur', scope: '+ Journal d’audit. Vue complète des opérations et de la conformité.' },
  { key: 'admin', label: 'Administrateur', scope: 'Accès total + gestion des utilisateurs et des accréditations (cette page).' },
  { key: 'auditor', label: 'Auditeur (CEC)', scope: 'Journal d’audit et rapports en lecture seule (Comité d’Éthique et de Contrôle).' },
];

const FALLBACK_ROLES = ROLE_DEFS.map((r) => ({ key: r.key, label: r.label }));
const GRID = '1.9fr 1fr 1.1fr 0.9fr 1.1fr';
const ellip: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 };

export function UsersView() {
  const { user: me } = useAuth();
  const users = useUsers();
  const roles = useRoles();
  const create = useCreateUser();
  const update = useUpdateUser();
  const setStatus = useSetUserStatus();

  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'analyst_jr', department: '' });
  const [msg, setMsg] = useState('');
  const [rowMsg, setRowMsg] = useState('');

  const roleList = roles.data ?? FALLBACK_ROLES;

  const submit = async () => {
    setMsg('');
    try {
      await create.mutateAsync(form);
      setForm({ email: '', name: '', password: '', role: 'analyst_jr', department: '' });
      setMsg('✓ Utilisateur créé.');
    } catch (e) {
      const ex = e as { response?: { data?: { detail?: string } } };
      setMsg(ex.response?.data?.detail ?? 'Backend injoignable (port 8000).');
    }
  };

  const changeRole = async (u: ApiUser, role: string) => {
    setRowMsg('');
    try {
      await update.mutateAsync({ id: u.id, role });
      setRowMsg(`✓ ${u.name} → ${role}`);
    } catch (e) {
      const ex = e as { response?: { data?: { detail?: string } } };
      setRowMsg(ex.response?.data?.detail ?? 'Échec de la modification.');
    }
  };

  const toggleStatus = async (u: ApiUser) => {
    setRowMsg('');
    try {
      await setStatus.mutateAsync({ id: u.id, active: !u.is_active });
      setRowMsg(`✓ ${u.name} ${u.is_active ? 'désactivé' : 'réactivé'}`);
    } catch (e) {
      const ex = e as { response?: { data?: { detail?: string } } };
      setRowMsg(ex.response?.data?.detail ?? 'Action impossible.');
    }
  };

  const resetPassword = async (u: ApiUser) => {
    const pwd = window.prompt(`Nouveau mot de passe pour ${u.name} :`);
    if (!pwd) return;
    setRowMsg('');
    try {
      await update.mutateAsync({ id: u.id, password: pwd });
      setRowMsg(`✓ Mot de passe réinitialisé pour ${u.name}`);
    } catch {
      setRowMsg('Échec de la réinitialisation.');
    }
  };

  const field: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 8, background: '#f7f8f6',
    border: `1px solid ${colors.border}`, color: colors.text, fontSize: 12.5, outline: 'none', marginTop: 6,
  };
  const label: React.CSSProperties = { fontSize: 11, color: colors.muted2, fontWeight: 600 };

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto', minWidth: 0 }}>
      <ViewHeader
        title="Utilisateurs & accès"
        sub="Gestion des accréditations (RBAC) — chaque rôle ne voit que ses modules"
        right={<span style={{ fontSize: 11, color: colors.muted, fontFamily: MONO }}>{users.data?.length ?? 0} COMPTES</span>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(280px,1fr)', gap: 14, alignItems: 'start' }}>
        {/* Liste + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <Panel title="Comptes & rôles" accent={colors.cyan} bodyStyle={{ padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
              <span>Nom / e-mail</span><span>Service</span><span>Rôle</span><span>Statut</span><span>Actions</span>
            </div>
            {users.isError && (
              <div style={{ padding: 16, fontSize: 12, color: colors.muted2 }}>
                API injoignable. Démarrez le backend pour gérer les comptes :
                <span style={{ fontFamily: MONO, color: colors.cyan }}> uvicorn app.main:app --port 8000</span>
              </div>
            )}
            {users.data?.map((u) => {
              const isSelf = me?.email && u.email === me.email;
              return (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '10px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12.5 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...ellip, color: colors.text2 }}>{u.name}{isSelf && <span style={{ color: colors.muted3, fontWeight: 400 }}> · vous</span>}</div>
                    <div style={{ ...ellip, fontSize: 10.5, color: '#7a857b', fontFamily: MONO }}>{u.email}</div>
                  </div>
                  <span style={{ ...ellip, color: colors.muted }}>{u.department || '—'}</span>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value)}
                    style={{ width: '100%', minWidth: 0, fontSize: 11, fontWeight: 700, color: ROLE_COL[u.role] ?? colors.muted, background: '#f7f8f6', border: `1px solid ${colors.border}`, borderRadius: 6, padding: '4px 6px', outline: 'none', cursor: 'pointer' }}
                  >
                    {roleList.map((r) => <option key={r.key} value={r.key} style={{ color: colors.text }}>{r.label}</option>)}
                  </select>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: u.is_active ? '#16a34a' : colors.muted3 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.is_active ? '#16a34a' : colors.muted3, flex: 'none' }} />
                    {u.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  <span style={{ display: 'flex', gap: 6, minWidth: 0 }}>
                    <Hov as="span" onClick={() => resetPassword(u)} base={{ fontSize: 10, fontWeight: 600, color: colors.text3, background: '#eef1ee', border: '1px solid #dfe3de', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', whiteSpace: 'nowrap' }} hover={{ background: colors.border }}>MDP</Hov>
                    {!isSelf && (
                      <Hov as="span" onClick={() => toggleStatus(u)}
                        base={{ fontSize: 10, fontWeight: 600, color: u.is_active ? '#dc2626' : '#16a34a', background: u.is_active ? 'rgba(220,38,38,.08)' : 'rgba(22,163,74,.1)', border: `1px solid ${u.is_active ? 'rgba(220,38,38,.3)' : 'rgba(22,163,74,.3)'}`, borderRadius: 6, padding: '4px 7px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        hover={{ opacity: 0.85 }}>
                        {u.is_active ? 'Désactiver' : 'Activer'}
                      </Hov>
                    )}
                  </span>
                </div>
              );
            })}
            {rowMsg && <div style={{ padding: '10px 16px', fontSize: 11.5, color: rowMsg.startsWith('✓') ? '#16a34a' : '#ea580c' }}>{rowMsg}</div>}
          </Panel>

          {/* Définition des rôles / permissions */}
          <Panel title="Rôles & permissions" accent={colors.green}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLE_DEFS.map((r) => (
                <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ROLE_COL[r.key], border: `1px solid ${ROLE_COL[r.key]}`, borderRadius: 6, padding: '3px 8px', justifySelf: 'start', whiteSpace: 'nowrap' }}>{r.label}</span>
                  <span style={{ fontSize: 12, color: colors.text4, lineHeight: 1.55 }}>{r.scope}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Création */}
        <Panel title="Créer un compte" accent={colors.gold} style={{ position: 'sticky', top: 0 }}>
          <label style={label}>Nom complet</label>
          <input style={field} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Prénom Nom" />
          <label style={{ ...label, display: 'block', marginTop: 12 }}>Adresse e-mail</label>
          <input style={field} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="prenom.nom@sentinelle.cm" />
          <label style={{ ...label, display: 'block', marginTop: 12 }}>Mot de passe</label>
          <input style={field} type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
          <label style={{ ...label, display: 'block', marginTop: 12 }}>Service</label>
          <input style={field} value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} placeholder="Veille sociale" />
          <label style={{ ...label, display: 'block', marginTop: 12 }}>Rôle (accréditation)</label>
          <select style={field} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {roleList.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          {msg && <div style={{ fontSize: 11.5, color: msg.startsWith('✓') ? '#16a34a' : '#ea580c', marginTop: 12 }}>{msg}</div>}
          <Hov
            as="span"
            onClick={form.email && form.name && form.password ? submit : undefined}
            base={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13, fontWeight: 600, color: colors.greenDeep, background: form.email && form.name && form.password ? colors.gold : '#9aa39a', borderRadius: 9, padding: 11, cursor: form.email ? 'pointer' : 'default' }}
            hover={form.email ? { background: colors.goldHover } : {}}
          >
            {create.isPending ? 'Création…' : 'Créer le compte'}
          </Hov>
        </Panel>
      </div>
    </div>
  );
}
