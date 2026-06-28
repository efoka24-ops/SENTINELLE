import { useState } from 'react';
import { colors } from '../../../../theme';
import type { ApiSignalement, SignalementDecision } from '../../../../api/types';

interface SignalementDecisionFormProps {
  signalement: ApiSignalement;
  userRole: string;
  onSubmit: (decision: SignalementDecision) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const THREAT_CATEGORIES = [
  { key: 'terrorism', label: 'Terrorisme' },
  { key: 'hate', label: 'Discours de haine' },
  { key: 'fake', label: 'Désinformation' },
  { key: 'cyber', label: 'Cyberattaque' },
  { key: 'other', label: 'Autre' },
];

const SUBCATEGORIES: Record<string, { key: string; label: string }[]> = {
  terrorism: [
    { key: 'recruitment', label: 'Recrutement armé' },
    { key: 'planning', label: 'Planification d\'attaque' },
    { key: 'propaganda', label: 'Propagande' },
  ],
  hate: [
    { key: 'ethnic', label: 'Incitation ethnique' },
    { key: 'religious', label: 'Incitation religieuse' },
    { key: 'regional', label: 'Incitation régionale' },
  ],
  fake: [
    { key: 'rumor', label: 'Rumeur' },
    { key: 'manipulation', label: 'Manipulation' },
    { key: 'deepfake', label: 'Deepfake' },
  ],
  cyber: [
    { key: 'phishing', label: 'Phishing' },
    { key: 'fraud', label: 'Fraude' },
    { key: 'malware', label: 'Malware' },
  ],
  other: [
    { key: 'content', label: 'Contenu préoccupant' },
    { key: 'spam', label: 'Spam' },
    { key: 'abuse', label: 'Abus de plateforme' },
  ],
};

const GRAVITIES = [
  { key: 'Faible', label: 'Faible', color: '#16a34a' },
  { key: 'Modéré', label: 'Modéré', color: '#ca8a04' },
  { key: 'Grave', label: 'Grave', color: '#ea580c' },
  { key: 'Critique', label: 'Critique', color: '#dc2626' },
];

const REGIONS = [
  'Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral',
  'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest',
];

const AUTHORITIES = [
  { key: 'ANTIC', label: 'ANTIC' },
  { key: 'Armée', label: 'Armée' },
  { key: 'Parquet', label: 'Parquet' },
];

type Step = 'categorization' | 'analysis' | 'decision';

export function SignalementDecisionForm({
  signalement,
  userRole,
  onSubmit,
  onCancel,
  isLoading = false,
}: SignalementDecisionFormProps) {
  const [step, setStep] = useState<Step>('categorization');
  const [threatCategory, setThreatCategory] = useState(signalement.threat_category || '');
  const [threatSubcategory, setThreatSubcategory] = useState(signalement.threat_subcategory || '');
  const [gravity, setGravity] = useState(signalement.gravity || 'Modéré');
  const [notes, setNotes] = useState(signalement.notes || '');
  const [decision, setDecision] = useState<'Validé' | 'Rejeté' | 'Escalade'>('Validé');
  const [decisionReason, setDecisionReason] = useState(signalement.decision_reason || '');
  const [decisionAuthority, setDecisionAuthority] = useState(signalement.decision_authority || 'ANTIC');
  const [escalationComment, setEscalationComment] = useState(signalement.escalation_comment || '');
  const [geolocation, setGeolocation] = useState(signalement.geolocation || '');
  const [relatedLinks, setRelatedLinks] = useState(signalement.related_links || []);
  const [newLink, setNewLink] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isReadOnly = userRole === 'auditor';

  const availableSubcategories = SUBCATEGORIES[threatCategory] || [];

  const handleNextStep = () => {
    if (step === 'categorization') {
      if (!threatCategory) {
        setError('Sélectionnez une catégorie de menace');
        return;
      }
      if (!threatSubcategory) {
        setError('Sélectionnez une sous-catégorie');
        return;
      }
      setError(null);
      setStep('analysis');
    } else if (step === 'analysis') {
      if (!notes.trim()) {
        setError('Ajoutez des notes d\'analyse');
        return;
      }
      setError(null);
      setStep('decision');
    }
  };

  const handlePrevStep = () => {
    if (step === 'analysis') setStep('categorization');
    else if (step === 'decision') setStep('analysis');
  };

  const handleSubmit = async () => {
    try {
      if (!decisionReason.trim()) {
        setError('Indiquez le motif de votre décision');
        return;
      }

      if (decision === 'Validé' && !decisionAuthority) {
        setError('Sélectionnez une autorité pour la transmission');
        return;
      }

      if (decision === 'Escalade' && !escalationComment.trim()) {
        setError('Indiquez un motif d\'escalade');
        return;
      }

      const payload: SignalementDecision = {
        signalement_id: signalement.id,
        threat_category: threatCategory,
        threat_subcategory: threatSubcategory,
        gravity,
        notes,
        decision,
        decision_reason: decisionReason,
        decision_authority: decision === 'Validé' ? decisionAuthority : undefined,
        escalation_comment: decision === 'Escalade' ? escalationComment : undefined,
        geolocation,
        related_links: relatedLinks,
      };

      setError(null);
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const addLink = () => {
    if (newLink.trim() && newLink.match(/^https?:\/\//)) {
      setRelatedLinks([...relatedLinks, newLink]);
      setNewLink('');
      setError(null);
    } else {
      setError('Veuillez entrer une URL valide (http:// ou https://)');
    }
  };

  if (isReadOnly) {
    return (
      <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ color: colors.muted, fontSize: 12, textAlign: 'center', padding: '24px 16px' }}>
          Accès en lecture seule. Les annotateurs ne peuvent pas modifier les décisions.
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header avec étapes */}
      <div style={{ background: colors.panelAlt, padding: 16, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {(['categorization', 'analysis', 'decision'] as Step[]).map((s, idx) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: step === s ? colors.green : step > s ? colors.greenLight : colors.panelDeep,
                  color: step === s || step > s ? '#fff' : colors.muted3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {idx + 1}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text2 }}>
                {s === 'categorization' ? 'Catégorisation' : s === 'analysis' ? 'Analyse' : 'Décision'}
              </div>
              {idx < 2 && <div style={{ fontSize: 18, color: colors.border }}>→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: 16 }}>
        {error && (
          <div
            style={{
              background: '#fecaca',
              border: '1px solid #dc2626',
              color: '#991b1b',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 16,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {step === 'categorization' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text2, marginBottom: 8 }}>
                Catégorie de menace *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {THREAT_CATEGORIES.map((cat) => (
                  <label key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 12px', background: threatCategory === cat.key ? colors.greenLight : colors.panelDeep, border: `1px solid ${threatCategory === cat.key ? colors.green : colors.border}`, borderRadius: 8, transition: 'all 200ms' }}>
                    <input type="radio" name="category" value={cat.key} checked={threatCategory === cat.key} onChange={(e) => { setThreatCategory(e.target.value); setThreatSubcategory(''); }} style={{ cursor: 'pointer' }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: colors.text }}>{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {threatCategory && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text2, marginBottom: 8 }}>
                  Sous-catégorie *
                </label>
                <select
                  value={threatSubcategory}
                  onChange={(e) => setThreatSubcategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 12,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    background: colors.panelDeep,
                    color: colors.text,
                    outline: 'none',
                  }}
                >
                  <option value="">Sélectionnez une sous-catégorie</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.key} value={sub.key}>
                      {sub.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text2, marginBottom: 8 }}>
                Gravité
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {GRAVITIES.map((g) => (
                  <label key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', padding: '12px 10px', background: gravity === g.key ? colors.panelDeep : 'transparent', border: `2px solid ${gravity === g.key ? g.color : colors.border}`, borderRadius: 8 }}>
                    <div style={{ height: 20, background: g.color, borderRadius: 4 }} />
                    <input type="radio" name="gravity" value={g.key} checked={gravity === g.key} onChange={(e) => setGravity(e.target.value as any)} style={{ cursor: 'pointer' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, textAlign: 'center' }}>{g.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text2, marginBottom: 8 }}>
                Notes d'analyse *
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Décrivez votre analyse détaillée du signalement..."
                style={{
                  width: '100%',
                  minHeight: 120,
                  padding: '12px 14px',
                  fontSize: 12,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  background: colors.panelDeep,
                  color: colors.text,
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text2, marginBottom: 8 }}>
                Géolocalisation
              </label>
              <select
                value={geolocation}
                onChange={(e) => setGeolocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 12,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  background: colors.panelDeep,
                  color: colors.text,
                  outline: 'none',
                }}
              >
                <option value="">Aucune géolocalisation</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text2, marginBottom: 8 }}>
                Liens connexes
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: 12,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    background: colors.panelDeep,
                    color: colors.text,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={addLink}
                  disabled={!newLink.trim()}
                  style={{
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    background: colors.green,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    opacity: !newLink.trim() ? 0.5 : 1,
                  }}
                >
                  Ajouter
                </button>
              </div>
              {relatedLinks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {relatedLinks.map((link, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: colors.panelDeep, borderRadius: 6 }}>
                      <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: colors.cyan, textDecoration: 'none' }}>
                        {link.slice(0, 50)}...
                      </a>
                      <button
                        onClick={() => setRelatedLinks(relatedLinks.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'decision' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text2, marginBottom: 8 }}>
                Décision
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {['Validé', 'Rejeté', 'Escalade'].map((d) => (
                  <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 12px', background: decision === d ? colors.greenLight : colors.panelDeep, border: `1px solid ${decision === d ? colors.green : colors.border}`, borderRadius: 8 }}>
                    <input type="radio" name="decision" value={d} checked={decision === d as any} onChange={(e) => setDecision(e.target.value as any)} style={{ cursor: 'pointer' }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: colors.text }}>{d}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text2, marginBottom: 8 }}>
                Motif de la décision *
              </label>
              <textarea
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Justifiez votre décision de manière détaillée..."
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: '12px 14px',
                  fontSize: 12,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  background: colors.panelDeep,
                  color: colors.text,
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {decision === 'Validé' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text2, marginBottom: 8 }}>
                  Autorité destinataire *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {AUTHORITIES.map((auth) => (
                    <label key={auth.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 12px', background: decisionAuthority === auth.key ? colors.greenLight : colors.panelDeep, border: `1px solid ${decisionAuthority === auth.key ? colors.green : colors.border}`, borderRadius: 8 }}>
                      <input type="radio" name="authority" value={auth.key} checked={decisionAuthority === auth.key} onChange={(e) => setDecisionAuthority(e.target.value)} style={{ cursor: 'pointer' }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: colors.text }}>{auth.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {decision === 'Escalade' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text2, marginBottom: 8 }}>
                  Motif d'escalade *
                </label>
                <textarea
                  value={escalationComment}
                  onChange={(e) => setEscalationComment(e.target.value)}
                  placeholder="Expliquez pourquoi ce signalement nécessite une escalade..."
                  style={{
                    width: '100%',
                    minHeight: 80,
                    padding: '12px 14px',
                    fontSize: 12,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    background: colors.panelDeep,
                    color: colors.text,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, padding: 16, borderTop: `1px solid ${colors.border}`, background: colors.panelAlt }}>
        <button
          onClick={onCancel}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 12,
            fontWeight: 600,
            background: colors.panelDeep,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            cursor: 'pointer',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          Annuler
        </button>

        {step !== 'categorization' && (
          <button
            onClick={handlePrevStep}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: colors.panelDeep,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              cursor: 'pointer',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            ← Précédent
        </button>
        )}

        {step !== 'decision' ? (
          <button
            onClick={handleNextStep}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: colors.green,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            Suivant →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: decision === 'Escalade' ? '#ea580c' : colors.green,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? 'Traitement...' : decision === 'Escalade' ? '⬆️ Escalader' : decision === 'Rejeté' ? '✗ Rejeter' : '✓ Valider'}
          </button>
        )}
      </div>
    </div>
  );
}
