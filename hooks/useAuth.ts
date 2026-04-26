"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import type { User } from "@/types";

export function useAuth(requireAdmin = false) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    if (!token || !u) { router.replace("/login"); return; }
    if (requireAdmin && u.role !== "admin") { router.replace("/dashboard"); return; }
    setUser(u);
    setReady(true);
  }, [router, requireAdmin]);

  return { user, ready, isAdmin: user?.role === "admin" };
}
