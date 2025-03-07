import string
import random
import os
import requests
import pytest

HOST_ADDRESS=os.getenv('HOST_ADDRESS', 'http://127.0.0.1:8000')

def generate_random_email():
    return 'user_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))+'@1.com'

EMAIL = generate_random_email()
PASSWORD = "password"

def get_email():
    return 'user_test@gmail.com'
    # return EMAIL

def register():
    url = HOST_ADDRESS + "/api/v1/user/register"
    name = "user"
    register_data = {"email": EMAIL, "nickname": name, "password": PASSWORD}
    res = requests.post(url=url, json=register_data)
    res = res.json()
    if res.get("code") != 0 and res.get("message").find("has already registered!") == -1:
        raise Exception(res.get("message"))

def login():
    url = HOST_ADDRESS + "/api/v1/user/login"
    login_data = {"email": EMAIL, "password": PASSWORD}
    response = requests.post(url=url, json=login_data)
    res = response.json()
    if res.get("code") != 0:
        raise Exception(res.get("message"))
    auth = response.get("data").get("access_token")
    return auth

@pytest.fixture(scope="session")
def token():
    register()
    auth = login()
    return auth