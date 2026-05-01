"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, clearAuth, isAdmin } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { User } from "@/types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface NavItem {
  href?: string;
  label: string;
  icon?: React.ReactNode;
  roles?: string[];
  children?: (NavItem & { href: string })[];
}

const Icon = ({ path }: { path: string }) => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export default function Sidebar({ onClose, collapsed, onToggleCollapse }: { onClose?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  
  useEffect(() => { setUser(getUser()); }, []);

  useEffect(() => {
    if (collapsed) {
      setExpanded(null);
    } else {
      navItems.forEach(item => {
        if (item.children) {
          const isActive = item.children.some(c => pathname.startsWith(c.href));
          if (isActive) {
            setExpanded(item.label.toLowerCase().replace(/\s+/g, '-'));
          }
        }
      });
    }
  }, [pathname, collapsed]);

  const admin = user?.role === "admin";

  const navItems: NavItem[] = [
    {
      href: "/dashboard", label: "Dashboard",
      roles: ["admin", "operator", "finance"],
      icon: <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    },
    {
      href: "/registrations", label: "Registrasi",
      roles: ["admin", "operator"],
      icon: <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    },
    {
      href: "/invoices", label: "Invoice",
      roles: ["admin", "finance"],
      icon: <Icon path="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />,
    },
    {
      href: "/tariffs", label: "Tarif",
      roles: ["admin", "finance"],
      icon: <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    {
      label: "Warehouse",
      roles: ["admin", "operator", "finance"],
      icon: <Icon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m10 0h2a2 2 0 002-2v-5a2 2 0 00-2-2H3a2 2 0 00-2 2v5a2 2 0 002 2h2" />,
      children: [
        { href: "/warehouse-dashboard", label: "Dashboard", roles: ["admin", "operator", "finance"] },
        { href: "/warehouse-rent", label: "Sewa Warehouse", roles: ["admin", "operator", "finance"] },
        { href: "/warehouse-ba", label: "Berita Acara", roles: ["admin", "finance"] },
        { href: "/warehouse-invoices", label: "Invoice", roles: ["admin", "finance"] },
      ]
    },
    {
      label: "Master Data",
      roles: ["admin"],
      icon: <Icon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
      children: [
        { href: "/master/users", label: "User" },
        { href: "/master/freight-forwarders", label: "Business Partner" },
        { href: "/master/yards", label: "Yard & Block" },
        { href: "/master/warehouses", label: "Warehouse & Chamber" },
        { href: "/master/container-sizes", label: "Container Size & Type" },
        { href: "/master/cargo-statuses", label: "Cargo Status" },
        { href: "/master/taxes", label: "Tax & Discount" },
        { href: "/master/packages", label: "Paket" },
      ],
    },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push("/login");
  }

  const visibleItems = navItems.filter(i => {
    if (!i.roles) return true;
    if (!user) return false;
    return i.roles.includes(user.role);
  });

  return (
    <div className="flex flex-col h-full transition-all duration-300" style={{ background: "#111827", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header */}
      <div className={cn("flex items-center gap-3 px-4 py-5 overflow-hidden transition-all duration-300", collapsed && "px-3 justify-center")} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <img src="/images/logo-smnt.png" alt="Logo" className={cn("w-8 h-8 object-contain flex-shrink-0 transition-transform", collapsed && "scale-110")} />
        {!collapsed && (
          <div className="min-w-0 transition-opacity duration-300">
            <p className="text-sm font-bold text-white tracking-tight truncate">SMNT Logistics</p>
            <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest">Management System</p>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 text-slate-500 hover:text-white lg:hidden">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 custom-scrollbar">
        {visibleItems.map((item) => {
          if (item.children) {
            const menuKey = item.label.toLowerCase().replace(/\s+/g, '-');
            const isOpen = expanded === menuKey;
            
            // Filter children based on roles
            const filteredChildren = item.children.filter(c => {
              if (!c.roles) return true;
              if (!user) return false;
              return c.roles.includes(user.role);
            });

            if (filteredChildren.length === 0) return null;

            const isActive = filteredChildren.some(c => pathname.startsWith(c.href));

            return (
              <div key={item.label}>
                <button
                  onClick={() => !collapsed && setExpanded(isOpen ? null : menuKey)}
                  className={cn("sidebar-link w-full group", collapsed && "justify-center px-0", isActive && "text-white")}
                  title={collapsed ? item.label : ""}
                >
                  <span className={cn("flex items-center gap-3", collapsed && "gap-0")}>
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                  {!collapsed && (
                    <svg className={cn("w-4 h-4 transition-transform flex-shrink-0 text-slate-600", isOpen && "rotate-90")}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
                {!collapsed && (
                  <div className={cn("sidebar-child-container", isOpen && "open")}>
                    <div className="sidebar-child-content">
                      <div className="ml-9 mt-0.5 space-y-0.5 pb-2">
                        {filteredChildren.map(child => (
                          <Link key={child.href} href={child.href} onClick={onClose}
                            className={cn("block px-3 py-2 rounded-xl text-sm transition-colors",
                              pathname.startsWith(child.href)
                                ? "text-brand-400 bg-brand-600/10 font-medium ring-1 ring-brand-500/20"
                                : "text-slate-500 hover:text-slate-200 hover:bg-white/5")}>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href!} onClick={onClose}
              title={collapsed ? item.label : ""}
              className={cn("sidebar-link", collapsed && "justify-center px-0", pathname.startsWith(item.href!) && "active")}>
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions / Collapse Toggle */}
      <div className="p-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} className="hidden lg:flex sidebar-link w-full justify-center hover:bg-brand-600/10 hover:text-brand-400">
            <svg className={cn("w-5 h-5 transition-transform duration-500", collapsed && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        <div className={cn("flex items-center gap-3 px-2 py-2 rounded-lg transition-all", collapsed ? "justify-center" : "bg-white/5")}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#e50914" }}>
            <span className="text-xs font-bold text-white">{user?.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 capitalize tracking-wider font-bold">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setLogoutConfirm(true)} disabled={loggingOut}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Logout">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog 
        open={logoutConfirm} 
        onClose={() => setLogoutConfirm(false)} 
        onConfirm={handleLogout}
        title="Logout"
        message="Apakah Anda yakin ingin keluar dari aplikasi?"
        confirmLabel="Logout"
        danger={true}
        loading={loggingOut}
      />
    </div>
  );
}
