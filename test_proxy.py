import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

FRONTEND_URL = "https://tavika-web-production-4fe2.up.railway.app"

try:
    print("Testing auth/exchange via frontend proxy...")
    # Send a dummy code, it should return 401, NOT 404 or 500
    res = requests.post(f"{FRONTEND_URL}/backend/auth/exchange", json={"code": "dummy"}, verify=False)
    print(res.status_code)
    print(res.text)
except Exception as e:
    print("Error:", e)
