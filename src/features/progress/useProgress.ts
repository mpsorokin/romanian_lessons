import { useContext } from "react";
import { ProgressContext } from "./ProgressProvider";

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used inside ProgressProvider.");
  return context;
}
