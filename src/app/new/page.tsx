import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { NewPostWizard } from "./NewPostWizard";

export const metadata: Metadata = {
  title: "Share a finding",
  description: "Share a review, recommendation, tip or experience about a place near you.",
  robots: { index: false, follow: true },
};

export default function NewPostPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60dvh] place-items-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <NewPostWizard />
    </Suspense>
  );
}
