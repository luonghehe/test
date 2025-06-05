// tests/departments.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://192.168.1.23:8080/auth-PM2';
const API_PREFIX = `${BASE_URL}/api/v1/departments`;

test.describe('Departments API Tests (Structure: { metadata, data, error })', () => {
  //
  // I. GET /api/v1/departments — Tìm kiếm phòng ban
  //
  test.describe('I. GET /api/v1/departments — Tìm kiếm phòng ban', () => {
    test('TC_GET_DEPT_01 - Lấy danh sách mặc định (pageSize=50, pageNumber=0)', async ({ request }) => {
      const response = await request.get(API_PREFIX);
      expect(response.status()).toBe(200);

      const body = await response.json();
      // Kiểm tra metadata
      expect(body).toHaveProperty('metadata');
      expect(body.metadata).toHaveProperty('httpCode', 200);
      expect(body.metadata).toHaveProperty('path', '/api/v1/departments');
      expect(body.metadata).toHaveProperty('message', 'OK');
      // Kiểm tra data structure
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('content');
      expect(Array.isArray(body.data.content)).toBe(true);
      expect(body.data).toHaveProperty('totalElements');
      // Mặc định server trả pageSize=50, pageNumber=0 (nếu có)
      // Nếu endpoint không embed pageNumber/pageSize, chỉ kiểm totalElements tồn tại
    });

    test('TC_GET_DEPT_02 - Lọc theo tên phòng ban (name="Kỹ thuật")', async ({ request }) => {
      const response = await request.get(API_PREFIX, {
        params: { name: 'Kỹ thuật' }
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);
      // Kiểm tất cả phần tử trong content có name chứa "Kỹ thuật"
      for (const dept of body.data.content) {
        expect(dept.name.toLowerCase()).toContain('kỹ thuật');
      }
    });

    test('TC_GET_DEPT_03 - Lọc theo độ sâu tối đa (maxDepth=2)', async ({ request }) => {
      const response = await request.get(API_PREFIX, {
        params: { maxDepth: '2' }
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);
      // Kiểm mỗi item có trường level <= 2
      for (const dept of body.data.content) {
        expect(typeof dept.level).toBe('number');
        expect(dept.level).toBeLessThanOrEqual(2);
      }
    });

    test('TC_GET_DEPT_04 - Sai kiểu dữ liệu pageNumber ("abc") → 400', async ({ request }) => {
      const response = await request.get(API_PREFIX, {
        params: { pageNumber: 'abc' }
      });
      expect(response.status()).toBe(400);
    });

    test('TC_GET_DEPT_05 - pageSize âm (pageSize=-1) → 400', async ({ request }) => {
      const response = await request.get(API_PREFIX, {
        params: { pageSize: '-1' }
      });
      expect(response.status()).toBe(400);
    });
  });

  //
  // II. GET /api/v1/departments/tree — Lấy cây phân cấp phòng ban
  //
  test.describe('II. GET /api/v1/departments/tree — Lấy cây phân cấp phòng ban', () => {
    test('TC_GET_TREE_01 - Lấy danh sách mặc định (pageSize=50, pageNumber=0)', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/tree`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);
      // Kiểm structure data
      expect(body.data).toHaveProperty('content');
      expect(Array.isArray(body.data.content)).toBe(true);
      expect(body.data).toHaveProperty('totalElements');
      if (body.data.content.length > 0) {
        // mỗi node có thể có trường children là null hoặc mảng
        const node = body.data.content[0];
        expect(node).toHaveProperty('children');
        expect(node.children === null || Array.isArray(node.children)).toBe(true);
      }
    });

    test('TC_GET_TREE_02 - Phân trang kết quả (pageSize=10, pageNumber=1)', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/tree`, {
        params: { pageSize: '10', pageNumber: '1' }
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);
      // pageSize/pageNumber có thể nằm trong metadata hoặc body.data if implemented
      // Chỉ cần kiểm số lượng content ≤ 10
      expect(body.data.content.length).toBeLessThanOrEqual(10);
    });

    test('TC_GET_TREE_03 - pageNumber vượt quá giới hạn (pageNumber=9999) → danh sách rỗng', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/tree`, {
        params: { pageNumber: '9999' }
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body.data.content)).toBe(true);
      expect(body.data.content.length).toBe(0);
    });

    test('TC_GET_TREE_04 - Sai kiểu pageSize ("abc") → 400', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/tree`, {
        params: { pageSize: 'abc' }
      });
      expect(response.status()).toBe(400);
    });
  });

  //
  // III. GET /api/v1/departments/{id} — Xem chi tiết phòng ban
  //
  test.describe('III. GET /api/v1/departments/{id} — Xem chi tiết phòng ban', () => {
    test('TC_GET_BY_ID_01 - ID hợp lệ (id=1) → trả về info phòng ban và người dùng', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/1`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);
      // Structure: data chứa phần tử phòng ban, có trường users (có thể null hoặc mảng)
      expect(body.data).toHaveProperty('id', 1);
      expect(body.data).toHaveProperty('name');
      expect(body.data).toHaveProperty('users_count');
      expect(body.data).toHaveProperty('users');
      expect(body.data.users === null || Array.isArray(body.data.users)).toBe(true);
    });

    test('TC_GET_BY_ID_02 - ID không tồn tại (id=99999) → 404 hoặc trả về null', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/99999`);
      expect([200, 404]).toContain(response.status());
      if (response.status() === 200) {
        const body = await response.json();
        // Nếu trả về 200, data có thể null
        expect(body.data).toBeNull();
      }
    });

    test('TC_GET_BY_ID_03 - ID âm (id=-5) → 400', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/-5`);
      expect(response.status()).toBe(400);
    });

    test('TC_GET_BY_ID_04 - Sai kiểu dữ liệu ID (id="abc") → 400', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/abc`);
      expect(response.status()).toBe(400);
    });
  });

  //
  // IV. POST /api/v1/departments — Tạo phòng ban mới
  //
  test.describe('IV. POST /api/v1/departments — Tạo phòng ban mới', () => {
    let createdId: number | null = null;

    test('TC_CREATE_01 - Tạo phòng ban cấp gốc (name="Phòng A") → 200 + dữ liệu', async ({ request }) => {
      const response = await request.post(API_PREFIX, {
        data: { name: 'Phòng A' }
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('name', 'Phòng A');
      createdId = body.data.id;
    });

    test('TC_CREATE_02 - Tạo phòng ban có parent (name="Phòng B", parentId=createdId) → 200', async ({ request }) => {
      expect(createdId).not.toBeNull();
      const response = await request.post(API_PREFIX, {
        data: { name: 'Phòng B', parent_id: createdId }
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);
      expect(body.data).toHaveProperty('parent_id', createdId);
    });

    test('TC_CREATE_03 - Không có tên phòng ban (name="") → 400', async ({ request }) => {
      const response = await request.post(API_PREFIX, {
        data: { name: '' }
      });
      expect(response.status()).toBe(400);
    });

    test('TC_CREATE_04 - Tên quá 255 ký tự → 400', async ({ request }) => {
      const longName = 'x'.repeat(256);
      const response = await request.post(API_PREFIX, {
        data: { name: longName }
      });
      expect(response.status()).toBe(400);
    });

    test('TC_CREATE_05 - Tạo trùng tên (name="Phòng A") → Edge: 200 hoặc 400/409', async ({ request }) => {
      const response = await request.post(API_PREFIX, {
        data: { name: 'Phòng A' }
      });
      expect([200, 400, 409]).toContain(response.status());
    });
  });

  //
  // V. PUT /api/v1/departments/{id} — Cập nhật phòng ban
  //
  test.describe('V. PUT /api/v1/departments/{id} — Cập nhật phòng ban', () => {
    const existingId = 1; // giả sử id=1 tồn tại

    test('TC_UPDATE_01 - Cập nhật tên phòng ban (id=1, name="Phòng mới") → 200 + thông tin mới', async ({ request }) => {
      const response = await request.put(`${API_PREFIX}/${existingId}`, {
        data: { name: 'Phòng mới' }
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);
      expect(body.data).toHaveProperty('name', 'Phòng mới');
      expect(body.data).toHaveProperty('status', 'Phòng mới');
    });

    test('TC_UPDATE_02 - ID không tồn tại (id=9999) → 404 hoặc 200', async ({ request }) => {
      const response = await request.put(`${API_PREFIX}/9999`, {
        data: { name: 'Bất kỳ' }
      });
      expect([200, 404]).toContain(response.status());
    });

    test('TC_UPDATE_03 - Dữ liệu không hợp lệ (name="") → 400', async ({ request }) => {
      const response = await request.put(`${API_PREFIX}/${existingId}`, {
        data: { name: '' }
      });
      expect(response.status()).toBe(400);
    });

    test('TC_UPDATE_04 - ID sai định dạng (id="xyz") → 400', async ({ request }) => {
      const response = await request.put(`${API_PREFIX}/xyz`, {
        data: { name: 'ABC' }
      });
      expect(response.status()).toBe(400);
    });
  });

  //
  // VI. POST /api/v1/departments/move — Di chuyển phòng ban
  //
  test.describe('VI. POST /api/v1/departments/move — Di chuyển phòng ban', () => {
    test('TC_MOVE_01 - Di chuyển hợp lệ (departmentId=3, newParentId=1) → 200', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/move`, {
        data: { department_id: 3, new_parent_id: 1 }
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);
    });

    test('TC_MOVE_02 - Di chuyển lên chính nó (2 → 2) → 400', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/move`, {
        data: { department_id: 2, new_parent_id: 2 }
      });
      expect(response.status()).toBe(400);
    });

    test('TC_MOVE_03 - Tạo vòng lặp (1 → 3 nếu 3 là con của 1) → 400', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/move`, {
        data: { department_id: 1, new_parent_id: 3 }
      });
      expect(response.status()).toBe(400);
    });

    test('TC_MOVE_04 - newParentId không tồn tại (departmentId=2, newParentId=999) → 400 hoặc 404', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/move`, {
        data: { department_id: 2, new_parent_id: 999 }
      });
      expect([400, 404]).toContain(response.status());
    });
  });

  //
  // VII. DELETE /api/v1/departments/{id} — Xóa phòng ban
  //
  test.describe('VII. DELETE /api/v1/departments/{id} — Xóa phòng ban', () => {
    let tempId: number | null = null;

    test.beforeAll(async ({ request }) => {
      // Tạo tạm một phòng ban để xóa không có con
      const response = await request.post(API_PREFIX, {
        data: { name: 'Temp To Delete' }
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);
      tempId = body.data.id;
    });

    test('TC_DELETE_01 - Xóa phòng ban không có con (id=tempId) → 200', async ({ request }) => {
      expect(typeof tempId).toBe('number');
      const response = await request.delete(`${API_PREFIX}/${tempId}`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);

      // Kiểm tra thực sự đã xóa
      const check = await request.get(`${API_PREFIX}/${tempId}`);
      expect([400, 404]).toContain(check.status());
    });

    test('TC_DELETE_02 - Xóa phòng ban có cây con (id=1) → 200 + xóa toàn bộ cây', async ({ request }) => {
      const response = await request.delete(`${API_PREFIX}/1`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.metadata.httpCode).toBe(200);

      // Kiểm tra con (ví dụ id=2) đã xóa
      const checkChild = await request.get(`${API_PREFIX}/2`);
      expect([400, 404]).toContain(checkChild.status());
    });

    test('TC_DELETE_03 - ID không tồn tại (id=9999) → 404 hoặc ignore', async ({ request }) => {
      const response = await request.delete(`${API_PREFIX}/9999`);
      expect([200, 404]).toContain(response.status());
    });

    test('TC_DELETE_04 - ID không hợp lệ (id="abc") → 400', async ({ request }) => {
      const response = await request.delete(`${API_PREFIX}/abc`);
      expect(response.status()).toBe(400);
    });
  });
});
