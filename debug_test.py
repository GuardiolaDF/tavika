import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_URL = "https://tavika-backend-production.up.railway.app"

try:
    print("1. Testing auth/me without token...")
    res = requests.get(f"{API_URL}/auth/me", verify=False)
    print(res.status_code, res.text)

    print("\n2. Testing /auth/login...")
    res = requests.get(f"{API_URL}/auth/login", allow_redirects=False, verify=False)
    print(res.status_code)
    print(res.headers.get("Location"))
    print(res.headers.get("set-cookie"))
except Exception as e:
    print("Error:", e)
