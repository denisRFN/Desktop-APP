export function getUserFromToken() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    return {
      username: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}