#!/bin/bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\",\"captchaId\":\"test\",\"captchaCode\":\"1234\"}"
