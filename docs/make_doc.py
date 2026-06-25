# -*- coding: utf-8 -*-
"""Génère le document de projet SENTINELLE (sentinelle.pdf)."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors as C
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, Table, TableStyle,
)

GREEN = C.Color(0.04, 0.35, 0.17)
GREEN2 = C.Color(0.04, 0.49, 0.24)
GOLD = C.Color(0.99, 0.82, 0.09)
RED = C.Color(0.81, 0.07, 0.15)
GREY = C.Color(0.42, 0.46, 0.44)
INK = C.Color(0.10, 0.13, 0.11)
SOFT = C.Color(0.93, 0.96, 0.94)

styles = getSampleStyleSheet()
H1 = ParagraphStyle('H1', parent=styles['Heading1'], fontName='Helvetica-Bold',
                    fontSize=13, textColor=GREEN, spaceBefore=10, spaceAfter=5, leading=16)
BODY = ParagraphStyle('Body', parent=styles['Normal'], fontName='Helvetica',
                      fontSize=9.5, leading=13.5, textColor=INK, alignment=TA_JUSTIFY, spaceAfter=4)
BULLET = ParagraphStyle('Bullet', parent=BODY, leftIndent=4, spaceAfter=2)
SMALL = ParagraphStyle('Small', parent=BODY, fontSize=8.5, textColor=GREY)
TITLE = ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=22, textColor=INK, leading=24)
SUB = ParagraphStyle('Sub', fontName='Helvetica', fontSize=10.5, textColor=GREEN, leading=14)


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    third = w / 3
    for i, col in enumerate([GREEN2, RED, GOLD]):
        canvas.setFillColor(col)
        canvas.rect(i * third, h - 4, third, 4, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.setFont('Helvetica-Bold', 8)
    canvas.drawString(18 * mm, h - 11 * mm, 'SENTINELLE')
    canvas.setFillColor(GREY)
    canvas.setFont('Helvetica', 7.5)
    canvas.drawRightString(w - 18 * mm, h - 11 * mm, 'DOCUMENT DE PROJET · RÉPUBLIQUE DU CAMEROUN')
    canvas.setStrokeColor(C.Color(0.85, 0.87, 0.85))
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 14 * mm, w - 18 * mm, 14 * mm)
    canvas.setFillColor(GREY)
    canvas.setFont('Helvetica', 7.5)
    canvas.drawString(18 * mm, 10 * mm, 'SENTINELLE — Veille numérique nationale')
    canvas.drawRightString(w - 18 * mm, 10 * mm, f'Page {doc.page}')
    canvas.restoreState()


def bullets(rows):
    items = [ListItem(Paragraph(t, BULLET), leftIndent=10, value='•') for t in rows]
    return ListFlowable(items, bulletType='bullet', bulletColor=GREEN, start='•',
                        leftIndent=12, bulletFontSize=8)


def build():
    doc = SimpleDocTemplate(
        'sentinelle.pdf', pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm, topMargin=20 * mm, bottomMargin=18 * mm,
        title='SENTINELLE — Document de projet', author='SENTINELLE',
    )
    F = []
    F.append(Paragraph('SENTINELLE', TITLE))
    F.append(Spacer(1, 3))
    F.append(Paragraph("Plateforme souveraine de veille numérique et de détection des menaces en ligne", SUB))
    F.append(Spacer(1, 10))

    # 1
    F.append(Paragraph('1. Présentation de la start-up et du projet', H1))
    F.append(Paragraph(
        "SENTINELLE est une start-up spécialisée dans la <b>sûreté de l'information</b> et la "
        "<b>veille des réseaux sociaux</b>. Le projet SENTINELLE est une plateforme souveraine qui "
        "collecte, analyse et cartographie <b>en temps réel</b> les contenus publics circulant sur les "
        "réseaux sociaux et la presse en ligne, afin de détecter précocement les menaces à la sécurité "
        "et à la cohésion nationales. Elle fournit aux autorités un véritable centre d'opérations "
        "numériques (SOC) : tableau de bord national, cartographie des risques par région, alertes "
        "qualifiées, dossiers de preuve et rapports automatisés — le tout avec un contrôle d'accès par "
        "rôles et un journal d'audit conforme.", BODY))

    # 2
    F.append(Paragraph("2. Problème à résoudre & opportunité de marché", H1))
    F.append(bullets([
        "L'explosion des contenus en ligne <b>multilingues</b> (français, anglais, pidgin, fulfuldé, arabe…) "
        "rend toute surveillance manuelle impossible et tardive.",
        "La <b>désinformation</b>, la <b>propagande violente</b> et le <b>recrutement</b> en ligne "
        "menacent la stabilité (Extrême-Nord, régions du Nord-Ouest et Sud-Ouest, périodes électorales).",
        "Les solutions existantes sont <b>étrangères, coûteuses et non souveraines</b>, et inadaptées au "
        "contexte local (langues, géographie, acteurs).",
        "<b>Opportunité</b> : marché de la sécurité numérique en forte croissance en Afrique ; besoin des "
        "États, collectivités, médias et grandes entreprises d'outils de veille <b>souverains et adaptés</b>.",
    ]))

    # 3
    F.append(Paragraph('3. Le facteur innovant', H1))
    F.append(bullets([
        "<b>Moteur d'analyse contextualisé</b> : lexiques multilingues et <b>gazetier géographique du "
        "Cameroun</b> pour géolocaliser et prioriser les menaces région par région.",
        "<b>Détection des comportements coordonnés inauthentiques (CIB)</b> et des réseaux d'amplification.",
        "<b>Collecte sans App Review</b> via connecteurs publics (Apify, APIs officielles) → déploiement rapide.",
        "<b>Souveraineté</b> : architecture déployable on-premise, données maîtrisées, pipeline temps réel "
        "(collecte → NLP → alertes) avec <b>preuve à l'appui</b> exportable en PDF.",
        "Détection spécialisée (protection des mineurs, lutte contre la traite) par signaux lexicaux et emojis.",
    ]))

    # 4
    F.append(Paragraph('4. Résumé du projet', H1))
    F.append(Paragraph(
        "SENTINELLE se compose d'un <b>site public</b> (information et signalement citoyen anonyme) et d'un "
        "<b>back-office sécurisé</b> pour les analystes. Le pipeline relie des <b>connecteurs multi-réseaux</b> "
        "(Facebook, X, TikTok, Telegram, YouTube, LinkedIn, Instagram, Reddit, presse RSS) à un moteur qui "
        "<b>classe les menaces</b>, calcule un <b>score de criticité</b>, détecte la <b>langue</b> et "
        "<b>géolocalise</b> chaque contenu. Les dépassements de seuil génèrent des <b>alertes en temps réel</b>, "
        "consignées dans des dossiers et des rapports. La plateforme intègre un <b>RBAC</b> (six profils), un "
        "<b>journal d'audit immuable</b> et un cadre éthique. Un <b>MVP fonctionnel est déjà déployé</b> "
        "(application web + API).", BODY))

    # 5
    F.append(Paragraph('5. Cible & bénéficiaires', H1))
    F.append(bullets([
        "<b>Cible primaire</b> : institutions de sécurité et de défense, agences de cybersécurité (type ANTIC), "
        "ministères de tutelle (type MINPOSTEL).",
        "<b>Cible secondaire</b> : collectivités, organes de gestion électorale, médias et fact-checkers, "
        "ONG de cohésion sociale et de protection de l'enfance.",
        "<b>Bénéficiaires finaux</b> : les citoyens, protégés des contenus dangereux et dotés d'un canal de "
        "signalement anonyme et sécurisé.",
    ]))

    # 6
    F.append(Paragraph('6. Modèle économique', H1))
    F.append(bullets([
        "<b>B2G</b> — licences et abonnements annuels aux institutions (cœur de revenus).",
        "<b>SaaS par paliers</b> selon le volume de collecte, le nombre d'analystes et les connecteurs activés.",
        "<b>Services</b> — déploiement on-premise, intégration, <b>formation des analystes</b>, support.",
        "<b>Modules premium</b> — rapports automatisés, connecteurs additionnels, modèles d'IA avancés.",
        "<b>Coûts variables maîtrisés</b> : collecte facturée à l'usage (Apify/API), infrastructure mutualisée.",
    ]))

    # 7
    F.append(Paragraph('7. Équipe de projet', H1))
    F.append(Paragraph(
        "Une équipe pluridisciplinaire alliant ingénierie logicielle, expertise produit et design, "
        "au service d'une plateforme de veille souveraine.", BODY))
    F.append(Spacer(1, 4))
    team = [
        ['Membre', 'Rôle', 'Profil'],
        ['Koube Aristide', 'Fondateur & CEO', "Vision produit, stratégie, relations institutionnelles et partenariats."],
        ['Foka Emmanuel', 'CTO / Architecte', "Architecture logicielle, sécurité, DevOps, supervision technique."],
        ['Hervé Tatinou', 'Designer / UX', "Ergonomie institutionnelle, interfaces analystes et site public."],
    ]
    t = Table(team, colWidths=[28 * mm, 34 * mm, 112 * mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), C.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('FONTNAME', (0, 1), (1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 1), (-1, -1), INK),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C.white, SOFT]),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, C.Color(0.85, 0.87, 0.85)),
        ('GRID', (0, 0), (-1, 0), 0, C.white),
    ]))
    F.append(t)
    F.append(Spacer(1, 8))
    F.append(Paragraph(
        "Contact : elite1koube@gmail.com — SENTINELLE, plateforme de veille numérique nationale.", SMALL))

    doc.build(F, onFirstPage=header_footer, onLaterPages=header_footer)
    print('OK')


if __name__ == '__main__':
    build()
