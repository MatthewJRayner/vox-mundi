"use client";
import { useState } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserProvider";

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });
  const router = useRouter();
  const [error, setError] = useState("");
  const { setUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        const res = await api.post("/token/", {
          username: formData.username,
          password: formData.password,
        });
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);

        const userRes = await api.get("/current-user/");
        setUser(userRes.data)
      } else {
        const res = await api.post("/register/", {
          username: formData.username,
          password: formData.password,
          email: formData.email,
        });
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
      }
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      setError("Authentication failed. Please check your credentials.");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={() => setMode("login")}
          className={`p-2 px-4 rounded hover:bg-foreground/50 cursor-pointer font-lora text-xl ${
            mode === "login" ? "bg-foreground text-background" : "bg-gray-200"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setMode("register")}
          className={`p-2 px-4 rounded hover:bg-foreground/50 cursor-pointer font-lora text-xl ${
            mode === "register" ? "bg-foreground text-background" : "bg-gray-200"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 p-6 bg-extra rounded w-100"
      >
        <h2 className="text-xl font-bold font-garamond text-center">
          {mode === "login" ? "Login to your account" : "Create an account"}
        </h2>

        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="p-2 border-b-2 border-b-foreground rounded-t"
          required
        />

        {mode === "register" && (
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="p-2 border-b-2 border-b-foreground rounded-t"
            required
          />
        )}

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="p-2 border-b-2 border-b-foreground rounded-t"
          required
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button type="submit" className="bg-foreground text-background font-lora text-xl p-2 rounded cursor-pointer hover:bg-foreground/80">
          {mode === "login" ? "Login" : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
