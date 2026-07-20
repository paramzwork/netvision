import { cookies } from "next/headers";

// export async function cactiFetch(
//   url: string,
//   init?: RequestInit
// ) {
//   const cookieStore = await cookies();

//   const cookieHeader = [
//     cookieStore.get("Cacti")?.value &&
//       `Cacti=${cookieStore.get("Cacti")?.value}`,
//     cookieStore.get("cacti_remembers")?.value &&
//       `cacti_remembers=${cookieStore.get(
//         "cacti_remembers"
//       )?.value}`,
//   ]
//     .filter(Boolean)
//     .join("; ");

//   return fetch(url, {
//     ...init,
//     headers: {
//       ...init?.headers,
//       Cookie: cookieHeader,
//     },
//   });
// }

export async function cactiFetch(url: string) {
  const cookieStore = await cookies();

  const cookieHeader = [
    cookieStore.get("Cacti")?.value &&
      `Cacti=${cookieStore.get("Cacti")!.value}`,
    cookieStore.get("cacti_remembers")?.value &&
      `cacti_remembers=${cookieStore.get("cacti_remembers")!.value}`,
  ]
    .filter(Boolean)
    .join("; ");

  return fetch(url, {
    headers: {
      Cookie: cookieHeader,
      Accept: "text/html",
    },
    redirect: "manual",
    cache: "no-store",
  });
}
