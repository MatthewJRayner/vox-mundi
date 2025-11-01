// components/history/PeriodForm.tsx
"use client";

import React from "react";

export type PeriodFormState = {
  id: number | null;
  title: string;
  start_year: string;
  end_year: string;
  desc: string;
};

interface PeriodFormProps {
  periodForm: PeriodFormState;
  setPeriodForm: React.Dispatch<React.SetStateAction<PeriodFormState>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PeriodForm({
  periodForm,
  setPeriodForm,
  onSubmit,
}: PeriodFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col space-y-3 w-full">
      <h4 className="font-semibold text-main text-center w-full">
        {periodForm.id ? "Edit Period" : "Add New Period"}
      </h4>

      <div className="w-full flex space-x-2 items-center">
        <h3 className="font-lora md:text-xl">Title:</h3>
        <input
          type="text"
          value={periodForm.title}
          onChange={(e) =>
            setPeriodForm((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter here..."
          className="p-2 rounded bg-extra w-full text-sm shadow-md"
        />
      </div>

      <div className="w-full flex flex-col md:flex-row md:space-x-4 space-y-3 md:space-y-0">
        <div className="w-full md:w-1/2 flex space-x-2 items-center">
          <h3 className="font-lora md:text-xl">Start:</h3>
          <input
            type="text"
            value={periodForm.start_year}
            onChange={(e) =>
              setPeriodForm((prev) => ({ ...prev, start_year: e.target.value }))
            }
            placeholder="Year (Optional)"
            className="p-2 rounded bg-extra shadow-md w-full text-sm"
          />
        </div>
        <div className="w-full md:w-1/2 flex space-x-2 items-center">
          <h3 className="font-lora md:text-xl">End:</h3>
          <input
            type="text"
            value={periodForm.end_year}
            onChange={(e) =>
              setPeriodForm((prev) => ({ ...prev, end_year: e.target.value }))
            }
            placeholder="Year (Optional)"
            className="p-2 rounded bg-extra shadow-md w-full text-sm"
          />
        </div>
      </div>

      <div className="w-full flex flex-col space-y-1">
        <h3 className="font-lora md:text-xl">Description:</h3>
        <textarea
          value={periodForm.desc}
          onChange={(e) =>
            setPeriodForm((prev) => ({ ...prev, desc: e.target.value }))
          }
          placeholder="Enter description for this period/category..."
          rows={4}
          className="p-2 rounded bg-extra shadow-md w-full resize-y text-sm"
        />
      </div>

      <button
        type="submit"
        className="self-start bg-foreground text-background w-full md:w-1/4 px-4 py-2 rounded hover:opacity-80 active:scale-95 cursor-pointer"
      >
        {periodForm.id ? "Update" : "Create"}
      </button>
    </form>
  );
}
