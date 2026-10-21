"use client";

import { usePathname } from "next/navigation";

/** The map is full-screen, so the footer stays out of the way there. */
export function FooterGate({ children }: { children: React.ReactNode }) {
  return usePathname() === "/map" ? null : children;
}
