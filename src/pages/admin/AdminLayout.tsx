import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SentinelleLogo } from '../../components/SentinelleLogo';
import { Hov } from '../../lib/Hoverable';
import { useAuth } from '../../auth/AuthContext';
import {
  colors,
  formatClock,
  meta,
  MONO,
  NATIONAL_LEVEL,
  pad,
  rgba,
} from '../../theme';
import { initFeed, feedPool, type FeedItem } from '../../data/mock';
import { collectors } from '../../data/modules';
import {
  IconDashboard,
  IconMap,
  IconCollect,
  IconAI,
  IconBell,
  IconShield,
  IconFlag,
  IconReport,
  IconAudit,
  IconEndpoints,
  IconUsers,
  IconScan,
  IconNetwork,
  IconLogout,
  IconSearch,
} from './icons';
import { decorate, type DecoratedFeed } from './adminUtils';
import { FicheDrawer } from './FicheDrawer';
import { ScanLauncher } from './ScanLauncher';

type Group = 'SUPERVISION' | 'VEILLE' | 'RENSEIGNEMENT' | 'OPÉRATIONS' | 'PRODUCTION & GOUVERNANCE';

interface NavDef {
  key: string;
  label: string;
  path: string;
  group: Group;
  perm: string;
  icon: React.ReactNode;
}

// Navigation réorganisée en 5 sections : Observer → Comprendre → Agir → Produire → Gouverner.
const NAV: NavDef[] = [
  { key: 'dashboard', label: 'Tableau de bord', path: '/admin/dashboard', group: 'SUPERVISION', perm: 'view:dashboard', icon: <IconDashboard /> },
  { key: 'carte', label: 'Carte nationale', path: '/admin/carte', group: 'SUPERVISION', perm: 'view:carte', icon: <IconMap /> },

  { key: 'collecte', label: 'Collecte', path: '/admin/collecte', group: 'VEILLE', perm: 'view:collecte', icon: <IconCollect /> },
  { key: 'analyse', label: 'Analyse IA', path: '/admin/analyse', group: 'VEILLE', perm: 'view:analyse', icon: <IconAI /> },

  { key: 'renseignement', label: 'Acteurs menaçants', path: '/admin/renseignement', group: 'RENSEIGNEMENT', perm: 'view:renseignement', icon: <IconShield /> },
  { key: 'cib', label: 'Réseaux coordonnés', path: '/admin/cib', group: 'RENSEIGNEMENT', perm: 'view:analyse', icon: <IconNetwork /> },

  { key: 'alertes', label: 'Alertes', path: '/admin/alertes', group: 'OPÉRATIONS', perm: 'view:alertes', icon: <IconBell /> },
  { key: 'signalements', label: 'Signalements', path: '/admin/signalements', group: 'OPÉRATIONS', perm: 'view:signalements', icon: <IconFlag /> },

  { key: 'rapports', label: 'Rapports', path: '/admin/rapports', group: 'PRODUCTION & GOUVERNANCE', perm: 'view:rapports', icon: <IconReport /> },
  { key: 'audit', label: "Journal d'audit", path: '/admin/audit', group: 'PRODUCTION & GOUVERNANCE', perm: 'view:audit', icon: <IconAudit /> },
  { key: 'users', label: 'Utilisateurs & accès', path: '/admin/users', group: 'PRODUCTION & GOUVERNANCE', perm: 'users:manage', icon: <IconUsers /> },
  { key: 'endpoints', label: 'Système', path: '/admin/endpoints', group: 'PRODUCTION & GOUVERNANCE', perm: 'view:endpoints', icon: <IconEndpoints /> },
];

const GROUPS: Group[] = ['SUPERVISION', 'VEILLE', 'RENSEIGNEMENT', 'OPÉRATIONS', 'PRODUCTION & GOUVERNANCE'];

const TITLES: Record<string, [string, string]> = {
  dashboard: ['Supervision', 'Situation nationale en temps réel'],
  carte: ['Supervision', 'Cartographie des risques par région'],
  collecte: ['Veille', "Forensic d'ingestion multi-réseaux"],
  analyse: ['Veille', 'Classification IA, entités et modèles'],
  cib: ['Renseignement', 'Comportements coordonnés inauthentiques'],
  alertes: ['Opérations', 'Moteur de règles et notifications'],
  renseignement: ['Renseignement', 'Acteurs menaçants suivis'],
  signalements: ['Opérations', 'File de traitement des signalements citoyens'],
  rapports: ['Production & gouvernance', 'Génération et diffusion des rapports'],
  audit: ['Production & gouvernance', "Conformité & Comité d'Éthique"],
  endpoints: ['Production & gouvernance', "Sécurité de l'infrastructure"],
  users: ['Production & gouvernance', 'Gestion RBAC des accréditations'],
};

