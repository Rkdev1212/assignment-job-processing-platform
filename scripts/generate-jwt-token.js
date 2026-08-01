#!/usr/bin/env node
/**
 * Generate JWT Token for Testing
 * 
 * Usage: node scripts/generate-jwt-token.js
 */

const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const payload = {
  sub: 'test-user-123',
  username: 'testuser',
  iat: Math.floor(Date.now() / 1000),
};

const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('\n=== JWT Token for Testing ===\n');
console.log('Token:');
console.log(token);
console.log('\nUse this token in Authorization header:');
console.log(`Authorization: Bearer ${token}`);
console.log('\nToken payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('\nToken expires in: 24 hours');
console.log('\nExample curl command:');
console.log(`curl -X POST http://localhost:3000/api/v1/jobs \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"email.send","payload":{"to":"test@example.com"}}'`);
console.log('\n');
