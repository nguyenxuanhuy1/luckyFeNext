import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Wheel {
  id: number | string;
  name: string;
  items: string[];
  preset?: string;
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

export const wheelService = {
  // CREATE Wheel
  createWheel: async (name: string, items: string[]): Promise<Wheel> => {
    const { data } = await apiClient.post<Wheel>("/wheels", { name, items });
    return data;
  },

  // GET All Wheels
  getWheels: async (): Promise<Wheel[]> => {
    const { data } = await apiClient.get<Wheel[]>("/wheels");
    return data;
  },

  // GET Wheel Detail
  getWheelDetail: async (wheelId: string | number): Promise<Wheel> => {
    const { data } = await apiClient.get<Wheel>(`/wheels/${wheelId}`);
    return data;
  },

  // UPDATE Wheel Items
  updateWheelItems: async (wheelId: string | number, items: string[]): Promise<Wheel> => {
    const { data } = await apiClient.put<Wheel>(`/wheels/${wheelId}/items`, { items });
    return data;
  },

  // DELETE Wheel
  deleteWheel: async (wheelId: string | number): Promise<void> => {
    await apiClient.delete(`/wheels/${wheelId}`);
  },

  // SET Preset
  setWheelPreset: async (wheelId: string | number, result: string): Promise<string> => {
    const { data } = await apiClient.post(`/wheels/${wheelId}/preset`, { result });
    return data;
  },

  // CLEAR Preset
  clearWheelPreset: async (wheelId: string | number): Promise<string> => {
    const { data } = await apiClient.delete(`/wheels/${wheelId}/preset`);
    return data;
  },

  // SPIN Wheel
  spinWheel: async (wheelId: string | number): Promise<SpinResponse> => {
    const { data } = await apiClient.post<SpinResponse>(`/wheels/${wheelId}/spin`);
    return data;
  },

  // GET Wheel History
  getWheelHistory: async (wheelId: string | number): Promise<SpinHistoryResponse[]> => {
    const { data } = await apiClient.get<SpinHistoryResponse[]>(`/wheels/${wheelId}/history`);
    return data;
  },
};
