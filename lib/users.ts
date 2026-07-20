import fs from "fs";
import path from "path";
import { User } from "@/lib/types";

const USERS_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "users.json"
);

export function getUsers(): User[] {
  const file = fs.readFileSync(USERS_PATH, "utf-8");
  return JSON.parse(file);
}

export function getUserById(id: string | number) {
  return getUsers().find((u) => String(u.id) === String(id));
}

export function getUserByCredentials(
  username: string,
  password: string
) {
  return getUsers().find(
    (u) =>
      u.username === username &&
      u.password === password
  );
}