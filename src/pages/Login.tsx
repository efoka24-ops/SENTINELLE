import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SentinelleLogo } from '../components/SentinelleLogo';
import { Hov } from '../lib/Hoverable';
import { useAuth } from '../auth/AuthContext';
import { useRequestCode, useVerifyCode } from '../api/hooks';
import { colors, MONO } from '../theme';

export function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const reqMut = useRequestCode();
  const verMut = useVerifyCode();

  const [phase, setPhase] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [info, setInfo] = useState('');
  const [err, setErr] = useState('');

  const sendCode = async () => {
    setErr('');
    setInfo('');
    if (!email.includes('@')) {
      setErr('Saisissez une adresse e-mail valide.');
      return;
    }
    try {
      const res = await reqMut.mutateAsync({ email: email.trim() });
      if (res.dev_mode && res.dev_code) {
        setDevCode(res.dev_code);
        setCode(res.dev_code);
        setInfo(`Mode développement — code de connexion : ${res.dev_code}`);
      } else if (res.sent) {
        setInfo('Un code de connexion à usage unique a été envoyé à votre adresse e-mail.');
      } else {
        setInfo("Envoi e-mail indisponible — contactez l'administrateur.");
      }
      setPhase(2);
    } catch (e) {
      const ex = e as { response?: { status?: number; data?: { detail?: string } } };
      if (ex.response?.status === 404) setErr(ex.response.data?.detail ?? 'Aucun compte pour cet e-mail.');
      else if (ex.response) setErr(ex.response.data?.detail ?? 'Erreur serveur.');
      // Plus de bascule « démo » : la connexion exige le backend (accès strict
      // par rôle). Sans backend joignable, on refuse l'accès.
      else setErr('Service indisponible — réessayez dans un instant.');
    }
  };

  const verify = async () => {
    setErr('');
    if (code.trim().length < 6) {
      setErr('Le code comporte 6 chiffres.');
      return;
    }
    try {
      const res = await verMut.mutateAsync({ email: email.trim(), code: code.trim() });
      login(res.access_token, res.user, res.permissions);
      nav('/admin/dashboard');
    } catch (e) {
      const ex = e as { response?: { data?: { detail?: string } } };
      setErr(ex.response?.data?.detail ?? 'Code invalide ou expiré.');
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', marginTop: 7, marginBottom: 16, padding: '12px 14px',
    border: `1px solid ${colors.lightFieldBorder}`, borderRadius: 9, fontSize: 14,
    background: colors.lightField, color: colors.lightText, outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.lightBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, display: 'flex' }}>
        <div style={{ flex: 1, background: colors.green }} />
        <div style={{ flex: 1, background: colors.red }} />
        <div style={{ flex: 1, background: colors.gold }} />
      </div>

      <div style={{ position: 'relative', width: 404, background: '#fff', border: '1px solid #e6e3d8', borderRadius: 18, padding: 34, boxShadow: '0 12px 40px rgba(16,32,24,.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 26 }}>
          <SentinelleLogo size={54} />
          <div style={{ fontWeight: 700, letterSpacing: '.16em', fontSize: 17, marginTop: 12, color: colors.greenDark }}>SENTINELLE</div>
          <div style={{ fontSize: 11, color: colors.lightMuted, letterSpacing: '.06em', marginTop: 4 }}>ESPACE ADMINISTRATEUR · ACCÈS RESTREINT</div>
        </div>

        {phase === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: colors.muted2, marginBottom: 16 }}>
              <span style={{ width: 18, height: 2, background: colors.green, borderRadius: 2 }} />
              <span style={{ color: colors.green, fontWeight: 600 }}>ÉTAPE 1 / 2</span>
              <span>· Identification</span>
            </div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#46524a' }}>Adresse e-mail professionnelle</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendCode()}
              placeholder="prenom.nom@sentinelle.cm"
              style={fieldStyle}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: colors.muted3, marginBottom: 18 }}>
              <span>📧</span> Un code de connexion à usage unique vous sera envoyé par e-mail.
            </div>
            {err && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{err}</div>}
            <Hov as="span" onClick={reqMut.isPending ? undefined : sendCode} base={{ display: 'block', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.greenDeep, background: colors.gold, borderRadius: 9, padding: 13 }} hover={{ background: colors.goldHover }}>
              {reqMut.isPending ? 'Envoi…' : 'Recevoir mon code'}
            </Hov>
            <div onClick={() => nav('/')} style={{ textAlign: 'center', marginTop: 16, cursor: 'pointer', fontSize: 12.5, color: colors.muted2 }}>← Retour au site public</div>
          </div>
        )}

        {phase === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: colors.muted2, marginBottom: 16 }}>
              <span style={{ width: 18, height: 2, background: colors.green, borderRadius: 2 }} />
              <span style={{ color: colors.green, fontWeight: 600 }}>ÉTAPE 2 / 2</span>
              <span>· Code de connexion</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(252,209,22,.12)', border: '1px solid rgba(252,209,22,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 14px' }}>🔑</div>
              <div style={{ fontSize: 13, color: colors.muted2, lineHeight: 1.5 }}>
                Saisissez le code envoyé à<br /><strong style={{ color: colors.greenDark }}>{email}</strong>
              </div>
            </div>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErr(''); }}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              placeholder="• • • • • •"
              inputMode="numeric"
              style={{ width: '100%', textAlign: 'center', padding: 14, border: `1px solid ${colors.lightFieldBorder}`, borderRadius: 10, fontFamily: MONO, fontSize: 26, fontWeight: 600, letterSpacing: '.5em', background: colors.lightField, color: colors.lightText, outline: 'none' }}
            />
            {devCode && (
              <div style={{ fontSize: 11, color: colors.cyan, textAlign: 'center', marginTop: 10, fontFamily: MONO }}>
                DEV · code = {devCode} (e-mail désactivé en développement)
              </div>
            )}
            {info && !devCode && <div style={{ fontSize: 11.5, color: '#16a34a', textAlign: 'center', marginTop: 10 }}>{info}</div>}
            {err && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 10, textAlign: 'center' }}>{err}</div>}
            <Hov as="span" onClick={verMut.isPending ? undefined : verify} base={{ display: 'block', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.greenDeep, background: colors.gold, borderRadius: 9, padding: 13, marginTop: 16 }} hover={{ background: colors.goldHover }}>
              {verMut.isPending ? 'Vérification…' : 'Se connecter'}
            </Hov>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <span onClick={() => { setPhase(1); setCode(''); setDevCode(''); setErr(''); setInfo(''); }} style={{ cursor: 'pointer', fontSize: 12.5, color: colors.muted2 }}>← Changer d'e-mail</span>
              <span onClick={sendCode} style={{ cursor: 'pointer', fontSize: 12.5, color: colors.muted2 }}>Renvoyer le code</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
