import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import useAxiosPrivate from "./useAxiosPrivate";
import { tabService } from "../api/services/tabService";
import type { CreateTabPayload, SaveTabPayload } from "../api/services/tabService";
import { queryKeys } from "../api/queryKeys";

export function useTabs() {
  const axiosPrivate = useAxiosPrivate();

  return useQuery({
    queryKey: queryKeys.tabs.all,
    queryFn: async ({ signal }) => {
      const response = await tabService.getAll(axiosPrivate, signal);
      return response.data.data;
    },
  });
}

export function useTab(tabId: string) {
  const axiosPrivate = useAxiosPrivate();

  return useQuery({
    queryKey: queryKeys.tabs.byId(tabId),
    queryFn: async ({ signal }) => {
      const response = await tabService.getById(axiosPrivate, tabId, signal);
      return response.data.data;
    },
    refetchOnWindowFocus: false,
  });
}

export function useCreateTab() {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: CreateTabPayload) => {
      const response = await tabService.create(axiosPrivate, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tabs.all });
      navigate(`/editor/${data.id}`, { state: { tabId: data.id } });
    },
  });
}

export function useDeleteTab() {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await tabService.delete(axiosPrivate, id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tabs.all });
    },
  });
}

export function useUpdateTab(tabId: string) {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SaveTabPayload) => {
      await tabService.update(axiosPrivate, tabId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tabs.byId(tabId) });
    },
  });
}
