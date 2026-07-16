"use client";

import { logout } from "@/app/logout/actions";

export default function LogoutButton({ label = "Log out" }: { label?: string }) {
  return (
    <button
      onClick={() => logout()}
      className="text-sm font-medium text-stone-600 hover:text-primary-600"
    >
      {label}
    </button>
  );
}
