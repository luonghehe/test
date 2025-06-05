// tests/website-links.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://192.168.1.23:8080/auth-PM2';
const API_PREFIX = `${BASE_URL}/api/v1/users`;

test.describe('Website Links API Tests (GET /api/v1/users/{id})', () => {
  
});
