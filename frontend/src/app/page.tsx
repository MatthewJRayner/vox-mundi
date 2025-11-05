"use client";

import { motion } from "framer-motion";

import AuthGuard from "../components/auth/AuthGuard";
import Navbar from "@/components/Navbar";
import CultureGateway from "@/components/cultures/CultureGateway";

export default function Home() {
  return (
    <AuthGuard>
      <main className="flex flex-col items-center justify-center">
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        />

        <Navbar />
        <CultureGateway />
      </main>
    </AuthGuard>
  );
}
