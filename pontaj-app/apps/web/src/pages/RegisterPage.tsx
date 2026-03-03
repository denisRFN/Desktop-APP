import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
        role: "user",
      });

      // după register → login automat
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const loginRes = await api.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("token", loginRes.data.access_token);

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Registration failed"
      );
    }
  };

return (
  <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
    <form
      onSubmit={handleRegister}
      className="bg-slate-900 p-8 rounded-2xl w-96 shadow-xl border border-slate-800"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Creează cont nou
      </h2>

      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">
          {error}
        </p>
      )}

      <input
        type="text"
        placeholder="Username"
        className="w-full mb-4 p-3 bg-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <input
        type="email"
        placeholder="Email"
        className="w-full mb-4 p-3 bg-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full mb-6 p-3 bg-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg font-semibold text-white transition"
      >
        Register
      </button>

      <p className="text-sm text-center mt-4 text-slate-400">
        Ai deja cont?{" "}
        <span
          className="text-blue-400 cursor-pointer hover:text-blue-300"
          onClick={() => navigate("/")}
        >
          Login
        </span>
      </p>
    </form>
  </div>
);
}