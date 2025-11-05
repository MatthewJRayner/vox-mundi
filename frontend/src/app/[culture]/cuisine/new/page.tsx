"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import { SVGPath } from "@/utils/path";

import RecipeForm from "@/components/cuisine/RecipeForm";

export default function NewRecipePage() {
  const router = useRouter();
  const { culture } = useParams();

  return (
    <div className="">
      <Link className="" href={`/${culture}/cuisine`} title="Back to Cuisine">
        <svg
          viewBox={SVGPath.arrow.viewBox}
          className="size-5 fill-current text-foreground cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
        >
          <path d={SVGPath.arrow.path} />
        </svg>
      </Link>
      <RecipeForm
        currentCultureCode={culture}
        onSuccess={() => router.push(`/${culture}/cuisine`)}
      />
    </div>
  );
}
