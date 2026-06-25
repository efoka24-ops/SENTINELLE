"""Génération de PDF (rapports & dossiers) via reportlab — mise en page institutionnelle."""
import re
from datetime import datetime, timezone
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

GREEN = (0.04, 0.35, 0.17)
GREEN_SOFT = (0.92, 0.96, 0.93)
GOLD = (0.99, 0.82, 0.09)
RED = (0.81, 0.07, 0.15)
GREY = (0.42, 0.46, 0.44)
INK = (0.10, 0.13, 0.11)

MARGIN = 18 * mm


def _header(c, w, h):
    """Bandeau tricolore + intitulé (haut de chaque page)."""
    band_h = 4
    third = w / 3
    for i, col in enumerate([(0.04, 0.49, 0.24), RED, GOLD]):
        c.setFillColorRGB(*col)
        c.rect(i * third, h - band_h, third, band_h, fill=1, stroke=0)
    c.setFillColorRGB(*GREEN)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, h - 11 * mm, "SENTINELLE")
    c.setFillColorRGB(*GREY)
    c.setFont("Helvetica", 7.5)
    c.drawRightString(w - MARGIN, h - 11 * mm, "RÉPUBLIQUE DU CAMEROUN · DOCUMENT CONFIDENTIEL")
    c.setStrokeColorRGB(*GREEN)
    c.setLineWidth(0.5)
    c.line(MARGIN, h - 13 * mm, w - MARGIN, h - 13 * mm)


def _footer(c, w, page_num):
    c.setStrokeColorRGB(0.85, 0.87, 0.85)
    c.setLineWidth(0.5)
    c.line(MARGIN, 14 * mm, w - MARGIN, 14 * mm)
    c.setFillColorRGB(*GREY)
    c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN, 10 * mm, "Confidentiel — usage réservé aux autorités compétentes")
    c.drawRightString(w - MARGIN, 10 * mm, f"Page {page_num}")
    c.drawCentredString(w / 2, 10 * mm, datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC"))


def render(title: str, lines: list[str], subtitle: str = "") -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    page = 1
    content_top = h - 22 * mm
    content_bottom = 18 * mm

    _header(c, w, h)

    # Bloc titre
    y = content_top
    c.setFillColorRGB(*INK)
    c.setFont("Helvetica-Bold", 17)
    for chunk in _wrap(title, 60):
        c.drawString(MARGIN, y, chunk)
        y -= 8 * mm
    if subtitle:
        c.setFillColorRGB(*GREY)
        c.setFont("Helvetica", 9)
        c.drawString(MARGIN, y, subtitle[:120])
        y -= 6 * mm
    c.setStrokeColorRGB(*GREEN)
    c.setLineWidth(1.4)
    c.line(MARGIN, y, MARGIN + 38 * mm, y)
    y -= 8 * mm

    def new_page():
        nonlocal y, page
        _footer(c, w, page)
        c.showPage()
        page += 1
        _header(c, w, h)
        y = content_top

    for raw in lines:
        if y < content_bottom + 8 * mm:
            new_page()
        line = re.sub(r"[#*_`]", "", raw).rstrip()
        if not line:
            y -= 3 * mm
            continue

        if line.startswith("## ") or raw.startswith("## "):
            text = line[3:] if line.startswith("## ") else line
            y -= 2 * mm
            c.setFillColorRGB(*GREEN)
            c.setFont("Helvetica-Bold", 11.5)
            c.drawString(MARGIN, y, text)
            c.setStrokeColorRGB(0.80, 0.88, 0.82)
            c.setLineWidth(0.5)
            c.line(MARGIN, y - 2 * mm, w - MARGIN, y - 2 * mm)
            y -= 7 * mm
        elif line.startswith("# ") or raw.startswith("# "):
            text = line[2:] if line.startswith("# ") else line
            c.setFillColorRGB(*INK)
            c.setFont("Helvetica-Bold", 13)
            c.drawString(MARGIN, y, text)
            y -= 7 * mm
        elif line.lstrip().startswith(("- ", "• ", "→ ")):
            body = line.lstrip()[2:].strip()
            c.setFillColorRGB(*GREEN)
            c.setFont("Helvetica-Bold", 9.5)
            c.drawString(MARGIN + 2 * mm, y, "•")
            c.setFillColorRGB(*INK)
            c.setFont("Helvetica", 9.5)
            for chunk in _wrap(body, 98):
                c.drawString(MARGIN + 7 * mm, y, chunk)
                y -= 5 * mm
                if y < content_bottom + 8 * mm:
                    new_page()
        else:
            c.setFillColorRGB(*INK)
            c.setFont("Helvetica", 9.5)
            for chunk in _wrap(line, 104):
                c.drawString(MARGIN, y, chunk)
                y -= 5 * mm
                if y < content_bottom + 8 * mm:
                    new_page()

    _footer(c, w, page)
    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()


def _wrap(text: str, width: int) -> list[str]:
    out, cur = [], ""
    for word in text.split(" "):
        if len(cur) + len(word) + 1 > width:
            out.append(cur)
            cur = word
        else:
            cur = f"{cur} {word}".strip()
    if cur:
        out.append(cur)
    return out or [""]
