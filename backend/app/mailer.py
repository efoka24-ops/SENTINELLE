"""Envoi d'e-mails réels via SMTP (rapports / notifications)."""
import smtplib
import ssl
from email.message import EmailMessage

from .config import settings


def is_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def test_connection() -> tuple[bool, str]:
    """Teste la connexion + l'authentification SMTP sans envoyer d'e-mail."""
    if not is_configured():
        return False, "SMTP non configuré"
    try:
        if settings.SMTP_TLS == "ssl":
            srv = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12,
                                   context=ssl.create_default_context())
        else:
            srv = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
            if settings.SMTP_TLS == "starttls":
                srv.starttls(context=ssl.create_default_context())
        srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        srv.quit()
        return True, "OK"
    except Exception as exc:
        return False, str(exc)


def send(to: list[str], subject: str, body: str,
         attachment: tuple[str, bytes] | None = None) -> tuple[bool, str]:
    """Envoie un e-mail. `attachment` = (nom_fichier, contenu_pdf)."""
    if not is_configured():
        return False, "SMTP non configuré"
    if not to:
        return False, "Aucun destinataire"
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = ", ".join(to)
    msg["Subject"] = subject
    msg.set_content(body)
    if attachment:
        name, data = attachment
        msg.add_attachment(data, maintype="application", subtype="pdf", filename=name)
    try:
        if settings.SMTP_TLS == "ssl":
            srv = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20,
                                   context=ssl.create_default_context())
        else:
            srv = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20)
            if settings.SMTP_TLS == "starttls":
                srv.starttls(context=ssl.create_default_context())
        srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        srv.send_message(msg)
        srv.quit()
        return True, "envoyé"
    except Exception as exc:
        return False, str(exc)
