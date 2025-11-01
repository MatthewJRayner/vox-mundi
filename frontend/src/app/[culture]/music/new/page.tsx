"use client";

import ComposerForm from "@/components/music/ComposerForm";
import { useRouter, useParams } from "next/navigation";
import { SVGPath } from "@/utils/path";
import Link from "next/link";

export default function NewHistoryPage() {
  const router = useRouter();
  const { culture } = useParams();

  return (
    <div className="">
      <Link className="" href={`/${culture}/music`} title="Back to Music">
        <svg
          viewBox={SVGPath.arrow.viewBox}
          className="size-5 fill-current text-foreground cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
        >
          <path d={SVGPath.arrow.path} />
        </svg>
      </Link>
      <ComposerForm
        currentCultureCode={culture}
        onSuccess={() => router.push(`/${culture}/music`)}
      />
    </div>
  );
}
