import requests
import json

# Registration endpoint
url = 'http://127.0.0.1:8000/api/auth/register/'

# Test registration data
user_data = {
    'username': 'testuser123',
    'email': 'testuser123@example.com',
    'password': 'SecurePassword123!',
    'verify_email': True
}

# Make the request
print('Sending registration request with data:')
print(json.dumps(user_data, indent=2))
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, json=user_data, headers=headers)
    print(f'\nStatus Code: {response.status_code}')
    print('Response Headers:')
    print(json.dumps(dict(response.headers), indent=2))
    
    if response.text:
        try:
            print('\nResponse JSON:')
            print(json.dumps(response.json(), indent=2))
        except json.JSONDecodeError:
            print('\nResponse Text:')
            print(response.text)
    else:
        print('\nEmpty response body')
        
except requests.exceptions.RequestException as e:
    print(f'Request failed: {e}')
