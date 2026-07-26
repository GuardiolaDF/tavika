import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os
import re
import random
import time

def send_emails(credentials, selected_schools, cv_path, subject, body_template, progress_callback=None):
    """
    credentials: tuple (email, app_password)
    selected_schools: list of tuples (id, email, nombre)
    cv_path: path to the PDF file
    subject: string
    body_template: string
    """
    sender_email, sender_password = credentials
    
    if not cv_path or not os.path.exists(cv_path):
        return False, f"No se encontró el archivo de CV: {cv_path}. Revisa la configuración.", [], []
        
    try:
        with open(cv_path, "rb") as f:
            cv_data = f.read()
    except Exception as e:
        return False, f"Error leyendo el CV: {e}", [], []

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
    except Exception as e:
        return False, f"Error conectando a Gmail: {e}", [], []

    success_ids = []
    failed_ids = []
    
    total = len(selected_schools)

    for i, (school_id, target_email_str, school_name) in enumerate(selected_schools, 1):
        if progress_callback:
            progress_callback(f"Enviando correo {i} de {total}... ({school_name})")
            
        valid_emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', str(target_email_str))
        
        if not valid_emails:
            failed_ids.append((school_id, "No email"))
            continue
            
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = ", ".join(valid_emails)
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body_template, 'plain'))
        
        pdf_attachment = MIMEApplication(cv_data, _subtype="pdf")
        pdf_attachment.add_header('Content-Disposition', 'attachment', filename=os.path.basename(cv_path))
        msg.attach(pdf_attachment)

        try:
            server.send_message(msg)
            success_ids.append(school_id)
            if i < total:
                delay = random.uniform(8.0, 18.0)
                if progress_callback:
                    progress_callback(f"Anti-Spam: Pausando {int(delay)}s antes del próximo envío...")
                time.sleep(delay)
        except Exception as e:
            failed_ids.append((school_id, str(e)))
            
    server.quit()
    return True, f"Se enviaron {len(success_ids)} correos exitosamente. Hubo {len(failed_ids)} errores.", success_ids, failed_ids
