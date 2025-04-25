import { useContext } from "react";
import AuthContext from "../context/authProvider";

export default function useAuth() {
  // Receive info from AuthProvider.
  // This avoids needing to import the context on any component that requires authorization.
  // Custom hook streamlines this process.
  return useContext(AuthContext);
}
