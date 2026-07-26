import imaplib
import email
import re
from datetime import datetime, timedelta

def get_bounced_emails(credentials, days_back=7):
    username, password = credentials
    bounced_emails = set()
    
    try:
        # Connect to the server
        mail = imaplib.IMAP4_SSL('imap.gmail.com')
        mail.login(username, password)
        # Calculate date for search
        date_since = (datetime.now() - timedelta(days=days_back)).strftime("%d-%b-%Y")
        
        # We perform multiple searches to be extremely robust across different systems
        search_queries = [
            f'(SINCE "{date_since}" FROM "mailer-daemon")',
            f'(SINCE "{date_since}" FROM "postmaster")',
            f'(SINCE "{date_since}" SUBJECT "delivery status")',
            f'(SINCE "{date_since}" SUBJECT "failure notice")'
        ]
        
        folders_to_check = ['inbox', '"[Gmail]/Spam"', '"[Gmail]/Correo no deseado"', '"[Google Mail]/Spam"']
        
        for folder in folders_to_check:
            try:
                status, _ = mail.select(folder)
                if status != 'OK':
                    continue
                
                mail_ids = set()
                for query in search_queries:
                    status, data = mail.search(None, query)
                    if status == 'OK' and data[0]:
                        mail_ids.update(data[0].split())
                
                for mail_id in mail_ids:
                    status, msg_data = mail.fetch(mail_id, '(RFC822)')
                    if status != 'OK':
                        continue
                        
                    for response_part in msg_data:
                        if isinstance(response_part, tuple):
                            msg = email.message_from_bytes(response_part[1])
                            
                            body = ""
                            if msg.is_multipart():
                                for part in msg.walk():
                                    if part.get_content_type() in ["text/plain", "text/html"]:
                                        try:
                                            body += part.get_payload(decode=True).decode(errors='ignore')
                                        except:
                                            pass
                            else:
                                try:
                                    body = msg.get_payload(decode=True).decode(errors='ignore')
                                except:
                                    pass
                                    
                            # Parse headers of the bounce itself (like To, Subject)
                            subject = msg.get('Subject', '')
                            
                            # Strategy 1: Specific known headers
                            match1 = re.search(r'Your message to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', body, re.IGNORECASE)
                            match2 = re.search(r'Final-Recipient:\s*rfc822;\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', body, re.IGNORECASE)
                            match3 = re.search(r'no se ha podido entregar a\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', body, re.IGNORECASE)
                            
                            if match1:
                                bounced_emails.add(match1.group(1).lower())
                            elif match2:
                                bounced_emails.add(match2.group(1).lower())
                            elif match3:
                                bounced_emails.add(match3.group(1).lower())
                            else:
                                # Strategy 2: Fallback to extracting all email addresses in body
                                # and filtering out common system and sender addresses
                                all_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', body)
                                for addr in all_emails:
                                    addr_lower = addr.lower()
                                    # Skip system domains and sender email
                                    skip = False
                                    if addr_lower == username.lower():
                                        skip = True
                                    for pattern in ['mailer-daemon', 'postmaster', 'google', 'gmail', 'noreply', 'no-reply', 'feedback', 'microsoft', 'outlook']:
                                        if pattern in addr_lower:
                                            skip = True
                                    if not skip:
                                        bounced_emails.add(addr_lower)
            except Exception:
                pass
                
        mail.logout()
        return True, f"Se encontraron {len(bounced_emails)} correos rebotados en tu bandeja.", list(bounced_emails)
        
    except imaplib.IMAP4.error as e:
        return False, f"Error de autenticación IMAP. Verifica que IMAP esté habilitado en Gmail y tu contraseña sea correcta.", []
    except Exception as e:
        return False, f"Error inesperado: {e}", []
