import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SentinelleLogo } from '../components/SentinelleLogo';
import { TricolorBar } from '../components/TricolorBar';
import { Hov } from '../lib/Hoverable';
import { colors, MONO } from '../theme';
import { typeDefs, regionNames } from '../data/mock';

interface ReportData {
  type: string | null;
  url: string;
  desc: string;
  region: string;
}

export function ReportFlow() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [report, setReport] = useState<ReportData>({ type: null, url: '', desc: '', region: '' });
  const [ref, setRef] = useState<string | null>(null);

  const chosen = typeDefs.find((t) => t.key === report.type);

  const next = () => {
    if (step === 1 && !report.type) return;
    setStep((s) => Math.min(3, s + 1));
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));
  const submit = () => {
    setRef('SGN-2026-' + Math.floor(10000 + Math.random() * 89999));
    setStep(4);
  };
  const restart = () => {
    setReport({ type: null, url: '', desc: '', region: '' });
    setRef(null);
    setStep(1);
  };

  const steps = [1, 2, 3].map((n) => {
    const cur = Math.min(step, 3);
    const done = n < cur;
    const active = n === cur;
    return {
      n: done ? '✓' : String(n),
      label: ['Type', 'Détails', 'Vérification'][n - 1],
      bg: done ? colors.green : active ? '#fff' : '#f0ede2',
      fg: done ? '#fff' : active ? colors.green : '#a8b0a4',
      bd: active || done ? colors.green : '#e0ddd0',
      tc: active || done ? colors.lightText : '#a8b0a4',
    };
  });

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    marginTop: 7,
    marginBottom: 18,
    padding: '12px 14px',
    border: `1px solid ${colors.lightFieldBorder}`,
    borderRadius: 9,
    fontSize: 14,
    background: colors.lightField,
    color: colors.lightText,
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#46524a' };

  return (
    <div style={{ background: colors.lightBg, color: colors.lightText, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TricolorBar />
      <header style={{ background: '#fff', borderBottom: '1px solid #e6e3d8' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', height: 66, display: 'flex', alignItems: 'center', gap: 12 }}>
          <SentinelleLogo size={34} style={{ flex: 'none' }} />
          <div style={{ fontWeight: 700, letterSpacing: '.13em', color: colors.greenDark }}>SENTINELLE</div>
          <span style={{ marginLeft: 14, fontSize: 13, color: '#7d8a80', display: 'flex', alignItems: 'center', gap: 6 }}>🔒 Signalement sécurisé & anonyme</span>
          <Hov as="span" onClick={() => nav('/')} base={{ marginLeft: 'auto', cursor: 'pointer', fontSize: 13, color: '#46524a' }} hover={{ color: colors.greenDark }}>← Retour à l'accueil</Hov>
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: 760, margin: '0 auto', width: '100%', padding: '34px 24px 60px' }}>
        {/* progress */}
        {step <= 3 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 30 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}>{s.n}</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: s.tc }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* STEP 1 — type */}
        {step === 1 && (
          <div style={{ background: '#fff', border: '1px solid #ece9de', borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>De quel type de contenu s'agit-il ?</h2>
            <p style={{ fontSize: 13.5, color: '#7d8a80', marginTop: 6, marginBottom: 22 }}>Sélectionnez la catégorie qui correspond le mieux.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {typeDefs.map((t) => {
                const sel = report.type === t.key;
                return (
                  <div
                    key={t.key}
                    onClick={() => setReport((r) => ({ ...r, type: t.key }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, border: `1.5px solid ${sel ? colors.green : '#ece9de'}`, background: sel ? '#eaf5ee' : colors.lightField, borderRadius: 12, padding: 16, cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 22 }}>{t.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: colors.lightText }}>{t.label}</div>
                      <div style={{ fontSize: 12.5, color: '#7d8a80', marginTop: 2 }}>{t.desc}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? colors.green : '#cdd6cb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: sel ? colors.green : 'transparent' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <span onClick={next} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', background: report.type ? colors.green : '#bcc6bc', borderRadius: 9, padding: '12px 24px' }}>Continuer →</span>
            </div>
          </div>
        )}

        {/* STEP 2 — détails */}
        {step === 2 && (
          <div style={{ background: '#fff', border: '1px solid #ece9de', borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Détails du signalement</h2>
            <p style={{ fontSize: 13.5, color: '#7d8a80', marginTop: 6, marginBottom: 22 }}>Plus vous donnez d'informations, plus l'analyse est rapide.</p>
            <label style={labelStyle}>Lien du contenu (URL)</label>
            <input value={report.url} onChange={(e) => setReport((r) => ({ ...r, url: e.target.value }))} placeholder="https://facebook.com/..." style={fieldStyle} />
            <label style={labelStyle}>Description (optionnel)</label>
            <textarea value={report.desc} onChange={(e) => setReport((r) => ({ ...r, desc: e.target.value }))} placeholder="Décrivez ce qui vous préoccupe…" rows={4} style={{ ...fieldStyle, resize: 'vertical' }} />
            <label style={labelStyle}>Région concernée</label>
            <select value={report.region} onChange={(e) => setReport((r) => ({ ...r, region: e.target.value }))} style={fieldStyle}>
              <option value="">— Sélectionnez —</option>
              {regionNames.map((rn) => (
                <option key={rn} value={rn}>{rn}</option>
              ))}
            </select>
            <label style={labelStyle}>Capture d'écran (optionnel)</label>
            <div style={{ marginTop: 7, border: '1.5px dashed #cdd6cb', borderRadius: 9, padding: 18, textAlign: 'center', background: colors.lightField }}>
              <div style={{ fontSize: 13, color: '#7d8a80' }}>📎 Glissez un fichier ou cliquez pour parcourir</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <span onClick={prev} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#46524a', border: `1px solid ${colors.lightFieldBorder}`, borderRadius: 9, padding: '12px 22px' }}>← Retour</span>
              <span onClick={next} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', background: colors.green, borderRadius: 9, padding: '12px 24px' }}>Continuer →</span>
            </div>
          </div>
        )}

        {/* STEP 3 — vérification */}
        {step === 3 && (
          <div style={{ background: '#fff', border: '1px solid #ece9de', borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Vérifiez votre signalement</h2>
            <p style={{ fontSize: 13.5, color: '#7d8a80', marginTop: 6, marginBottom: 22 }}>Confirmez les informations avant l'envoi.</p>
            <div style={{ border: '1px solid #ece9de', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f0ede2' }}>
                <span style={{ fontSize: 13, color: '#7d8a80' }}>Type</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: colors.lightText }}>{chosen ? chosen.label : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f0ede2', gap: 20 }}>
                <span style={{ fontSize: 13, color: '#7d8a80', flex: 'none' }}>Lien</span>
                <span style={{ fontSize: 13.5, color: colors.lightText, wordBreak: 'break-all', textAlign: 'right' }}>{report.url || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f0ede2' }}>
                <span style={{ fontSize: 13, color: '#7d8a80' }}>Région</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: colors.lightText }}>{report.region || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px' }}>
                <span style={{ fontSize: 13, color: '#7d8a80' }}>Description</span>
                <span style={{ fontSize: 13.5, color: colors.lightText, textAlign: 'right', maxWidth: '60%' }}>{report.desc || '—'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 18, background: '#eaf5ee', borderRadius: 10, padding: '13px 15px' }}>
              <span>🔒</span>
              <span style={{ fontSize: 12.5, color: '#3e6a4e', lineHeight: 1.55 }}>Votre signalement est anonyme. Aucune donnée permettant de vous identifier n'est collectée.</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <span onClick={prev} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#46524a', border: `1px solid ${colors.lightFieldBorder}`, borderRadius: 9, padding: '12px 22px' }}>← Retour</span>
              <span onClick={submit} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.greenDeep, background: colors.gold, borderRadius: 9, padding: '12px 26px' }}>Envoyer le signalement</span>
            </div>
          </div>
        )}

        {/* STEP 4 — confirmation */}
        {step === 4 && (
          <div style={{ background: '#fff', border: '1px solid #ece9de', borderRadius: 16, padding: '46px 28px', textAlign: 'center' }}>
            <div style={{ width: 66, height: 66, borderRadius: '50%', background: '#eaf5ee', color: colors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto' }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 20 }}>Signalement transmis</h2>
            <p style={{ fontSize: 14.5, color: '#6b766c', lineHeight: 1.6, marginTop: 10, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
              Merci. Votre signalement a bien été reçu et sera traité par nos analystes dans les 24 heures.
            </p>
            <div style={{ display: 'inline-block', marginTop: 22, background: colors.lightField, border: '1px solid #ece9de', borderRadius: 10, padding: '16px 28px' }}>
              <div style={{ fontSize: 11, letterSpacing: '.08em', color: '#7d8a80' }}>RÉFÉRENCE DE SUIVI</div>
              <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: colors.greenDark, marginTop: 4 }}>{ref}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30 }}>
              <span onClick={restart} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#46524a', border: `1px solid ${colors.lightFieldBorder}`, borderRadius: 9, padding: '12px 22px' }}>Nouveau signalement</span>
              <span onClick={() => nav('/')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', background: colors.green, borderRadius: 9, padding: '12px 24px' }}>Retour à l'accueil</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
