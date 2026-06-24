import { useState } from 'react';
import { colors, MONO } from '../../../theme';
import { Hov } from '../../../lib/Hoverable';
import { Panel, ViewHeader } from '../ui';
import { useUsers, useRoles, useCreateUser } from '../../../api/hooks';

const ROLE_COL: Record<string, string> = {
  admin: '#dc2626',
  director: '#ea580c',
  chief: '#ca8a04',
  analyst_sr: '#0a7d3c',
  analyst_jr: '#2563eb',
  auditor: '#7c3aed',
};

const GRID = '1.6fr 1.4fr 1fr 1fr .7fr';

export function UsersView() {
  const users = useUsers();
  const roles = useRoles();
  const create = useCreateUser();
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'analyst_jr', department: '' });
  const [msg, setMsg] = useState('');

  const submit = async () => {
    setMsg('');
    try {
      await create.mutateAsync(form);
      setForm({ email: '', name: '', password: '', role: 'analyst_jr', department: '' });
      setMsg('✓ Utilisateur créé.');
    } catch (e) {
      const ex = e as { response?: { data?: { detail?: string } } };
      setMsg(ex.response?.data?.detail ?? 'Backend injoignable (port 8077).');
    }
  };

  const field: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 8, background: '#f7f8f6',
    border: `1px solid ${colors.border}`, color: colors.text, fontSize: 12.5, outline: 'none', marginTop: 6,
  };
  const label: React.CSSProperties = { fontSize: 11, color: colors.muted2, fontWeight: 600 };

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
      <ViewHeader
        title="Utilisateurs & accès"
        sub="Gestion des accréditations (RBAC) — chaque rôle ne voit que ses modules"
        right={<span style={{ fontSize: 11, color: colors.muted, fontFamily: MONO }}>{users.data?.length ?? 0} COMPTES</span>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        {/* Liste */}
        <Panel title="Comptes & rôles" accent={colors.cyan} bodyStyle={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
            <span>Nom / e-mail</span><span>Service</span><span>Rôle</span><span>Statut</span><span>ID</span>
          </div>
          {users.isError && (
            <div style={{ padding: 16, fontSize: 12, color: colors.muted2 }}>
              API injoignable. Démarrez le backend pour gérer les comptes :
              <span style={{ fontFamily: MONO, color: colors.cyan }}> uvicorn app.main:app --port 8077</span>
            </div>
          )}
          {users.data?.map((u) => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '12px 16px', borderBottom: '1px solid #eceee9', alignItems: 'center', fontSize: 12.5 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: colors.text2 }}>{u.name}</div>
                <div style={{ fontSize: 10.5, color: '#7a857b', fontFamily: MONO }}>{u.email}</div>
              </div>
              <span style={{ color: colors.muted }}>{u.department || '—'}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: ROLE_COL[u.role] ?? colors.muted, border: `1px solid ${ROLE_COL[u.role] ?? colors.muted}`, borderRadius: 4, padding: '2px 6px', justifySelf: 'start' }}>{u.role}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: u.is_active ? '#16a34a' : colors.muted3 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.is_active ? '#16a34a' : colors.muted3 }} />
                {u.is_active ? 'Actif' : 'Inactif'}
              </span>
              <span style={{ fontFamily: MONO, color: colors.muted3 }}>#{u.id}</span>
            </div>
          ))}
        </Panel>

        {/* Création */}
        <Panel title="Créer un compte" accent={colors.gold}>
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
            {(roles.data ?? [
              { key: 'analyst_jr', label: 'Analyste junior' },
              { key: 'analyst_sr', label: 'Analyste senior' },
              { key: 'chief', label: "Chef d'équipe" },
              { key: 'director', label: 'Directeur' },
              { key: 'admin', label: 'Administrateur' },
              { key: 'auditor', label: 'Auditeur (CEC)' },
            ]).map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
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
