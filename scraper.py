import ssl
import urllib.request
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin
from config import BASE_URL, PROVINCE_URL, HEADERS

def get_html(url):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        response = urllib.request.urlopen(req, context=ctx, timeout=10)
        return response.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error accediendo a {url}: {e}")
        return None

def get_cities():
    """Obtiene la lista de ciudades de Buenos Aires y sus links."""
    html = get_html(PROVINCE_URL)
    if not html:
        return {}
    
    soup = BeautifulSoup(html, 'html.parser')
    cities = {}
    
    for a in soup.find_all('a', href=True):
        href = a['href']
        if '/buenos-aires/' in href and href != f"{BASE_URL}/buenos-aires/" and href != f"{BASE_URL}/buenos-aires/la-plata/" and href != f"{BASE_URL}/buenos-aires/mar-del-plata/":
            # La Plata and Mar del Plata are sometimes in the sidebar globally, but let's just include all /buenos-aires/ anyway
            pass
            
        if '/buenos-aires/' in href and href != f"{BASE_URL}/buenos-aires/":
            city_slug = href.strip('/').split('/')[-1]
            city_name = city_slug.replace('-', ' ').title()
            if city_name and city_name not in cities:
                cities[city_name] = href
                
    # Sort alphabetically
    return dict(sorted(cities.items()))

def search_email_in_website(url):
    """Busca un email en la página principal de un colegio."""
    if not url or url == "No disponible":
        return ""
    
    html = get_html(url)
    if not html:
        return ""
    
    # Buscar emails con regex
    emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", html)
    valid_emails = set()
    for email in emails:
        email = email.lower()
        if not any(x in email for x in ['.png', '.jpg', '.jpeg', '.gif', 'sentry', 'wix', 'example', 'sitioweb']):
            valid_emails.add(email)
            
    if valid_emails:
        return list(valid_emails)[0]
    return ""

def get_schools_from_city(city_name, city_url):
    """Extrae la información de los colegios de una ciudad dada."""
    html = get_html(city_url)
    if not html:
        return []
    
    soup = BeautifulSoup(html, 'html.parser')
    schools = []
    
    for h3 in soup.find_all('h3'):
        school_name = h3.text.strip()
        
        if school_name.startswith('¿') or school_name.startswith('Otras '):
            continue
            
        school_data = {
            "Colegio": school_name,
            "Localidad": city_name,
            "Direccion": "",
            "Telefono": "",
            "Web": "",
            "Email": ""
        }
        
        current = h3.next_sibling
        for _ in range(5):
            if current and current.name == 'div':
                text = current.text
                if 'Dirección' in text:
                    addr_match = re.search(r'Dirección(.*?)Teléfono', text, re.DOTALL)
                    if addr_match:
                        school_data["Direccion"] = addr_match.group(1).strip()
                if 'Teléfono' in text:
                    phone_match = re.search(r'Teléfono(.*?)Página web', text, re.DOTALL)
                    if not phone_match:
                        phone_match = re.search(r'Teléfono(.*)', text, re.DOTALL)
                    if phone_match:
                        school_data["Telefono"] = phone_match.group(1).strip()
                
                web_link = current.find('a', href=True)
                if web_link:
                    school_data["Web"] = web_link['href']
                else:
                    web_match = re.search(r'Página web(.*)', text, re.IGNORECASE)
                    if web_match:
                        raw_web = web_match.group(1).strip()
                        if raw_web.startswith('http') or raw_web.startswith('www'):
                            school_data["Web"] = raw_web
                break
            if current:
                current = current.next_sibling
                
        schools.append(school_data)
        
    return schools
