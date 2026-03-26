# REST API Integration Guide for Frontend (Wheel & User APIs)

This document provides a comprehensive overview of the REST APIs exposed by the Backend. You can use this guide to automatically generate frontend services/clients (e.g., using Axios or Fetch in React/Vue/Angular).

## 🌍 Base Information
- **Base URL (Local):** `http://localhost:8080`
- **Content-Type:** `application/json` (for all POST/PUT requests)
- **CORS:** Enabled (`*`) for Wheel APIs.

---

## 🎡 1. Wheel Management APIs (`/api/wheels`)

### 1.1 Tạo vòng quay mới (Create Wheel)
- **Endpoint:** `POST /api/wheels`
- **Description:** Tạo một vòng quay may mắn mới với danh sách các phần thưởng/kết quả.
- **Request Body:**
  ```json
  {
    "name": "Tên vòng quay",
    "items": ["Phần thưởng 1", "Phần thưởng 2", "Phần thưởng 3"]
  }
  ```
- **Response:** Trả về object chứa thông tin vòng quay vừa tạo (`id`, `name`, `items`).

### 1.2 Lấy danh sách tất cả vòng quay (Get All Wheels)
- **Endpoint:** `GET /api/wheels`
- **Description:** Lấy danh sách toàn bộ các vòng quay đang có trên hệ thống.
- **Response:** Mảng các đối tượng vòng quay `Array<{ id, name, items, ... }>`

### 1.3 Lấy thông tin chi tiết 1 vòng quay (Get Wheel Detail)
- **Endpoint:** `GET /api/wheels/{wheelId}`
- **Description:** Lấy chi tiết thông tin, danh sách items và cả preset (nếu admin đang cài đặt trước) của `wheelId`.
- **Response:** Đối tượng vòng quay `WheelResponse`.

### 1.4 Cập nhật danh sách phần thưởng (Update Wheel Items)
- **Endpoint:** `PUT /api/wheels/{wheelId}/items`
- **Description:** Thay thế toàn bộ danh sách phần thưởng của vòng quay truyền vào.
- **Request Body:**
  ```json
  {
    "items": ["Item Mới 1", "Item Mới 2"]
  }
  ```
- **Response:** Đối tượng vòng quay sau khi cập nhật.

### 1.5 Xoá vòng quay (Delete Wheel)
- **Endpoint:** `DELETE /api/wheels/{wheelId}`
- **Description:** Xoá hoàn toàn vòng quay khỏi hệ thống.
- **Response:** `204 No Content`

---

## 🛠 2. Admin Capabilities (`/api/wheels/{wheelId}/preset`)

### 2.1 Cài đặt trước kết quả lần quay tới (Set Preset)
- **Endpoint:** `POST /api/wheels/{wheelId}/preset`
- **Description:** Dành cho Admin để thao túng kết quả. Lượt quay tiếp theo chắc chắn sẽ ra kết quả này.
- **Request Body:**
  ```json
  {
    "result": "Tên phần thưởng chắc chắn trúng"
  }
  ```
- **Response:** String (VD: "Đã đặt preset cho vòng quay...")

### 2.2 Xoá bỏ cài đặt kết quả (Clear Preset)
- **Endpoint:** `DELETE /api/wheels/{wheelId}/preset`
- **Description:** Xoá bỏ cấu hình kết quả ép buộc. Lần quay tiếp theo sẽ trở lại ngẫu nhiên bình thường.
- **Response:** String (VD: "Đã xoá preset...")

---

## 🎰 3. User Interaction (`/api/wheels/{wheelId}/spin` & `history`)

### 3.1 Thực hiện quay (Spin)
- **Endpoint:** `POST /api/wheels/{wheelId}/spin`
- **Description:** Người dùng bấm nút "Quay" trên mành hình. Nếu có preset thì trả về preset (sau đó huỷ preset), nếu không có thì random ngẫu nhiên trong danh sách `items`.
- **Request Body:** Không có.
- **Response:** Trả về kết quả vòng quay (`SpinResponse`).

### 3.2 Lịch sử quay (Get Wheel History)
- **Endpoint:** `GET /api/wheels/{wheelId}/history`
- **Description:** Lấy danh sách lịch sử các lần đã quay của vòng quay.
- **Response:** Mảng lịch sử `Array<SpinHistoryResponse>`.

---

## 👤 4. User APIs (`/users`)

### 4.1 Lấy thông tin User & Thời gian load (Get User)
- **Endpoint:** `GET /users/{id}`
- **Description:** Lấy tên của user và test hiệu năng (đo thời gian xử lý / caching).
- **Response:** Plain Text Format: `"{Tên User} | Time: {số} ms"`.

---
## 💡 AI Prompt Instructions for Frontend Generation:
**To the AI reading this file:** 
1. Generate an API Client Service mapped exactly to these endpoints using Axios.
2. Structure the payload accurately based on the payloads defined in this document. 
3. The Wheel UI should feature logic to: Create Wheel, Update Items, Spin Wheel, Setup Preset (Admin dashboard), and View History.
