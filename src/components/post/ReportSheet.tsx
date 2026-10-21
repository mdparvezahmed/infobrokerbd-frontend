"use client";

import { useState } from "react";
import { toast } from "@/components/Toaster";
import { Button, cn, Sheet, Textarea } from "@/components/ui";
import { ApiError, post } from "@/lib/api";
import { REPORT_REASONS } from "@/lib/format";
import type { ReportReason } from "@/lib/types";

/** Anyone (logged in or not) can report a post or comment. Admins review the queue. */
export function ReportSheet({
  open,
  onClose,
  targetType,
  targetId,
}: {
  open: boolean;
  onClose: () => void;
  targetType: "POST" | "COMMENT";
  targetId: number;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!reason) return;
    setSending(true);
    try {
      await post("/reports", { targetType, targetId, reason, details: details.trim() || null });
      toast.success("Thanks — our admins will review it");
      setReason(null);
      setDetails("");
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.code === "ALREADY_REPORTED") {
        toast.success(e.message);
        onClose();
      } else {
        toast.error(e instanceof ApiError ? e.message : "Couldn't send the report");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={targetType === "POST" ? "Report this post" : "Report this comment"}>
      <p className="mb-3 text-sm text-stone-500">What&apos;s wrong with it?</p>
      <div className="space-y-1.5">
        {(Object.keys(REPORT_REASONS) as ReportReason[]).map((r) => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium ring-1 transition",
              reason === r ? "bg-accent-50 text-accent-600 ring-2 ring-accent-400" : "ring-black/10 hover:bg-stone-50",
            )}
          >
            <span
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full ring-2",
                reason === r ? "ring-accent-500" : "ring-stone-300",
              )}
            >
              {reason === r && <span className="size-2 rounded-full bg-accent-500" />}
            </span>
            {REPORT_REASONS[r]}
          </button>
        ))}
      </div>
      {reason && (
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={1000}
          placeholder="Add details (optional)"
          className="mt-3 min-h-20"
        />
      )}
      <Button variant="danger" size="lg" className="mt-4 w-full" disabled={!reason} loading={sending} onClick={submit}>
        Send report
      </Button>
    </Sheet>
  );
}
