#!/bin/bash

# Test form submission
echo "Testing contact form submission..."

# Get CSRF token from the contact page
RESPONSE=$(curl -s -c cookies.txt http://localhost/contact)
TOKEN=$(echo "$RESPONSE" | grep -oP '(?<=_token" value=")[^"]*' | head -1)

if [ -z "$TOKEN" ]; then
    echo "Could not find CSRF token"
    exit 1
fi

echo "Found CSRF token: $TOKEN"

# Submit the form
curl -X POST http://localhost/!/forms/contact \
    -b cookies.txt \
    -H "Accept: application/json" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "_token=$TOKEN" \
    -d "name=Test User" \
    -d "email=test@example.com" \
    -d "phone=123-456-7890" \
    -d "subject=Test Subject" \
    -d "message=This is a test message from the script" \
    -d "winnie=" \
    -v 2>&1 | tail -20

rm cookies.txt