"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import { SVGPath } from "@/utils/path";

import HistoryEventForm from "@/components/history/HistoryEventForm";

export default function NewHistoryPage() {
  const router = useRouter();
  const { culture } = useParams();

  return (
    <div className="">
      <Link className="" href={`/${culture}/history`} title="Back to History">
        <svg
          viewBox={SVGPath.arrow.viewBox}
          className="size-5 fill-current text-foreground cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
        >
          <path d={SVGPath.arrow.path} />
        </svg>
      </Link>
      <HistoryEventForm
        currentCultureCode={culture}
        onSuccess={() => router.push(`/${culture}/history`)}
      />
    </div>
  );
}
