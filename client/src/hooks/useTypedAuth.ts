import useAuth from "./useAuth";
import type { AuthContextValue } from "../shared/types/auth.types";

export type { AuthState, AuthContextValue } from "../shared/types/auth.types";

export default function useTypedAuth(): AuthContextValue {
  return useAuth() as AuthContextValue;
}
