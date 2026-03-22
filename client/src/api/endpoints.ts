export const API_ENDPOINTS = {
  tabs: {
    base: "/api/tabs",
    byId: (id: string) => `/api/tabs/${id}`,
  },
  user: {
    base: "/api/user",
  },
} as const;
