import type { AxiosInstance } from "axios";
import { API_ENDPOINTS } from "../endpoints";
import type { TabTracksType, TabType, TimeSignatureType } from "@tablab/shared";

/** Every tab endpoint wraps its payload in `{ data }`. */
type ApiEnvelope<T> = { data: T };

/** Tuning lives on each track in `tab_data`; there is no tab-level tuning field. */
export interface CreateTabPayload {
  tab_name: string;
  tab_artist: string;
  tab_data: TabTracksType;
  bpm?: number;
  time_signature?: TimeSignatureType;
  notes?: string;
}

export interface SaveTabPayload {
  tab_name: string;
  tab_artist: string;
  tab_data: TabTracksType;
  bpm: number;
  time_signature: TimeSignatureType;
  notes: string;
}

export const tabService = {
  getAll: (axios: AxiosInstance, signal?: AbortSignal) =>
    axios.get<ApiEnvelope<TabType[]>>(API_ENDPOINTS.tabs.base, { signal }),

  getById: (axios: AxiosInstance, id: string, signal?: AbortSignal) =>
    axios.get<ApiEnvelope<TabType>>(API_ENDPOINTS.tabs.byId(id), { signal }),

  create: (axios: AxiosInstance, data: CreateTabPayload) =>
    axios.post<ApiEnvelope<TabType>>(API_ENDPOINTS.tabs.base, data),

  update: (axios: AxiosInstance, id: string, data: SaveTabPayload) =>
    axios.put(API_ENDPOINTS.tabs.byId(id), data),

  delete: (axios: AxiosInstance, id: string) =>
    axios.delete(API_ENDPOINTS.tabs.byId(id)),
};
