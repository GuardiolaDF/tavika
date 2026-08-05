import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import time
import urllib.parse

BACKEND_URL = "https://tavika-backend-production.up.railway.app"
FRONTEND_URL = "https://tavika-web-production-4fe2.up.railway.app"

s = requests.Session()
s.verify = False

print("1. Initiating dev-login (simulates oauth callback)")
# dev-login generates the exchange token and redirects
# Actually dev-login is disabled in prod.
print("We cannot use dev-login in prod. So we can't get an exchange token.")

