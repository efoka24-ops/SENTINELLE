import { useNavigate } from 'react-router-dom';
import { SentinelleLogo } from '../components/SentinelleLogo';
import { TricolorBar } from '../components/TricolorBar';
import { Hov } from '../lib/Hoverable';
import { colors, MONO } from '../theme';
import { typeDefs } from '../data/mock';

export function PublicSite() {
  const nav = useNavigate();
  const goReport = () => nav('/signaler');
  const goLogin = () => nav('/admin/login');

  return (
    <div style={{ background: colors.lightBg, color: colors.lightText, minHeight: '100vh' }}>
      <TricolorBar />

      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(247,246,241,.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${colors.lightBorder2}`,
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', height: 70, display: 'flex', alignItems: 'center', gap: 14 }}>
          <SentinelleLogo size={40} style={{ flex: 'none' }} />
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontWeight: 700, letterSpacing: '.14em', fontSize: 16, color: colors.greenDark }}>SENTINELLE</div>
            <div style={{ fontSize: 8.5, letterSpacing: '.09em', color: '#7d8a80' }}>VEILLE NUMÉRIQUE NATIONALE</div>
          </div>
          <nav style={{ display: 'flex', gap: 26, marginLeft: 34, fontSize: 14, color: '#46524a' }}>
            <span style={{ cursor: 'pointer', color: colors.greenDark, fontWeight: 600 }}>Accueil</span>
            <Hov as="span" base={{ cursor: 'pointer' }} hover={{ color: colors.greenDark }} onClick={goReport}>Signaler</Hov>
            <Hov as="span" base={{ cursor: 'pointer' }} hover={{ color: colors.greenDark }}>Comprendre</Hov>
            <Hov as="span" base={{ cursor: 'pointer' }} hover={{ color: colors.greenDark }}>Ressources</Hov>
          </nav>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Hov
              as="span"
              onClick={goLogin}
              base={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#46524a', border: '1px solid #cfd6cd', borderRadius: 8, padding: '9px 16px' }}
              hover={{ borderColor: colors.green, color: colors.greenDark }}
            >
              Espace admin
            </Hov>
            <Hov
              as="span"
              onClick={goReport}
              base={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#fff', background: colors.green, borderRadius: 8, padding: '10px 18px', boxShadow: '0 1px 2px rgba(10,90,44,.3)' }}
              hover={{ background: '#0a6c34' }}
            >
              Faire un signalement
            </Hov>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(150deg,#0a5a2c,#073f1e 70%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(252,209,22,.10) 1px, transparent 0)', backgroundSize: '30px 30px' }} />
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '74px 28px 84px', display: 'grid', gridTemplateColumns: '1.25fr .9fr', gap: 56, alignItems: 'center', position: 'relative' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(252,209,22,.14)', border: '1px solid rgba(252,209,22,.4)', color: colors.gold, fontSize: 12, fontWeight: 600, letterSpacing: '.04em', padding: '6px 13px', borderRadius: 99, marginBottom: 22 }}>
              ★ PLATEFORME OFFICIELLE · RÉPUBLIQUE DU CAMEROUN
            </div>
            <h1 style={{ fontSize: 46, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-.01em', textWrap: 'balance' }}>
              Signalez un contenu numérique dangereux.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: '#cfe6d6', marginTop: 20, maxWidth: 520 }}>
              Désinformation, discours de haine, propagande violente, cybermenace : votre signalement aide à protéger le Cameroun. Anonyme, sécurisé, traité sous 24 heures.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 34 }}>
              <Hov as="span" onClick={goReport} base={{ cursor: 'pointer', fontSize: 15, fontWeight: 600, color: colors.greenDeep, background: colors.gold, borderRadius: 10, padding: '14px 26px', boxShadow: '0 4px 14px rgba(252,209,22,.3)' }} hover={{ background: colors.goldHover }}>
                Faire un signalement →
              </Hov>
              <Hov as="span" base={{ cursor: 'pointer', fontSize: 15, fontWeight: 500, color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 10, padding: '14px 24px' }} hover={{ background: 'rgba(255,255,255,.08)' }}>
                Comment ça marche
              </Hov>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 26, color: '#9fc6ac', fontSize: 13 }}>
              <span style={{ fontSize: 15 }}>🔒</span> Aucune inscription. Aucune donnée personnelle requise.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(252,209,22,.25)', borderRadius: 20, padding: 34, backdropFilter: 'blur(4px)', width: 300, textAlign: 'center' }}>
              <SentinelleLogo size={120} style={{ margin: '0 auto' }} />
              <div style={{ fontWeight: 700, letterSpacing: '.18em', fontSize: 20, marginTop: 18 }}>SENTINELLE</div>
              <div style={{ fontSize: 11, color: '#9fc6ac', letterSpacing: '.05em', marginTop: 6, lineHeight: 1.5 }}>
                Système d'exploitation nationale des tendances, de l'information et de la lutte contre les menaces
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#fff', borderBottom: '1px solid #ece9de' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 28px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {[
            ['12 480', 'Signalements traités'],
            ['< 24 h', 'Délai moyen de traitement'],
            ['10', 'Régions couvertes'],
            ['100 %', 'Confidentiel & anonyme'],
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: colors.greenDark }}>{n}</div>
              <div style={{ fontSize: 13, color: '#6b766c', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Comment signaler */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '66px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 46 }}>
          <div style={{ fontSize: 12, letterSpacing: '.12em', color: colors.green, fontWeight: 600, textTransform: 'uppercase' }}>En 3 étapes</div>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginTop: 10, color: colors.lightText }}>Comment signaler un contenu</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {[
            ['01', 'Décrivez le contenu', 'Indiquez le type de menace et le lien vers le contenu (Facebook, X, TikTok, Telegram…).'],
            ['02', 'Envoyez en sécurité', "Aucune donnée personnelle n'est exigée. La transmission est chiffrée de bout en bout."],
            ['03', 'Suivi par les analystes', 'Vous recevez une référence de suivi. Le contenu est analysé et traité sous 24 heures.'],
          ].map(([n, t, d]) => (
            <div key={n} style={{ background: '#fff', border: '1px solid #ece9de', borderRadius: 16, padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: '#eaf5ee', color: colors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 18, fontWeight: 600 }}>{n}</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 18, color: colors.lightText }}>{t}</div>
              <div style={{ fontSize: 14, color: '#6b766c', lineHeight: 1.65, marginTop: 8 }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Types */}
      <section style={{ background: '#fff', borderTop: '1px solid #ece9de', borderBottom: '1px solid #ece9de' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '62px 28px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: colors.lightText, marginBottom: 8 }}>Que pouvez-vous signaler ?</h2>
          <p style={{ fontSize: 15, color: '#6b766c', marginBottom: 34 }}>Tout contenu public en ligne susceptible de menacer la sécurité ou la cohésion nationale.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
            {typeDefs.map((t) => (
              <div key={t.key} style={{ border: '1px solid #ece9de', borderRadius: 14, padding: 20, background: colors.lightField }}>
                <div style={{ fontSize: 22 }}>{t.icon}</div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: colors.lightText, marginTop: 12 }}>{t.label}</div>
                <div style={{ fontSize: 12.5, color: '#7d8a80', lineHeight: 1.55, marginTop: 6 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sécurité */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '66px 28px', display: 'grid', gridTemplateColumns: '.9fr 1.1fr', gap: 54, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.12em', color: colors.green, fontWeight: 600, textTransform: 'uppercase' }}>Votre sécurité</div>
          <h2 style={{ fontSize: 30, fontWeight: 700, marginTop: 10, color: colors.lightText, lineHeight: 1.2 }}>Protéger les citoyens, dans le respect des libertés.</h2>
          <p style={{ fontSize: 15, color: '#6b766c', lineHeight: 1.7, marginTop: 16 }}>
            SENTINELLE n'exploite que des sources publiques et applique les principes de minimisation et de proportionnalité. Un Comité d'Éthique et de Contrôle indépendant audite l'usage de la plateforme.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['🕵️', 'Anonymat garanti', 'Aucune identité requise pour signaler.'],
            ['🔐', 'Chiffrement TLS 1.3', 'Transmission protégée de bout en bout.'],
            ['⚖️', 'Cadre légal', 'Loi n°2010/012 sur la cybersécurité.'],
            ['🏛️', 'Contrôle indépendant', "Audit par le Comité d'Éthique."],
          ].map(([i, t, d]) => (
            <div key={t} style={{ background: '#fff', border: '1px solid #ece9de', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 20 }}>{i}</div>
              <div style={{ fontWeight: 600, marginTop: 10, color: colors.lightText, fontSize: 14.5 }}>{t}</div>
              <div style={{ fontSize: 12.5, color: '#7d8a80', marginTop: 5, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: colors.green, color: '#fff', textAlign: 'center', padding: '54px 28px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700 }}>Un contenu vous préoccupe ?</h2>
        <p style={{ fontSize: 15, color: '#cfe6d6', marginTop: 10 }}>Quelques secondes suffisent pour contribuer à la sécurité de tous.</p>
        <Hov as="span" onClick={goReport} base={{ display: 'inline-block', marginTop: 24, cursor: 'pointer', fontSize: 15, fontWeight: 600, color: colors.greenDeep, background: colors.gold, borderRadius: 10, padding: '14px 30px' }} hover={{ background: colors.goldHover }}>
          Faire un signalement
        </Hov>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0c1a12', color: '#9fc6ac' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SentinelleLogo size={34} />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, letterSpacing: '.14em', fontSize: 14 }}>SENTINELLE</div>
              <div style={{ fontSize: 11 }}>Sous tutelle MINPOSTEL · ANTIC</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <span style={{ cursor: 'pointer' }} onClick={goReport}>Signaler</span>
            <span style={{ cursor: 'pointer' }}>Comprendre</span>
            <span style={{ cursor: 'pointer' }}>Confidentialité</span>
            <span style={{ cursor: 'pointer' }} onClick={goLogin}>Espace admin</span>
          </div>
          <div style={{ fontSize: 12, color: '#5e7a67' }}>© 2026 République du Cameroun</div>
        </div>
        <TricolorBar />
      </footer>
    </div>
  );
}
