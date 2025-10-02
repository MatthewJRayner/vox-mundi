import Image from "next/image";
import Auth from "./components/Auth";
import CultureForm from "./components/cultures/CultureForm";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-3xl font-bold">Vox Mundi</h1>
      <Auth />
      <CultureForm />
    </main>
  );
}