export function AdminLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, logout, hasPerm } = useAuth();

  const [now, setNow] = useState(new Date());
  const [feed, setFeed] = useState<FeedItem[]>(initFeed);
  const [selected, setSelected] = useState<DecoratedFeed | null>(null);
  const [showScan, setShowScan] = useState(false);

  const visibleNav = NAV.filter((n) => hasPerm(n.perm));

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      const item = feedPool[Math.floor(Math.random() * feedPool.length)];
      const stamp = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setFeed((prev) => [{ ...item, id: d.getTime(), time: stamp }, ...prev].slice(0, 11));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const decoratedFeed = useMemo(() => feed.map(decorate), [feed]);

  const currentKey = NAV.find((n) => loc.pathname.startsWith(n.path))?.key ?? 'dashboard';
  const [pageTitle, pageSub] = TITLES[currentKey] ?? ['', ''];
  const nat = meta(NATIONAL_LEVEL);

  const online = collectors.filter((c) => c.status === 'online').length;

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', background: colors.bg }}>
      {/* Barre latérale */}
      <aside style={{ width: 230, flex: 'none', display: 'flex', flexDirection: 'column', background: colors.sidebar, borderRight: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '17px 18px 15px', borderBottom: `1px solid ${colors.borderSoft}` }}>
          <SentinelleLogo size={34} style={{ flex: 'none' }} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, letterSpacing: '.16em', fontSize: 14, color: colors.greenDark }}>SENTINELLE</div>
            <div style={{ fontSize: 8.5, letterSpacing: '.08em', color: colors.muted }}>CNVNAM · CENTRE DE VEILLE</div>
          </div>
        </div>

        <nav style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1 }}>
          {GROUPS.filter((g) => visibleNav.some((n) => n.group === g)).map((g) => (
            <div key={g} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9.5, letterSpacing: '.12em', color: colors.muted3, fontWeight: 700, padding: '11px 18px 6px' }}>{g}</div>
              {visibleNav.filter((n) => n.group === g).map((n) => {
                const active = currentKey === n.key;
                return (
                  <Hov
                    key={n.key}
                    onClick={() => nav(n.path)}
                    base={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 18px', borderLeft: `3px solid ${active ? colors.green : 'transparent'}`, background: active ? rgba(colors.green, 0.08) : 'transparent', color: active ? colors.greenDark : colors.text3, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 500 }}
                    hover={{ background: active ? rgba(colors.green, 0.08) : colors.panelDeep }}
                  >
                    <span style={{ color: active ? colors.green : colors.muted2, display: 'flex' }}>{n.icon}</span>
                    {n.label}
                  </Hov>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: 14, borderTop: `1px solid ${colors.borderSoft}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', marginBottom: 6 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: rgba(colors.green, 0.1), border: `1px solid ${rgba(colors.green, 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: colors.greenDark, flex: 'none' }}>{user?.initials ?? 'KD'}</div>
            <div style={{ lineHeight: 1.25, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{user?.name ?? 'Analyste'}</div>
              <div style={{ fontSize: 10.5, color: colors.muted }}>{user?.role ?? 'Analyste'}</div>
            </div>
          </div>
          <Hov
            onClick={handleLogout}
            base={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', color: colors.muted, fontSize: 13, fontWeight: 500 }}
            hover={{ background: 'rgba(220,38,38,.08)', color: '#dc2626' }}
          >
            <IconLogout />
            Déconnexion
          </Hov>
        </div>
      </aside>

      {/* Zone principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        {/* Barre de commande */}
        <div style={{ height: 60, flex: 'none', display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', borderBottom: `1px solid ${colors.border}`, background: colors.panel }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, lineHeight: 1.15 }}>{pageSub}</div>
            <div style={{ fontSize: 10.5, color: colors.muted, marginTop: 2, letterSpacing: '.04em', textTransform: 'uppercase' }}>{pageTitle}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {hasPerm('scan:launch') && (
              <Hov
                onClick={() => setShowScan(true)}
                base={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.green, border: `1px solid ${colors.green}`, color: '#fff', borderRadius: 9, padding: '8px 15px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, boxShadow: '0 1px 2px rgba(10,90,44,.25)' }}
                hover={{ background: colors.greenDark }}
              >
                <IconScan /> Lancer un scan
              </Hov>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.panelDeep, border: `1px solid ${colors.border}`, borderRadius: 9, padding: '8px 12px', width: 180 }}>
              <IconSearch />
              <span style={{ fontSize: 12.5, color: colors.muted2 }}>Rechercher…</span>
            </div>
            {/* Indicateur collecte */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, background: rgba(colors.green, 0.08), border: `1px solid ${rgba(colors.green, 0.3)}` }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.green }} />
              <span style={{ fontSize: 10.5, letterSpacing: '.05em', color: colors.muted }}>COLLECTE</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.greenDark, fontFamily: MONO }}>{online}/{collectors.length}</span>
            </div>
            {/* Niveau national */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 13px', borderRadius: 8, background: rgba(nat.c, 0.1), border: `1px solid ${rgba(nat.c, 0.4)}` }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: nat.c }} />
              <span style={{ fontSize: 10.5, letterSpacing: '.06em', color: colors.muted }}>NIVEAU</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.03em', color: nat.c }}>{nat.l.toUpperCase()}</span>
            </div>
            <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
              <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 500, letterSpacing: '.03em', color: colors.text }}>{formatClock(now)}</div>
              <div style={{ fontSize: 9.5, color: colors.muted, textTransform: 'capitalize' }}>{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Outlet context={{ feed: decoratedFeed, openFiche: setSelected }} />
        </div>

        {/* Barre d'état */}
        <div style={{ height: 26, flex: 'none', display: 'flex', alignItems: 'center', gap: 18, padding: '0 18px', borderTop: `1px solid ${colors.border}`, background: colors.panelAlt, fontFamily: MONO, fontSize: 10, color: colors.muted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} /> WS CONNECTÉ</span>
          <span>COLLECTE {online}/{collectors.length}</span>
          <span style={{ color: nat.c }}>NIVEAU {nat.l.toUpperCase()}</span>
          <span>UTILISATEUR {user?.initials ?? '—'} · {user?.role ?? ''}</span>
          <span style={{ marginLeft: 'auto' }}>{formatClock(now)} · YAOUNDÉ · CMR</span>
        </div>
      </div>

      {selected && <FicheDrawer selected={selected} onClose={() => setSelected(null)} />}
      {showScan && <ScanLauncher onClose={() => setShowScan(false)} />}
    </div>
  );
}
