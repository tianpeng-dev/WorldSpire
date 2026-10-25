"use client";

import { useState } from "react";
import { WSButton } from "./ChildShell";
import { resetPreviewCollection } from "@/lib/child/preview-collection";

export function ResetPreviewButton() {
  const [reset, setReset] = useState(false);
  return (
    <div className="mt-4">
      <WSButton type="button" variant="secondary" onClick={() => {
        resetPreviewCollection();
        setReset(true);
      }}>重置设计示例</WSButton>
      {reset ? <p role="status">设计示例已重置。</p> : null}
    </div>
  );
}
