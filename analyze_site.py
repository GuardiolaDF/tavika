import ssl
import urllib.request
from bs4 import BeautifulSoup
import re

def analyze():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request('https://colegiosprivadosargentina.com/buenos-aires/adrogue/', headers={'User-Agent': 'Mozilla/5.0'})
    
    try:
        html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8', errors='ignore')
        
        soup = BeautifulSoup(html, 'html.parser')
        
        print("--- School Info Structure ---")
        h3s = soup.find_all('h3')
        if h3s:
            first_school = h3s[0]
            print(f"SCHOOL: {first_school.text.strip()}")
            # Print the next 5 siblings to see what they are
            current = first_school.next_sibling
            for _ in range(10):
                if current:
                    if current.name:
                        print(f"TAG: {current.name}, TEXT: {current.text.strip()}")
                    current = current.next_sibling
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze()
