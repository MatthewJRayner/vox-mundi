"use client";

import { useRouter, useParams } from "next/navigation";
import RecipeForm from "@/components/cuisine/RecipeForm";

export default function NewRecipePage() {
  const router = useRouter();
  const { culture } = useParams();

  return (
    <div className="">
      <h1 className=""></h1>
      <RecipeForm
        currentCultureCode={culture}
        onSuccess={() => router.push(`/${culture}/cuisine`)}
      />
    </div>
  );
}