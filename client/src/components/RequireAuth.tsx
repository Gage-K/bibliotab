import { useLocation, Navigate, Outlet } from "react-router";
import useTypedAuth from "../hooks/useTypedAuth";

export default function RequireAuth() {
  const { auth } = useTypedAuth();
  const location = useLocation();

  return (
    <>
      {auth?.user ? (
        <Outlet />
      ) : (
        <Navigate to="/login" state={{ from: location }} replace />
      )}
    </>
  );
}
