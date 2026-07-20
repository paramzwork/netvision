import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const oneEncode = (value: string): string => {
  return btoa((value));
};
export const tripleEncode = (value: string): string => {
  return btoa(btoa(btoa(value)));
};
export const oneDecode = (value: string): string => {
  return atob((value));
};
export const tripleDecode = (value: string): string => {
  return atob(atob(atob(value)));
};
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
