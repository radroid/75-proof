import type { Metadata } from "next";
import { CoachClient } from "@/components/coach/CoachClient";

export const metadata: Metadata = {
  title: "Routine Coach | earned",
  description:
    "Chat with an AI that knows widely-followed routines and helps you pick or stack the right one.",
};

export default function CoachPage() {
  return <CoachClient />;
}
