"use client";
interface CategoryHeaderProps {
  displayName: string;
  setDisplayName: (name: string) => void;
  onSave: () => void;
}

export default function CategoryHeader({
  displayName,
  setDisplayName,
  onSave,
}: CategoryHeaderProps) {
  return (
    <section className="flex flex-col items-center space-y-4">
      <div className="flex w-full items-center justify-center space-x-4">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="History Category Display Name"
          className="bg-extra shadow p-2 rounded text-sm sm:text-base w-2/3 text-center"
        />
        <button
          onClick={onSave}
          className="bg-foreground text-background px-4 py-2 rounded hover:opacity-80 active:scale-95 cursor-pointer"
        >
          Save
        </button>
      </div>
    </section>
  );
}
