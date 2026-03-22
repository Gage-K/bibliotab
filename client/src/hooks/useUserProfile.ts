import { useQuery, useMutation } from "@tanstack/react-query";
import useAxiosPrivate from "./useAxiosPrivate";
import { queryKeys } from "../api/queryKeys";
import { API_ENDPOINTS } from "../api/endpoints";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
  last_login: string | null;
}

export function useUserProfile() {
  const axiosPrivate = useAxiosPrivate();

  return useQuery<UserProfile>({
    queryKey: queryKeys.user.profile,
    queryFn: async () => {
      const response = await axiosPrivate.get(API_ENDPOINTS.user.base);
      return response.data;
    },
  });
}

export function useUpdateEmail() {
  const axiosPrivate = useAxiosPrivate();

  return useMutation({
    mutationFn: async (email: string) => {
      const response = await axiosPrivate.put(
        API_ENDPOINTS.user.base,
        JSON.stringify({ email })
      );
      return response.data;
    },
  });
}
