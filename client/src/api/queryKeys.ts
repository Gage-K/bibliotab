export const queryKeys = {
  tabs: {
    all: ["tabs"] as const,
    byId: (id: string) => ["tabs", id] as const,
  },
  user: {
    profile: ["user", "profile"] as const,
  },
};
