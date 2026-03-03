import { Navigate } from "react-router-dom";
import { getUserFromToken } from "../utils/auth";

export default function ProtectedRoute({
  children,
  requiredRole,
}: any) {
  const user = getUserFromToken();

  if (!user) return <Navigate to="/" />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}