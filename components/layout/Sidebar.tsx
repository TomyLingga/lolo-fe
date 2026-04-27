"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, clearAuth, isAdmin } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface NavItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  children?: { href: string; label: string }[];
}

const Icon = ({ path }: { path: string }) => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [expanded, setExpanded] = useState<string | null>("master");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  const admin = user?.role === "admin";

  const navItems: NavItem[] = [
    {
      href: "/dashboard", label: "Dashboard",
      icon: <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    },
    {
      href: "/registrations", label: "Registrasi",
      icon: <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    },
    {
      href: "/invoices", label: "Invoice",
      icon: <Icon path="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />,
    },
    {
      href: "/tariffs", label: "Tarif", adminOnly: true,
      icon: <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    {
      label: "Master Data", adminOnly: true,
      icon: <Icon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
      children: [
        { href: "/master/users", label: "User" },
        { href: "/master/freight-forwarders", label: "Freight Forwarder" },
        { href: "/master/yards", label: "Yard & Block" },
        { href: "/master/container-sizes", label: "Container Size & Type" },
        { href: "/master/cargo-statuses", label: "Cargo Status" },
        { href: "/master/taxes", label: "Tax & Discount" },
      ],
    },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push("/login");
  }

  const visibleItems = navItems.filter(i => !i.adminOnly || admin);

  return (
    <div className="flex flex-col h-full" style={{ background: "#111827", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#e50914" }}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white tracking-tight truncate">Container Tracking</p>
          <p className="text-[11px] text-slate-500 truncate">PT Sei Mangkei Nusantara Tiga</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 text-slate-500 hover:text-white lg:hidden">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          if (item.children) {
            const isOpen = expanded === "master";
            const isActive = item.children.some(c => pathname.startsWith(c.href));
            return (
              <div key={item.label}>
                <button
                  onClick={() => setExpanded(isOpen ? null : "master")}
                  className={cn("sidebar-link w-full justify-between", isActive && "text-white")}
                >
                  <span className="flex items-center gap-3">{item.icon}{item.label}</span>
                  <svg className={cn("w-4 h-4 transition-transform flex-shrink-0 text-slate-600", isOpen && "rotate-90")}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="ml-9 mt-0.5 space-y-0.5">
                    {item.children.map(child => (
                      <Link key={child.href} href={child.href} onClick={onClose}
                        className={cn("block px-3 py-2 rounded-xl text-sm transition-colors",
                          pathname.startsWith(child.href)
                            ? "text-brand-400 bg-brand-600/10 font-medium ring-1 ring-brand-500/20"
                            : "text-slate-500 hover:text-slate-200 hover:bg-white/5")}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href!} onClick={onClose}
              className={cn("sidebar-link", pathname.startsWith(item.href!) && "active")}>
              {item.icon}{item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#e50914" }}>
            <span className="text-xs font-bold text-white">{user?.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Logout">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
