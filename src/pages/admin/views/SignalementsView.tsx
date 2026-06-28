import { useState } from 'react';
import { colors, MONO, rgba } from '../../../theme';
import { citizenReports } from '../adminUtils';
import { useSignalements, useSignalement } from '../../../api/hooks';
import { useAuth } from '../../../auth/AuthContext';
import { Panel, ViewHeader } from '../ui';
import { Hov } from '../../../lib/Hoverable';
import { SLATimer } from './components/SLATimer';
import { EscalationChain } from './components/EscalationChain';
import { HistoryPanel } from './components/HistoryPanel';
import { SignalementDecisionForm } from './components/SignalementDecisionForm';
import type { ApiSignalement } from '../../../api/types';

const GRID = '140px 1.2fr 1fr 1fr 1.2fr 1.2fr';
const ellip: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 };

const STATUS_COLORS: Record<string, string> = {
  'Nouveau': '#2563eb',
  'Analyse': '#eab308',
  'Decision': '#ca8a04',
  'Escalade': '#ef4444',
  'Transmitted': '#16a34a',
};

const GRAVITY_COLORS: Record<string, string> = {
  'Faible': '#16a34a',
  'Modéré': '#ca8a04',
  'Grave': '#ea580c',
  'Critique': '#dc2626',
};

interface FilterState {
  status: string[];
  gravity: string[];
  region: string[];
  assignedTo: string[];
  search: string;
}

