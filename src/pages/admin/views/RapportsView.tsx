import { useState } from 'react';
import { colors, MONO, meta } from '../../../theme';
import { reportsList, dailyReport } from '../../../data/modules';
import { Panel, ViewHeader } from '../ui';
import { Hov } from '../../../lib/Hoverable';
import { useGenerateReport } from '../../../api/hooks';
import { downloadFile } from '../../../api/client';

const TYPE_COL: Record<string, string> = {
  Quotidien: '#2563eb',
  Hebdomadaire: '#0a7d3c',
  Mensuel: '#ca8a04',
  Synthèse: '#7c3aed',
};

export function RapportsView() {
  const m = meta(dailyReport.level);
  const gen = useGenerateReport();
  const [title, setTitle] = useState('Synthèse SENTINELLE');
  const [recipients, setRecipients] = useState('directeur@sentinelle.cm');
  const [email, setEmail] = useState(true);
  const [schedule, setSchedule] = useState('');
  const [result, setResult] = useState<{ number: string; body_md: string; emailed: boolean; email_active: boolean; scheduled: boolean } | null>(null);
  const [err, setErr] = useState('');

  const generate = async () => {
    setErr('');
    try {
      const res = await gen.mutateAsync({
        title,
        type: 'Synthèse',
        recipients: recipients.split(',').map((r) => r.trim()).filter(Boolean),
        email,
        schedule,
      });
      setResult(res);
    } catch {
      setErr('Backend injoignable (port 8077).');
    }
  };

  const download = () => {
    if (!result) return;
    downloadFile(`/reports/${result.number}/pdf`, `${result.number}.pdf`).catch(() => {
      // Repli : téléchargement Markdown si l'API PDF est indisponible.
      const blob = new Blob([result.body_md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.number}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const field: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 8, background: '#f7f8f6',
    border: `1px solid ${colors.border}`, color: colors.text, fontSize: 12.5, outline: 'none',
  };

  return (
    <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
      <ViewHeader
        title="Rapports automatiques"
        sub="Module 8 · génération synthèse / PDF · envoi e-mail · planification"
      />

      {/* Générateur de rapport (réel, via API) */}
      <Panel title="Générer un rapport" accent={colors.gold} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr', gap: 12, alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: 11, color: colors.muted2, fontWeight: 600, marginBottom: 6 }}>Titre / template</div>
            <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: colors.muted2, fontWeight: 600, marginBottom: 6 }}>Destinataires (e-mail, séparés par virgule)</div>
            <input style={field} value={recipients} onChange={(e) => setRecipients(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: colors.muted2, fontWeight: 600, marginBottom: 6 }}>Planification</div>
            <select style={field} value={schedule} onChange={(e) => setSchedule(e.target.value)}>
              <option value="">Ponctuel</option>
              <option value="0 6 * * *">Quotidien · 06h00</option>
              <option value="0 17 * * 5">Hebdomadaire · ven. 17h00</option>
              <option value="0 9 1 * *">Mensuel · 1er 09h00</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: colors.text3, cursor: 'pointer' }}>
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Envoyer par e-mail aux destinataires
          </label>
          <Hov as="span" onClick={gen.isPending ? undefined : generate} base={{ fontSize: 13, fontWeight: 600, color: colors.greenDeep, background: colors.gold, borderRadius: 9, padding: '10px 20px', cursor: 'pointer' }} hover={{ background: colors.goldHover }}>
            {gen.isPending ? 'Génération…' : '⚙ Générer la synthèse'}
          </Hov>
          {result && (
            <Hov as="span" onClick={download} base={{ fontSize: 12.5, fontWeight: 500, color: colors.text2, background: '#eef1ee', border: '1px solid #dfe3de', borderRadius: 9, padding: '10px 16px', cursor: 'pointer' }} hover={{ background: colors.border }}>
              ↓ Télécharger {result.number}
            </Hov>
          )}
          {err && <span style={{ fontSize: 12, color: '#ea580c' }}>{err}</span>}
        </div>
        {result && (
          <div style={{ marginTop: 14, background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: 9, padding: 14 }}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 10, fontSize: 11.5 }}>
              <span style={{ color: '#16a34a' }}>✓ {result.number} généré</span>
              <span style={{ color: result.emailed ? '#16a34a' : colors.muted2 }}>{result.emailed ? '✓ Envoyé par e-mail' : (email ? '✉ E-mail à activer (SMTP)' : 'E-mail désactivé')}</span>
              {result.scheduled && <span style={{ color: colors.cyan }}>⏰ Planifié</span>}
            </div>
            <pre style={{ fontFamily: MONO, fontSize: 11, color: colors.text3, whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 220, overflowY: 'auto', margin: 0 }}>{result.body_md}</pre>
          </div>
        )}
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14 }}>
        {/* Liste rapports */}
        <Panel title="Historique des rapports" accent={colors.cyan} bodyStyle={{ padding: 0 }}>
          {reportsList.map((r) => (
            <Hov
              key={r.number}
              base={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid #eceee9', cursor: 'pointer' }}
              hover={{ background: '#f5f7f4' }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', color: TYPE_COL[r.type] ?? colors.muted, border: `1px solid ${TYPE_COL[r.type] ?? colors.muted}`, borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase', flex: 'none' }}>{r.type}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: colors.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                <div style={{ fontSize: 10.5, color: '#7a857b', marginTop: 1, fontFamily: MONO }}>{r.number} · {r.period}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', flex: 'none' }}>{r.status}</span>
              <span style={{ fontSize: 11, color: colors.muted3, flex: 'none' }}>{r.at}</span>
            </Hov>
          ))}
        </Panel>

        {/* Aperçu rapport quotidien */}
        <Panel
          title="Aperçu · rapport quotidien"
          accent={colors.gold}
          right={<Hov as="span" base={{ fontSize: 11, color: colors.text2, background: '#eef1ee', border: '1px solid #dfe3de', borderRadius: 7, padding: '5px 11px', cursor: 'pointer' }} hover={{ background: colors.border }}>↓ PDF</Hov>}
          bodyStyle={{ overflowY: 'auto', maxHeight: 520 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 8, background: meta(dailyReport.level).c + '22', border: `1px solid ${m.c}`, marginBottom: 16 }}>
            <span style={{ fontSize: 10.5, letterSpacing: '.07em', color: '#6b766c' }}>NIVEAU NATIONAL</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: m.c }}>{m.l.toUpperCase()}</span>
            <span style={{ fontSize: 11, color: colors.muted2, marginLeft: 'auto' }}>{dailyReport.trend}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
            {dailyReport.figures.map(([v, l]) => (
              <div key={l} style={{ background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '9px 10px' }}>
                <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: colors.text }}>{v}</div>
                <div style={{ fontSize: 9.5, color: colors.muted2, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10.5, letterSpacing: '.1em', color: colors.muted2, fontWeight: 600, marginBottom: 9 }}>TOP MENACES</div>
          <div style={{ marginBottom: 18 }}>
            {dailyReport.topThreats.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, fontSize: 12, color: colors.text3, padding: '5px 0', borderBottom: '1px solid #eceee9' }}>
                <span style={{ fontFamily: MONO, color: colors.muted3 }}>{i + 1}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10.5, letterSpacing: '.1em', color: colors.muted2, fontWeight: 600, marginBottom: 9 }}>RECOMMANDATIONS</div>
          <div style={{ fontSize: 12, color: colors.text4, lineHeight: 1.85 }}>
            {dailyReport.recommendations.map((r, i) => (
              <div key={i}>→ {r}</div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
