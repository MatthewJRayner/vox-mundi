import Image from "next/image";
import AuthGuard from "../components/auth/AuthGuard";
import Navbar from "@/components/Navbar";
import CulturesList from "../components/cultures/CultureList";

export default function Home() {
  return (
    <AuthGuard>
      <main className="flex flex-col items-center justify-center">
        <Navbar />
        <CulturesList />
      </main>
    </AuthGuard>
  );
}
