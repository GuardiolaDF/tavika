from abc import ABC, abstractmethod
import os
import resend

class BaseEmailProvider(ABC):
    @abstractmethod
    def send_email(self, to: str, subject: str, text_body: str, html_body: str, reply_to: str, attachment_bytes: bytes = None, attachment_name: str = None) -> dict:
        """Envia un email y devuelve la respuesta del proveedor o levanta una excepción."""
        pass

class ResendProvider(BaseEmailProvider):
    def __init__(self):
        resend.api_key = os.getenv("RESEND_API_KEY", "")

    def send_email(self, to: str, subject: str, text_body: str, html_body: str, reply_to: str, attachment_bytes: bytes = None, attachment_name: str = None) -> dict:
        params = {
            "from": "Távika <bot@mail.tavika.com.ar>",
            "to": [to],
            "subject": subject,
            "text": text_body,
            "html": html_body,
            "reply_to": reply_to
        }
        
        if attachment_bytes and attachment_name:
            params["attachments"] = [
                {
                    "filename": attachment_name,
                    "content": list(attachment_bytes)
                }
            ]

        email_response = resend.Emails.send(params)
        return email_response
