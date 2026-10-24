import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytesToMb(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}
