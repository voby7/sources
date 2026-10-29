import requests
import time
import random

TOKEN = "" 
CHANNEL_ID = ""

HEADERS = {
    "Authorization": TOKEN,
    "Content-Type": "application/json"
}

def get_active_users():
    print("Scraping users...")
    url = f"https://discord.com/api/v9/channels/{CHANNEL_ID}/messages?limit=100"
    r = requests.get(url, headers=HEADERS)
    if r.status_code == 200:
        messages = r.json()
        user_ids = list(set([
            m['author']['id'] 
            for m in messages 
            if not m['author'].get('bot', False)
        ]))
        print(f"Targeting {len(user_ids)} users.")
        return user_ids
    else:
        print(f"Scrape failed (Error {r.status_code}). Check your token.")
        return []

def send_burst(user_list):
    url = f"https://discord.com/api/v9/channels/{CHANNEL_ID}/messages"
    
    targets = random.sample(user_list, min(25, len(user_list)))
    
    content = " ".join([f"<@{u_id}>" for u_id in targets])
    
    res = requests.post(url, headers=HEADERS, json={"content": content})
    
    if res.status_code == 200:
        msg_id = res.json()['id']
        print(f"Burst sent to {len(targets)} users.")
        
        time.sleep(random.uniform(0.1, 0.9))
        requests.delete(f"{url}/{msg_id}", headers=HEADERS)
        return True
    elif res.status_code == 429:
        retry = res.json().get('retry_after', 5)
        print(f"Rate limited! Waiting {retry} seconds...")
        time.sleep(retry)
    return False

active_users = get_active_users()

if active_users:
    print("Starting Burst Ghost-Pings. Press Stop to quit.")
    try:
        while True:
            send_burst(active_users)
            time.sleep(0.9) 
    except KeyboardInterrupt:
        print("Stopped.")
else:
    print("No users found to target.")