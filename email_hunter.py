import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import re
import ssl
import time
from database import update_email_and_status, get_schools_by_status, get_all_fuentes, update_status

def _get_yahoo_links(query, ctx):
    url_query = urllib.parse.quote(query)
    url = f"https://search.yahoo.com/search?p={url_query}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=8) as response:
            html = response.read().decode('utf-8', errors='ignore')
            soup = BeautifulSoup(html, 'html.parser')
            links = []
            
            # Buscar en h3.title
            h3_tags = soup.find_all('h3', class_='title')
            for h3 in h3_tags:
                a = h3.find('a')
                if a:
                    href = a.get('href')
                    if href:
                        links.append(href)
            
            # Buscar en div.compTitle
            if not links:
                comp_titles = soup.find_all('div', class_='compTitle')
                for ct in comp_titles:
                    a = ct.find('a')
                    if a:
                        href = a.get('href')
                        if href:
                            links.append(href)
                            
            # Decodificar redirecciones de Yahoo
            decoded_links = []
            for href in links:
                match = re.search(r'/RU=([^/]+)', href)
                if match:
                    decoded_links.append(urllib.parse.unquote(match.group(1)))
                else:
                    decoded_links.append(href)
            return decoded_links
    except Exception:
        return []

def _extract_email_from_url(url, ctx, ignore_domains=None, depth=0):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=8) as res:
            html = res.read().decode('utf-8', errors='ignore')
            emails = set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html))
            
            # Clean URL domain for checking
            url_domain = urllib.parse.urlparse(url).netloc.lower()
            if url_domain.startswith('www.'):
                url_domain = url_domain[4:]
                
            valid_emails = []
            for e in emails:
                e_lower = e.lower()
                if e_lower.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.css', '.js')):
                    continue
                
                email_domain = e_lower.split('@')[-1]
                
                # 1. Ignorar si el correo pertenece al dominio de una fuente secundaria (directorio)
                if ignore_domains:
                    if any(email_domain == idom or email_domain.endswith('.' + idom) for idom in ignore_domains):
                        continue
                        
                # 2. Ignorar si pertenece al dominio del sitio actual y es un directorio genérico conocido
                known_directories = [
                    'facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'pinterest', 
                    'cylex', 'paginasamarillas', 'todosnegocios', 'firmania', 'guiaurbana', 
                    'near-place', 'escuelasyjardines', 'colegiosenbuenosaires', 'micole', 
                    'guiaescuela', 'ifts1', 'wordpress', 'blogspot', 'github'
                ]
                if any(dir_name in url_domain for dir_name in known_directories):
                    if email_domain == url_domain or email_domain.endswith('.' + url_domain):
                        continue
                
                valid_emails.append(e_lower)
                
            if valid_emails:
                return valid_emails[0]
                
            # Si estamos en la página inicial y no hay email, buscamos subpáginas de contacto
            if depth == 0:
                soup = BeautifulSoup(html, 'html.parser')
                contact_links = []
                for a in soup.find_all('a', href=True):
                    href = a['href']
                    text = a.get_text().lower()
                    href_lower = href.lower()
                    if 'contacto' in text or 'contact' in text or 'contacto' in href_lower or 'contact' in href_lower or 'escribinos' in text:
                        abs_url = urllib.parse.urljoin(url, href)
                        # Evitar salir del dominio principal
                        if urllib.parse.urlparse(abs_url).netloc == urllib.parse.urlparse(url).netloc:
                            contact_links.append(abs_url)
                
                # Probar las primeras 2 subpáginas de contacto encontradas
                for c_link in list(set(contact_links))[:2]:
                    found = _extract_email_from_url(c_link, ctx, ignore_domains, depth=1)
                    if found:
                        return found
    except Exception:
        pass
    return None

def hunt_for_emails():
    """
    Busca colegios en estado "Rebotado".
    Etapa 1: Busca en fuentes secundarias (site:).
    Etapa 2: Busca en web general (Yahoo).
    Etapa 3: Marca como Inubicable.
    """
    schools_to_hunt = get_schools_by_status("Rebotado")
    
    if not schools_to_hunt:
        return True, "No hay correos rebotados que buscar.", 0

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    updated_count = 0
    fuentes = get_all_fuentes()
    # Extraemos la lista de dominios a ignorar de la tabla de fuentes
    ignore_domains = [f[1].lower().strip() for f in fuentes] if fuentes else []
    
    for school in schools_to_hunt:
        s_id = school[0]
        s_name = school[1]
        s_loc = school[3]
        
        found_email = None
        
        # Etapa 1: Fuentes Secundarias (Búsqueda restringida)
        # Removemos las comillas para evitar fallas por tildes o variaciones ortográficas
        if fuentes:
            site_query = " OR ".join([f"site:{f[1]}" for f in fuentes])
            query_etapa1 = f'{s_name} {s_loc} ({site_query})'
            
            links_e1 = _get_yahoo_links(query_etapa1, ctx)
            for link in links_e1[:2]:
                found_email = _extract_email_from_url(link, ctx, ignore_domains)
                if found_email:
                    break
                    
        # Etapa 2: Búsqueda Libre
        if not found_email:
            time.sleep(1)
            query_etapa2 = f'{s_name} {s_loc} Buenos Aires sitio web oficial contacto'
            links_e2 = _get_yahoo_links(query_etapa2, ctx)
            for link in links_e2[:2]:
                found_email = _extract_email_from_url(link, ctx, ignore_domains)
                if found_email:
                    break
        
        # Guardar resultados
        if found_email:
            update_email_and_status(s_id, found_email, "Actualizado", "Web Scraping")
            updated_count += 1
        else:
            # Etapa 3: Inubicable
            update_status(s_id, "Inubicable")
            
        time.sleep(2) # Anti-ban general para Yahoo
            
    return True, f"Búsqueda finalizada. Se encontraron {updated_count} correos nuevos de {len(schools_to_hunt)} rebotados.", updated_count
