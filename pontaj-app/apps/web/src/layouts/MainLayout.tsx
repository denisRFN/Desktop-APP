import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserFromToken } from "../utils/auth";

interface Props {
  children: React.ReactNode;
}

export default function MainLayout({ children }: Props) {
  const location = useLocation();
  const [user, setUser] = useState(getUserFromToken());

  useEffect(() => {
    setUser(getUserFromToken());
  }, [location.pathname]);

  const initials = user?.username
    ?.substring(0, 2)
    .toUpperCase();

  const navItem = (path: string, label: string) => (
    <Link
      to={path}
      className={`p-2 rounded transition ${
        location.pathname === path
          ? "bg-slate-700"
          : "hover:bg-slate-700"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="h-screen flex bg-slate-900 text-white">
      <aside className="w-64 bg-slate-800 p-6 flex flex-col border-r border-slate-700">
        <h1 className="text-2xl font-bold mb-10">
          Pontaj System
        </h1>

        <nav className="flex flex-col gap-3">
          {navItem("/dashboard", "Dashboard")}
          {navItem("/history", "Istoric")}
          {navItem("/attendance", "Calendar Pontaj")}

          {user?.role === "admin" &&
            navItem("/admin", "Admin Panel")}
        </nav>

        {user && (
          <div className="mt-auto pt-6 border-t border-slate-700 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {initials}
              </div>

              <div>
                <p className="font-semibold">
                  {user.username}
                </p>

                <p className="text-xs text-yellow-400">
                  {user.role}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("access_token");
                window.location.href = "/";
              }}
              className="w-full bg-red-600 hover:bg-red-700 p-2 rounded transition"
            >
              Logout
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}