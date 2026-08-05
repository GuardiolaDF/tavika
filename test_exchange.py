import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_URL = "https://tavika-backend-production.up.railway.app"

print("Testing dev-login to see cookies...")
res = requests.post(f"{API_URL}/auth/dev-login", json={"email": "guardiola.dario@gmail.com"}, verify=False)
print(res.status_code)
print(res.text)
print(res.headers.get("set-cookie"))

if res.status_code == 200:
    cookie = res.headers.get("set-cookie")
    if cookie:
        cookie_val = cookie.split(";")[0]
        headers = {"Cookie": cookie_val}
        print("Testing auth/me with cookie...")
        res2 = requests.get(f"{API_URL}/auth/me", headers=headers, verify=False)
        print(res2.status_code)
        print(res2.text)
