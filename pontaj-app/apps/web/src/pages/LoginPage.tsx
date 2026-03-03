import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const response = await api.post("/auth/login", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("access_token", response.data.access_token);
      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);

      if (error.response) {
        alert(error.response.data.detail);
      } else {
        alert("Network error");
      }
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="bg-slate-800 p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl mb-6 text-center font-bold">
          Pontaj Login
        </h1>

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 p-3 rounded bg-slate-700"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded bg-slate-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold transition"
        >
          Login
        </button>

        <p className="text-sm text-center mt-4 text-slate-400">
          Nu ai cont?{" "}
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => navigate("/register")}
          >
            Creează unul
          </span>
        </p>
      </div>
    </div>
  );
}