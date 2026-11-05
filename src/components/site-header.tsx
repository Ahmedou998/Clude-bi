import { getCurrentUser } from "@/lib/auth";
import { HeaderBar } from "./header-bar";

export async function SiteHeader({ tone = "light" }: { tone?: "light" | "dark" }) {
  const user = await getCurrentUser();
  return <HeaderBar tone={tone} user={user ? { name: user.fullName } : null} />;
}
