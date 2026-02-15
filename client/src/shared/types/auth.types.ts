export interface AuthState {
  user?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthContextValue {
  auth: AuthState;
  setAuth: React.Dispatch<React.SetStateAction<AuthState>>;
}
