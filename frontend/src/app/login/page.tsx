"use client";

import AuthForm from "../../components/auth/AuthForm";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center">
      <div className="flex flex-col items-center justify-center max-w-md">
        <h3 className="font-lora text-xl text-muted-foreground">Welcome to</h3>
        <h1 className="font-garamond text-5xl">Vox Mundi.</h1>
        <p className="font-inter text-base leading-relaxed mt-4">
          Vox Mundi is your personal cultural companion — a place to explore and 
          document the languages, traditions, and expressions that shape our world. 
          Create lists, track your discoveries, and share insights as you journey 
          through global culture.
        </p>
      </div>

      <div className="flex items-center justify-center mt-12 w-full max-w-sm">
        <AuthForm />
      </div>
    </div>
  );
}