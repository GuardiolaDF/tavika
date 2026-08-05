import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

FRONTEND_URL = "https://tavika-web-production-4fe2.up.railway.app"

try:
    print("Testing auth/dev-login via frontend proxy...")
    # dev-login requires the backend to be in dev/staging.
    # If the backend is in production, this will 404.
    res = requests.post(f"{FRONTEND_URL}/backend/auth/dev-login", json={"email": "guardiola.dario@gmail.com"}, verify=False)
    print(res.status_code)
    print(res.headers.get("set-cookie"))
except Exception as e:
    print("Error:", e)
