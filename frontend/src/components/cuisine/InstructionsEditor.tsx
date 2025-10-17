"use client";

import React, { useState } from "react";
import { SVGPath } from "@/utils/path";

type Instruction = {
  step: number;
  info: string;
};

type Props = {
  instructions: Instruction[];
  setInstructions: (i: Instruction[]) => void;
};

export default function InstructionsEditor({
  instructions,
  setInstructions,
}: Props) {
  const [instructionsView, setInstructionsView] = useState(false);

  const addInstruction = () =>
    setInstructions([
      ...instructions,
      { step: instructions.length + 1, info: "" },
    ]);

  const updateInstruction = (
    index: number,
    field: keyof Instruction,
    value: string
  ) => {
    const updated = [...instructions];
    if (field === "step") {
      updated[index][field] = value ? parseInt(value, 10) : 0;
    } else {
      updated[index][field] = value;
    }
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    const updated = instructions
      .filter((_, i) => i !== index)
      .map((inst, i) => ({ ...inst, step: i + 1 }));
    setInstructions(updated);
  };

  return (
    <div className="p-2 shadow rounded bg-extra w-full">
      <button
        type="button"
        className="mb-2 w-full text-left text-sm sm:text-base cursor-pointer flex items-center justify-between"
        onClick={() => setInstructionsView(!instructionsView)}
      >
        <span
          className={`mr-1 transition ${instructionsView ? "text-main" : ""}`}
        >
          Instructions
        </span>
        <span className={`transition duration-400 text-foreground/50`}>
          <svg
            viewBox={SVGPath.chevron.viewBox}
            className={`size-5 fill-current transition hover:scale-105 active:scale-95 ${
              instructionsView ? "transform rotate-180" : ""
            }`}
          >
            <path d={SVGPath.chevron.path} />
          </svg>
        </span>
      </button>
      {instructionsView && (
        <>
          {instructions.map((instruction, index) => (
            <div key={index} className="mb-3 p-2 rounded">
              <input
                type="number"
                placeholder={`Step ${index + 1}`}
                value={instruction.step}
                onChange={(e) =>
                  updateInstruction(index, "step", e.target.value)
                }
                className="border-foreground border-b-2 p-1 w-full text-sm sm:text-base mb-2"
              />
              <textarea
                placeholder="Instruction Details"
                value={instruction.info}
                onChange={(e) =>
                  updateInstruction(index, "info", e.target.value)
                }
                className="border-foreground border-b-2 p-1 w-full text-sm sm:text-base mb-2"
                rows={3}
              />
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                className="bg-red-400 rounded-sm text-white px-2 py-1 mt-2 text-sm sm:text-base hover:text-background hover:bg-red-500 transition cursor-pointer active:scale-95"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addInstruction}
            className="bg-primary text-sm sm:text-base text-white px-2 py-2 rounded hover:text-background hover:bg-extra-mid transition cursor-pointer active:scale-95"
          >
            + Add Instruction
          </button>
        </>
      )}
    </div>
  );
}
