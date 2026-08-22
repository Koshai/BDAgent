"use client";

import { useToast } from "@/components/providers";
import { useState } from "react";
import { IconCheck, IconCopy } from "@/components/icons";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        toast("Copied");
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <IconCheck size={16} /> : <IconCopy size={16} />}
      {done ? "Copied" : label}
    </button>
  );
}
