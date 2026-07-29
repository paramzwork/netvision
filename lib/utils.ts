import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const oneEncode = (value: string): string => {
  return btoa(value);
};
export const tripleEncode = (value: string): string => {
  return btoa(btoa(btoa(value)));
};
export const oneDecode = (value: string): string => {
  return atob(value);
};
export const tripleDecode = (value: string): string => {
  return atob(atob(atob(value)));
};
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function counter64ToNumber(value: Buffer | number): number {
  if (typeof value === "number") {
    return value;
  }

  let result = 0;

  for (const byte of value) {
    result = result * 256 + byte;
  }

  return result;
}
export function counter64ToBigInt(value: Buffer | number): bigint {
  if (typeof value === "number") {
    return BigInt(value);
  }

  let result = 0n;

  for (const byte of value) {
    result = (result << 8n) + BigInt(byte);
  }

  return result;
}
