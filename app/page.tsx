import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";

export default async function Home() {
  await verifySession();
  redirect("/dashboard");
}
