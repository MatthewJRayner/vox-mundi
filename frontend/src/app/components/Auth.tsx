"use client";
import { useState } from "react";
import api from "../lib/api";

export default function Auth() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", email: "", password: "", password2: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await api.post("/token/", { username: formData.username, password: formData.password });
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
      } else {
        const res = await api.post("/register/", formData);
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
      }
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-blue-500 text-white p-2 rounded">
        {isLogin ? "Login" : "Sign Up"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <form onSubmit={handleSubmit} className="bg-white text-black p-6 rounded shadow-lg w-80">
            <h2 className="text-xl mb-4">{isLogin ? "Login" : "Sign Up"}</h2>

            <input
              type="text"
              placeholder="Username"
              className="border p-2 w-full mb-2"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            {!isLogin && (
              <input
                type="email"
                placeholder="Email"
                className="border p-2 w-full mb-2"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            )}
            <input
              type="password"
              placeholder="Password"
              className="border p-2 w-full mb-2"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {!isLogin && (
              <input
                type="password"
                placeholder="Confirm Password"
                className="border p-2 w-full mb-2"
                onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
              />
            )}

            <button type="submit" className="bg-green-500 text-white p-2 w-full rounded">
              {isLogin ? "Login" : "Register"}
            </button>

            <p className="mt-2 text-sm text-gray-500 cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
            </p>
          </form>
        </div>
      )}
    </>
  );
}
