"""Génération de PDF (rapports & dossiers) via reportlab."""
import re
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

GREEN = (0.04, 0.35, 0.17)
GOLD = (0.99, 0.82, 0.09)
GREY = (0.35, 0.40, 0.45)


def render(title: str, lines: list[str], subtitle: str = "") -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    margin = 18 * mm
    y = h - margin

    # Bandeau tricolore
    for i, col in enumerate([(0.04, 0.49, 0.24), (0.81, 0.07, 0.15), (0.99, 0.82, 0.09)]):
        c.setFillColorRGB(*col)
        c.rect(margin + i * (w - 2 * margin) / 3, h - margin + 4, (w - 2 * margin) / 3, 4, fill=1, stroke=0)

    c.setFillColorRGB(*GREEN)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margin, y, "SENTINELLE — RÉPUBLIQUE DU CAMEROUN · CONFIDENTIEL")
    y -= 10 * mm
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, y, title[:80])
    y -= 7 * mm
    if subtitle:
        c.setFillColorRGB(*GREY)
        c.setFont("Helvetica", 9)
        c.drawString(margin, y, subtitle[:110])
        y -= 7 * mm

    c.setFillColorRGB(0, 0, 0)
    for raw in lines:
        if y < margin + 15 * mm:
            c.showPage()
            y = h - margin
            c.setFillColorRGB(0, 0, 0)
        line = re.sub(r"[#*_`]", "", raw).rstrip()
        if not line:
            y -= 3 * mm
            continue
        if line.startswith("## "):
            c.setFillColorRGB(*GREEN)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(margin, y, line[3:])
            c.setFillColorRGB(0, 0, 0)
            y -= 6 * mm
        elif line.startswith("# "):
            c.setFont("Helvetica-Bold", 13)
            c.drawString(margin, y, line[2:])
            y -= 7 * mm
        else:
            c.setFont("Helvetica", 9.5)
            for chunk in _wrap(line, 105):
                c.drawString(margin, y, chunk)
                y -= 5 * mm
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