export function SignalementsView() {
  const { user } = useAuth();
  const live = useSignalements();

  const [filters, setFilters] = useState<FilterState>({
    status: [],
    gravity: [],
    region: [],
    assignedTo: [],
    search: '',
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedSignalement = useSignalement(selectedId);
  const [showForm, setShowForm] = useState(false);

  // Role-based filtering
  const userRole = user?.role ?? 'analyst_jr';
  let filteredData = (live.data ?? citizenReports.map((c) => ({
    id: 0,
    ref: c.ref,
    type: c.type,
    region: c.region,
    status: c.status as any,
    assigned_to: '—',
    created_at: '',
    due_at: '',
    threat_category: '',
    gravity: 'Modéré' as any,
  }))) as ApiSignalement[];

  // analyst_jr: only assigned to them in Nouveau/Analyse/Decision
  if (userRole === 'analyst_jr') {
    filteredData = filteredData.filter(
      (s) =>
        s.assigned_to === user?.name &&
        ['Nouveau', 'Analyse', 'Decision'].includes(s.status)
    );
  }
  // analyst_sr: assigned + can see team's (read-only)
  else if (userRole === 'analyst_sr') {
    filteredData = filteredData.filter(
      (s) =>
        s.assigned_to === user?.name ||
        ['Nouveau', 'Analyse', 'Decision'].includes(s.status)
    );
  }
  // chief: all team + pending escalations + can reassign
  else if (userRole === 'chief') {
    // Show team's signalements
  }
  // director: all nationally + escalation history
  else if (userRole === 'director') {
    // Show everything
  }
  // auditor: read-only to all
  else if (userRole === 'auditor') {
    // Show everything but read-only (handled in components)
  }

  // Apply text search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filteredData = filteredData.filter(
      (s) =>
        s.ref.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    );
  }

  // Apply filter selections
  if (filters.status.length > 0) {
    filteredData = filteredData.filter((s) => filters.status.includes(s.status));
  }
  if (filters.gravity.length > 0) {
    filteredData = filteredData.filter((s) => filters.gravity.includes(s.gravity));
  }
  if (filters.region.length > 0) {
    filteredData = filteredData.filter((s) => filters.region.includes(s.region));
  }

  const statusCounts = [
    { status: 'Nouveau', color: STATUS_COLORS['Nouveau'], n: filteredData.filter((s) => s.status === 'Nouveau').length },
    { status: 'Analyse', color: STATUS_COLORS['Analyse'], n: filteredData.filter((s) => s.status === 'Analyse').length },
    { status: 'Escalade', color: STATUS_COLORS['Escalade'], n: filteredData.filter((s) => s.status === 'Escalade').length },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {!selectedSignalement.data ? (
        <>
          {/* Header */}
          <div style={{ padding: '18px 18px 0', flex: 'none' }}>
            <ViewHeader
              title="File de traitement"
              sub="Signalements citoyens"
              right={
                <div style={{ display: 'flex', gap: 16 }}>
                  {statusCounts.map((a) => (
                    <div key={a.status} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: a.color }} />
                      <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: a.color }}>
                        {a.n}
                      </span>
                      <span style={{ fontSize: 10.5, color: colors.muted2 }}>{a.status}</span>
                    </div>
                  ))}
                </div>
              }
            />
          </div>

          {/* Filters & Search */}
          <div style={{ padding: '14px 18px', flex: 'none', background: colors.panelAlt, borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Rechercher par référence, type ou région…"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: 12,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  background: colors.panel,
                  color: colors.text,
                  outline: 'none',
                }}
              />
              <select
                multiple
                size={1}
                value={filters.status}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: Array.from(e.target.selectedOptions, (opt) => opt.value),
                  })
                }
                style={{
                  padding: '6px 8px',
                  fontSize: 11,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  background: colors.panel,
                  color: colors.text,
                  outline: 'none',
                }}
              >
                <option value="">Statuts</option>
                <option value="Nouveau">Nouveau</option>
                <option value="Analyse">Analyse</option>
                <option value="Decision">Décision</option>
                <option value="Escalade">Escalade</option>
                <option value="Transmitted">Transmis</option>
              </select>
              <select
                multiple
                size={1}
                value={filters.gravity}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    gravity: Array.from(e.target.selectedOptions, (opt) => opt.value),
                  })
                }
                style={{
                  padding: '6px 8px',
                  fontSize: 11,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  background: colors.panel,
                  color: colors.text,
                  outline: 'none',
                }}
              >
                <option value="">Gravité</option>
                <option value="Faible">Faible</option>
                <option value="Modéré">Modéré</option>
                <option value="Grave">Grave</option>
                <option value="Critique">Critique</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
            <Panel title="Signalements en cours" accent={colors.green} bodyStyle={{ padding: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, padding: '11px 16px', borderBottom: `1px solid ${colors.borderSoft}`, fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: colors.muted2, fontWeight: 600 }}>
                <span>Référence</span>
                <span>Type</span>
                <span>Région</span>
                <span>Gravité</span>
                <span>Statut</span>
                <span>SLA</span>
              </div>
              {filteredData.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: colors.muted }}>
                  Aucun signalement
                </div>
              ) : (
                filteredData.map((s) => {
                  const scol = STATUS_COLORS[s.status] || '#7a857b';
                  const gcol = GRAVITY_COLORS[s.gravity] || '#7a857b';
                  return (
                    <Hov
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      base={{
                        display: 'grid',
                        gridTemplateColumns: GRID,
                        gap: 12,
                        padding: '14px 16px',
                        borderBottom: '1px solid #eceee9',
                        alignItems: 'center',
                        fontSize: 12.5,
                        cursor: 'pointer',
                      }}
                      hover={{ background: colors.panelDeep }}
                    >
                      <span style={{ ...ellip, fontFamily: MONO, fontSize: 11.5, color: colors.muted }}>
                        {s.ref}
                      </span>
                      <span style={{ ...ellip, color: colors.text2 }}>{s.type}</span>
                      <span style={{ ...ellip, color: colors.text4 }}>{s.region || '—'}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: gcol }}>
                        {s.gravity}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: scol, background: rgba(scol, 0.14), borderRadius: 5, padding: '3px 9px', textAlign: 'center' }}>
                        {s.status}
                      </span>
                      <SLATimer dueAt={s.due_at} variant="compact" />
                    </Hov>
                  );
                })
              )}
            </Panel>
          </div>
        </>
      ) : (
        /* Detail View */
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          <div style={{ marginBottom: 18 }}>
            <Hov
              onClick={() => {
                setSelectedId(null);
                setShowForm(false);
              }}
              base={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                background: colors.panelDeep,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                color: colors.text3,
              }}
              hover={{ background: colors.panelDeep, borderColor: colors.green }}
            >
              ← Retour à la liste
            </Hov>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, minHeight: 0 }}>
            {/* Main content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
              {/* Header card */}
              <Panel
                accent={STATUS_COLORS[selectedSignalement.data?.status || 'Nouveau']}
                bodyStyle={{ padding: 0 }}
              >
                <div style={{ padding: 16, borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: colors.muted, marginBottom: 4 }}>
                        {selectedSignalement.data?.ref}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
                        {selectedSignalement.data?.type}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: GRAVITY_COLORS[selectedSignalement.data?.gravity || 'Modéré'],
                          background: rgba(GRAVITY_COLORS[selectedSignalement.data?.gravity || 'Modéré'], 0.14),
                          borderRadius: 6,
                          padding: '6px 10px',
                        }}
                      >
                        {selectedSignalement.data?.gravity}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: STATUS_COLORS[selectedSignalement.data?.status || 'Nouveau'],
                          background: rgba(STATUS_COLORS[selectedSignalement.data?.status || 'Nouveau'], 0.14),
                          borderRadius: 6,
                          padding: '6px 10px',
                        }}
                      >
                        {selectedSignalement.data?.status}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, color: colors.muted2, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                        Région
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                        {selectedSignalement.data?.region || '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: colors.muted2, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                        Assigné à
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                        {selectedSignalement.data?.assigned_to || '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: colors.muted2, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                        Reçu le
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                        {selectedSignalement.data?.created_at
                          ? new Date(selectedSignalement.data.created_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow visualization */}
                <div style={{ padding: 16, background: colors.panelAlt }}>
                  <div style={{ fontSize: 10, color: colors.muted2, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10, fontWeight: 600 }}>
                    État du signalement
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {['Nouveau', 'Analyse', 'Decision', 'Escalade', 'Transmitted'].map((s, idx) => {
                      const isActive = selectedSignalement.data?.status === s;
                      const isCompleted = ['Nouveau', 'Analyse', 'Decision', 'Escalade', 'Transmitted'].indexOf(s) < ['Nouveau', 'Analyse', 'Decision', 'Escalade', 'Transmitted'].indexOf(selectedSignalement.data?.status || 'Nouveau');
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: isActive || isCompleted ? colors.green : colors.panelDeep,
                              border: isActive ? `2px solid ${colors.green}` : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              color: isActive || isCompleted ? '#fff' : colors.muted3,
                              flex: 'none',
                            }}
                          >
                            {isCompleted ? '✓' : ''}
                          </div>
                          <div style={{ fontSize: 10, color: isActive || isCompleted ? colors.text : colors.muted3, fontWeight: isActive ? 600 : 500 }}>
                            {s}
                          </div>
                          {idx < 4 && <div style={{ flex: 1, height: 1, background: isCompleted ? colors.green : colors.border }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>

              {/* SLA Timer */}
              <SLATimer dueAt={selectedSignalement.data?.due_at || new Date(Date.now() + 86400000).toISOString()} variant="prominent" />

              {/* Decision Form or Read-only View */}
              {selectedSignalement.data && (
                <>
                  {showForm ? (
                    <SignalementDecisionForm
                      signalement={selectedSignalement.data}
                      userRole={userRole}
                      onSubmit={async (decision) => {
                        // Will be connected to API mutation
                        console.log('Decision submitted:', decision);
                        setShowForm(false);
                      }}
                      onCancel={() => setShowForm(false)}
                      isLoading={false}
                    />
                  ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                      {userRole !== 'auditor' && selectedSignalement.data?.status !== 'Transmitted' && (
                        <button
                          onClick={() => setShowForm(true)}
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            fontSize: 12,
                            fontWeight: 600,
                            background: colors.green,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Traiter ce signalement
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
              {selectedSignalement.data && (
                <>
                  <SLATimer dueAt={selectedSignalement.data.due_at} variant="compact" />
                  <EscalationChain signalement={selectedSignalement.data} />
                  <HistoryPanel history={[]} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
