from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import threading
import time
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/test")
def test():
    return {"status": "ok"}

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8123, log_level="error")

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(2)

try:
    res = requests.options("http://127.0.0.1:8123/test", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST"
    })
    print("OPTIONS:", res.status_code, res.headers)
except Exception as e:
    print("Error:", e)
