import type { AxiosInstance } from "axios";
import { API_ENDPOINTS } from "../endpoints";
import type { EditorTabBodyType, TuningType } from "../../shared/types/tab.types";

export interface CreateTabPayload {
  tab_name: string;
  tab_artist: string;
  tuning: string[];
  tab_data: EditorTabBodyType;
}

export interface SaveTabPayload {
  tab_name: string;
  tab_artist: string;
  tuning: TuningType;
  tab_data: EditorTabBodyType;
}

export const tabService = {
  getAll: (axios: AxiosInstance, signal?: AbortSignal) =>
    axios.get(API_ENDPOINTS.tabs.base, { signal }),

  getById: (axios: AxiosInstance, id: string, signal?: AbortSignal) =>
    axios.get(API_ENDPOINTS.tabs.byId(id), { signal }),

  create: (axios: AxiosInstance, data: CreateTabPayload) =>
    axios.post(API_ENDPOINTS.tabs.base, data),

  update: (axios: AxiosInstance, id: string, data: SaveTabPayload) =>
    axios.put(API_ENDPOINTS.tabs.byId(id), data),

  delete: (axios: AxiosInstance, id: string) =>
    axios.delete(API_ENDPOINTS.tabs.byId(id)),
};
