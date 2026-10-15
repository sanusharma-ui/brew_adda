import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lumea — The Coffee Counter",
  description: "A little pause, a good cup. Pick your coffee and build your cafe bill.",
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
