import { useState } from 'react';
import { Hov } from '../../lib/Hoverable';
import { colors, MONO } from '../../theme';
import { useNotify } from '../../api/hooks';
import type { DecoratedFeed } from './adminUtils';

interface Props {
  selected: DecoratedFeed;
  onClose: () => void;
}

export function FicheDrawer({ selected, onClose }: Props) {
  const notify = useNotify();
  const [notifMsg, setNotifMsg] = useState('');

  const sendNotification = async () => {
    setNotifMsg('');
    try {
      const res = await notify.mutateAsync({
        channel: 'email',
        target: 'autorité compétente',
        level: selected.level,
        platform: selected.platform,
        evidence_text: selected.text,
        evidence_time: selected.time,
      });
      setNotifMsg(
        res.email_active
          ? '✓ Notification envoyée avec preuve à l\'appui.'
          : '✓ Notification générée (envoi e-mail à activer : SMTP).',
      );
    } catch {
      setNotifMsg('Backend injoignable — notification non transmise.');
    }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 484, background: '#ffffff', borderLeft: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', boxShadow: '-22px 0 55px rgba(0,0,0,.5)', animation: 'ficheIn .26s ease' }}>
        {/* En-tête */}
        <div style={{ padding: '17px 20px', borderBottom: `1px solid ${colors.borderSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: '.1em', color: colors.muted2, fontWeight: 600 }}>FICHE DE RENSEIGNEMENT</div>
            <div style={{ fontFamily: MONO, fontSize: 15, color: colors.text, marginTop: 4 }}>#{selected.code}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: selected.color, border: `1px solid ${selected.color}`, borderRadius: 5, padding: '4px 9px', textTransform: 'uppercase' }}>{selected.levelLabel}</span>
            <Hov as="span" onClick={onClose} base={{ cursor: 'pointer', color: colors.muted2, fontSize: 20, lineHeight: 1 }} hover={{ color: colors.text }}>✕</Hov>
          </div>
        </div>

        {/* Corps */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ background: '#f7f8f6', border: '1px solid #dfe3de', borderRadius: 10, padding: 15, marginBottom: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: colors.muted2, fontWeight: 600, marginBottom: 8 }}>RÉSUMÉ AUTOMATIQUE · IA</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: colors.text3 }}>
              Contenu détecté sur <strong style={{ color: colors.text }}>{selected.platform}</strong> en lien avec « {selected.text} ». Localisation estimée : <strong style={{ color: colors.text }}>{selected.place}</strong>. Le moteur d'analyse classe ce contenu comme menace prioritaire et recommande une vérification analyste sous 15 minutes.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: '.08em', color: colors.muted2, fontWeight: 600, marginBottom: 8 }}>SCORE DE MENACE</div>
              <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: selected.color, lineHeight: 1 }}>{selected.score}</div>
              <div style={{ fontSize: 11, color: colors.muted2, marginTop: 6 }}>Confiance modèle · 87 %</div>
            </div>
            <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: '.08em', color: colors.muted2, fontWeight: 600, marginBottom: 8 }}>GÉOLOCALISATION</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{selected.place}</div>
              <div style={{ fontSize: 11, color: colors.muted2, marginTop: 6 }}>Extraction textuelle · confiance haute</div>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: colors.muted2, fontWeight: 600, marginBottom: 10 }}>ENTITÉS DÉTECTÉES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {[`LIEU · ${selected.place}`, `PLATEFORME · ${selected.platform}`, 'IDÉOLOGIE · à qualifier'].map((e) => (
                <span key={e} style={{ fontSize: 11.5, color: '#6b766c', background: '#eef1ee', border: '1px solid #dfe3de', borderRadius: 6, padding: '5px 10px' }}>{e}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: colors.muted2, fontWeight: 600, marginBottom: 10 }}>CONTEXTE · LIENS AUTOMATIQUES</div>
            <div style={{ fontSize: 13, color: colors.text4, lineHeight: 1.9 }}>
              → 3 incidents similaires dans la zone (30 derniers jours)<br />
              → Compte lié à l'acteur #TA-0012<br />
              → Pic d'activité observé entre 06 h 00 et 09 h 00
            </div>
          </div>

          {/* Preuve à l'appui */}
          <div style={{ background: '#f7f8f6', border: '1px solid #dfe3de', borderRadius: 10, padding: 15 }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: colors.muted2, fontWeight: 600, marginBottom: 10 }}>📎 PREUVE À L'APPUI</div>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 7, fontSize: 12.5 }}>
              <span style={{ color: colors.muted2 }}>Réseau</span><span style={{ color: colors.text2 }}>{selected.platform}</span>
              <span style={{ color: colors.muted2 }}>Heure</span><span style={{ color: colors.text2, fontFamily: MONO }}>{selected.time}</span>
              <span style={{ color: colors.muted2 }}>Localisation</span><span style={{ color: colors.text2 }}>{selected.place}</span>
              <span style={{ color: colors.muted2 }}>Lien du post</span><span style={{ color: colors.cyan, wordBreak: 'break-all' }}>(capturé par le moteur)</span>
              <span style={{ color: colors.muted2 }}>Discours</span><span style={{ color: colors.text3, lineHeight: 1.5 }}>« {selected.text} »</span>
            </div>
            <Hov
              as="span"
              onClick={notify.isPending ? undefined : sendNotification}
              base={{ display: 'block', textAlign: 'center', marginTop: 13, fontSize: 12.5, fontWeight: 600, color: colors.greenDeep, background: colors.gold, borderRadius: 8, padding: 10, cursor: 'pointer' }}
              hover={{ background: colors.goldHover }}
            >
              {notify.isPending ? 'Transmission…' : '📤 Notifier l\'autorité (preuve à l\'appui)'}
            </Hov>
            {notifMsg && <div style={{ fontSize: 11.5, color: notifMsg.startsWith('✓') ? '#16a34a' : '#ea580c', marginTop: 9, textAlign: 'center' }}>{notifMsg}</div>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '15px 20px', borderTop: `1px solid ${colors.borderSoft}`, display: 'flex', gap: 9 }}>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: colors.greenDeep, background: colors.greenLight, borderRadius: 8, padding: 11, cursor: 'pointer' }}>Valider</span>
          <Hov as="span" base={{ flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 500, color: colors.text2, background: '#eef1ee', border: '1px solid #dfe3de', borderRadius: 8, padding: 11, cursor: 'pointer' }} hover={{ background: colors.border }}>Escalader</Hov>
          <Hov as="span" base={{ flex: 'none', textAlign: 'center', fontSize: 12.5, fontWeight: 500, color: colors.muted, background: '#eef1ee', border: '1px solid #dfe3de', borderRadius: 8, padding: '11px 14px', cursor: 'pointer' }} hover={{ background: colors.border }}>Faux positif</Hov>
        </div>
      </div>
    </div>
  );
}
