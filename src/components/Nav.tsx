import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pendingRequests = 0;
  if (user) {
    const { count } = await supabase
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("status", "pending");
    pendingRequests = count ?? 0;
  }

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-primary-600">
          Luka&apos;s
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="text-sm font-medium text-stone-600 hover:text-primary-600">
            Dashboard
          </Link>
          <Link
            href="/friends"
            className="relative text-sm font-medium text-stone-600 hover:text-primary-600"
          >
            Friends
            {pendingRequests > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                {pendingRequests}
              </span>
            )}
          </Link>
          <Link href="/account" className="text-sm font-medium text-stone-600 hover:text-primary-600">
            Account
          </Link>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
