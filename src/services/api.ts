import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://quaymayman.online/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ── Token helpers ──────────────────────────────────── */
export const AUTH_TOKEN_KEY = "luckypick_token";
export const AUTH_USER_KEY  = "luckypick_user";

export interface AuthUser {
  token: string;
  username: string;
  role: "ADMIN" | "USER";
}

export function saveAuth(user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, user.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function isAdmin(): boolean {
  return getAuth()?.role === "ADMIN";
}

function getAdminHeaders() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ── Interfaces ─────────────────────────────────────── */
export interface WheelSummary {
  id: number | string;
  name: string;
  preset?: string;
  // items KHÔNG có ở list, chỉ có ở detail
}

export interface Wheel extends WheelSummary {
  items: string[];
}

export interface WheelPage {
  content: WheelSummary[];
  totalElements: number;
  totalPages: number;
  number: number; // page hiện tại (0-based)
  size: number;
}

export interface SpinResponse {
  result: string;
}

export interface SpinHistoryResponse {
  id: number | string;
  wheelId: number | string;
  result: string;
  spinTime: string;
}

/* ── Auth service (Public endpoints) ───────────────── */
export const authService = {
  login: async (username: string, password: string): Promise<AuthUser> => {
    const { data } = await apiClient.post<AuthUser>("/auth/login", { username, password });
    saveAuth(data);
    return data;
  },

  register: async (payload: {
    username: string;
    password: string;
  }): Promise<AuthUser> => {
    const { data } = await apiClient.post<AuthUser>("/auth/register", payload);
    saveAuth(data);
    return data;
  },

  logout: () => {
    clearAuth();
    if (typeof window !== "undefined") window.location.href = "/login";
  },
};

/* ── Wheel service ──────────────────────────────────── */
export const wheelService = {
  // 🌐 Public
  createWheel: async (name: string, items: string[]): Promise<Wheel> => {
    const { data } = await apiClient.post<Wheel>("/wheels", { name, items });
    return data;
  },

  // 🌐 Public — trả về 10 bản ghi mới nhất (phân trang)
  getWheels: async (page = 0, size = 10): Promise<WheelSummary[]> => {
    // BE có thể trả về WheelPage hoặc mảng thẳng tuỳ impl
    // Nếu BE trả WheelPage: data.content; nếu trả mảng thẳng: data
    const { data } = await apiClient.get<WheelSummary[] | WheelPage>("/wheels", {
      params: { page, size },
    });
    return Array.isArray(data) ? data : (data as WheelPage).content;
  },

  // 🌐 Public
  getWheelDetail: async (wheelId: string | number): Promise<Wheel> => {
    const { data } = await apiClient.get<Wheel>(`/wheels/${wheelId}`);
    return data;
  },

  // 🌐 Public
  updateWheelItems: async (wheelId: string | number, items: string[]): Promise<Wheel> => {
    const { data } = await apiClient.put<Wheel>(`/wheels/${wheelId}/items`, { items });
    return data;
  },

  // 🌐 Public
  deleteWheel: async (wheelId: string | number): Promise<void> => {
    await apiClient.delete(`/wheels/${wheelId}`);
  },

  // 🌐 Public
  spinWheel: async (wheelId: string | number): Promise<SpinResponse> => {
    const { data } = await apiClient.post<SpinResponse>(`/wheels/${wheelId}/spin`);
    return data;
  },

  // 🌐 Public
  getWheelHistory: async (wheelId: string | number): Promise<SpinHistoryResponse[]> => {
    const { data } = await apiClient.get<SpinHistoryResponse[]>(`/wheels/${wheelId}/history`);
    return data;
  },

  // 🔒 ADMIN only — gắn Bearer token
  setWheelPreset: async (wheelId: string | number, result: string): Promise<string> => {
    const { data } = await apiClient.post(
      `/wheels/${wheelId}/preset`,
      { result },
      { headers: getAdminHeaders() }
    );
    return data;
  },

  // 🔒 ADMIN only — gắn Bearer token
  clearWheelPreset: async (wheelId: string | number): Promise<string> => {
    const { data } = await apiClient.delete(
      `/wheels/${wheelId}/preset`,
      { headers: getAdminHeaders() }
    );
    return data;
  },
};
