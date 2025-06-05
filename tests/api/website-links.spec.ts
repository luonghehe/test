// tests/website-links.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://192.168.1.23:8080/auth-PM2';
const API_PREFIX = `${BASE_URL}/api/v1/website-links`;

test.describe('GET /website-links/{id} - Test API', () => {
  test('TC01 - ID hợp lệ (id=1) → 200', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/1`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('metadata');
    expect(body.data).toHaveProperty('id', 1);
  });

  test('TC02 - ID không tồn tại (id=9999) → 404 hoặc null', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/9999`);
    const status = res.status();

    if (status !== 200 && status !== 404) {
      const body = await res.text();
      throw new Error(`❌ Unexpected status: ${status}\nResponse body: ${body}`);
    }

    if (status === 200) {
      const body = await res.json();
      expect(body.data === null || body.data === {}).toBe(true);
    }
  });

  test('TC03 - ID âm (id=-5) → 400', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/-5`);
    expect(res.status()).toBe(400);
  });

  test('TC04 - ID sai định dạng (id="abc") → 400', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/abc`);
    expect(res.status()).toBe(400);
  });

  test('TC05 - Không truyền ID → 404', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/`);
    expect(res.status()).toBe(404);
  });

  test('TC06 - Không có token → 401', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/1`, {
      headers: { Authorization: '' }
    });
    expect(res.status()).toBe(401);
  });

  test('TC07 - Token không đủ quyền → 403', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/1`, {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    const status = res.status();
    if (status !== 401 && status !== 403) {
      const body = await res.text();
      throw new Error(`❌ Unexpected status: ${status}\nResponse body: ${body}`);
    }
  });

  test('TC08 - Server lỗi (gây lỗi thủ công) → 500', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/-999`);
    const status = res.status();
    if (status !== 400 && status !== 500) {
      const body = await res.text();
      throw new Error(`❌ Unexpected status: ${status}\nResponse body: ${body}`);
    }
  });

  test('TC09 - Kiểm tra structure response', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/1`);
    const body = await res.json();
    expect(body).toHaveProperty('metadata');
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('error');
  });

  test('TC10 - Kiểm tra thời gian phản hồi < 1s', async ({ request }) => {
    const start = Date.now();
    const res = await request.get(`${API_PREFIX}/1`);
    const duration = Date.now() - start;
    expect(duration).toBeLessThanOrEqual(1000);
  });
});
