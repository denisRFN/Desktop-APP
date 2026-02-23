import requests
from datetime import datetime
import certifi
import os
import urllib3
BASE_URL = os.getenv("PONTAJ_API_URL", "http://127.0.0.1:8000")
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def save_hours(overtime_data, permission_data):
    data_dict = {
        "overtime": {str(k): v for k, v in overtime_data.items()},
        "permission": {str(k): v for k, v in permission_data.items()}
    }

    requests.post(f"{BASE_URL}/save-hours", json=data_dict, verify=False)


def load_hours(overtime_data, permission_data):
    response = requests.get(f"{BASE_URL}/all", verify=False)
    data = response.json().get("hours", {})

    for k, v in data.get("overtime", {}).items():
        overtime_data[datetime.strptime(k, "%Y-%m-%d").date()] = v

    for k, v in data.get("permission", {}).items():
        permission_data[datetime.strptime(k, "%Y-%m-%d").date()] = v


def save_calendar_events(zile_prezente, zile_concediu, zile_wfh):
    data_dict = {
        "prezente": [str(day) for day in zile_prezente],
        "concediu": [str(day) for day in zile_concediu],
        "wfh": [str(day) for day in zile_wfh]
    }

    requests.post(f"{BASE_URL}/save-calendar", json=data_dict, verify=False)


def load_calendar_events(zile_prezente, zile_concediu, zile_wfh):
    response = requests.get(f"{BASE_URL}/all", verify=False)
    data = response.json().get("calendar", {})

    for day_str in data.get("prezente", []):
        zile_prezente.add(datetime.strptime(day_str, "%Y-%m-%d").date())

    for day_str in data.get("concediu", []):
        zile_concediu.add(datetime.strptime(day_str, "%Y-%m-%d").date())

    for day_str in data.get("wfh", []):

        zile_wfh.add(datetime.strptime(day_str, "%Y-%m-%d").date())
