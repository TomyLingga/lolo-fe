"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { usersApi } from "@/lib/api";
import { formatDateTime, getErrorMessage, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { User } from "@/types";

const F = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div><label className="label">{label}{req && <span className="text-red-400"> *</span>}</label>{children}</div>
);

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "operator", jabatan: "", bagian: "", password: "", password_confirmation: "" });
  const [saving, setSaving] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetForm, setResetForm] = useState({ password: "", password_confirmation: "" });
  const [resetSaving, setResetSaving] = useState(false);

  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData((await usersApi.getAll()).data.data || []); }
    catch { toast.error("Gagal memuat data user"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = search
    ? data.filter(u => [u.name, u.email, u.jabatan, u.bagian].some(v => v?.toLowerCase().includes(search.toLowerCase())))
    : data;

  function openForm(user?: User) {
    setEditUser(user || null);
    setForm(user
      ? { name: user.name, email: user.email, role: user.role, jabatan: user.jabatan || "", bagian: user.bagian || "", password: "", password_confirmation: "" }
      : { name: "", email: "", role: "operator", jabatan: "", bagian: "", password: "", password_confirmation: "" });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) {
      if (form.password.length < 8) { toast.error("Password minimal 8 karakter"); return; }
      if (form.password !== form.password_confirmation) { toast.error("Password tidak sama"); return; }
    }
    setSaving(true);
    try {
      if (editUser) {
        await usersApi.update(editUser.id, { name: form.name, email: form.email, role: form.role as "admin" | "operator" | "finance", jabatan: form.jabatan, bagian: form.bagian });
      } else {
        await usersApi.create({ name: form.name, email: form.email, role: form.role as "admin" | "operator" | "finance", jabatan: form.jabatan, bagian: form.bagian, password: form.password, password_confirmation: form.password_confirmation });
      }
      toast.success(editUser ? "User diperbarui" : "User dibuat"); setFormOpen(false); fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (resetForm.password.length < 8) { toast.error("Password minimal 8 karakter"); return; }
    if (resetForm.password !== resetForm.password_confirmation) { toast.error("Password tidak sama"); return; }
    if (!resetUser) return; setResetSaving(true);
    try {
      await usersApi.resetPassword(resetUser.id, resetForm.password, resetForm.password_confirmation);
      toast.success("Password berhasil direset"); setResetOpen(false);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setResetSaving(false); }
  }

  async function handleDeactivate() {
    if (!selectedUser) return; setDeactivateLoading(true);
    try {
      const res = await usersApi.deactivate(selectedUser.id);
      toast.success(res.data.is_active ? "User diaktifkan" : "User dinonaktifkan"); 
      setDeactivateConfirm(false); 
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="User" subtitle="Manajemen pengguna sistem"
          actions={<button className="btn-primary btn-sm sm:btn" onClick={() => openForm()}>+ Tambah User</button>} />

        <div className="card p-4 mb-4">
          <input className="input max-w-sm" placeholder="Cari nama, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>{["Nama", "Email", "Role", "Jabatan", "Bagian", "Terdaftar", "Aksi"].map(h => (
                  <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Memuat...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Tidak ada data</td></tr>
                    : filtered.map(u => (
                      <tr key={u.id} className={cn("table-row", !u.is_active && "opacity-40")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">{u.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-white font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={cn("badge", u.role === "admin" ? "badge-blue" : u.role === "finance" ? "badge-amber" : "badge-slate")}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{u.jabatan || "-"}</td>
                        <td className="px-4 py-3 text-slate-400">{u.bagian || "-"}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{formatDateTime(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button className="btn btn-sm btn-ghost" onClick={() => openForm(u)} title="Edit">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button className="btn btn-sm btn-ghost text-amber-400" onClick={() => { setResetUser(u); setResetForm({ password: "", password_confirmation: "" }); setResetOpen(true); }} title="Reset Password">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            </button>
                            <button className={cn("btn btn-sm btn-ghost", u.is_active ? "text-red-400" : "text-emerald-400")} 
                              onClick={() => { setSelectedUser(u); setDeactivateConfirm(true); }} title={u.is_active ? "Nonaktifkan" : "Aktifkan"}>
                              {u.is_active ? (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">{filtered.length} dari {data.length} user</p>
          </div>
        </div>

        {/* User Form Modal */}
        <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editUser ? "Edit User" : "Tambah User"} size="md">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Nama Lengkap" req><input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></F>
              <F label="Email" req><input className="input" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></F>
              <F label="Role" req>
                <select className="input" required value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="operator">Operator</option>
                  <option value="finance">Finance</option>
                  <option value="admin">Admin</option>
                </select>
              </F>
              <F label="Jabatan"><input className="input" value={form.jabatan} onChange={e => setForm(p => ({ ...p, jabatan: e.target.value }))} /></F>
              <F label="Bagian"><input className="input" value={form.bagian} onChange={e => setForm(p => ({ ...p, bagian: e.target.value }))} /></F>
              {!editUser && (
                <>
                  <F label="Password" req>
                    <input
                      className="input"
                      type="password"
                      required
                      minLength={8}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    />
                    {form.password.length > 0 && form.password.length < 8 && (
                      <p className="text-xs text-red-500 mt-1">Minimal 8 karakter ({form.password.length}/8)</p>
                    )}
                  </F>
                  <F label="Konfirmasi Password" req>
                    <input
                      className="input"
                      type="password"
                      required
                      value={form.password_confirmation}
                      onChange={e => setForm(p => ({ ...p, password_confirmation: e.target.value }))}
                    />
                    {form.password_confirmation.length > 0 && form.password !== form.password_confirmation && (
                      <p className="text-xs text-red-500 mt-1">Password tidak sama</p>
                    )}
                  </F>
                </>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>

        {/* Reset Password Modal */}
        <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={`Reset Password — ${resetUser?.name}`} size="sm">
          <form onSubmit={handleReset} className="space-y-4">
            <F label="Password Baru" req>
              <input
                className="input"
                type="password"
                required
                minLength={8}
                value={resetForm.password}
                onChange={e => setResetForm(p => ({ ...p, password: e.target.value }))}
              />
              {resetForm.password.length > 0 && resetForm.password.length < 8 && (
                <p className="text-xs text-red-500 mt-1">Minimal 8 karakter ({resetForm.password.length}/8)</p>
              )}
            </F>
            <F label="Konfirmasi Password" req>
              <input
                className="input"
                type="password"
                required
                value={resetForm.password_confirmation}
                onChange={e => setResetForm(p => ({ ...p, password_confirmation: e.target.value }))}
              />
              {resetForm.password_confirmation.length > 0 && resetForm.password !== resetForm.password_confirmation && (
                <p className="text-xs text-red-500 mt-1">Password tidak sama</p>
              )}
            </F>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setResetOpen(false)}>Batal</button>
              <button type="submit" className="btn-warning" disabled={resetSaving}>{resetSaving ? "Mereset..." : "Reset Password"}</button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog open={deactivateConfirm} onClose={() => setDeactivateConfirm(false)} onConfirm={handleDeactivate}
          title={selectedUser?.is_active ? "Nonaktifkan User" : "Aktifkan User"} 
          message={selectedUser?.is_active 
            ? `Nonaktifkan user "${selectedUser?.name}"?`
            : `Aktifkan kembali user "${selectedUser?.name}"?`} 
          confirmLabel={selectedUser?.is_active ? "Nonaktifkan" : "Aktifkan"} 
          danger={selectedUser?.is_active}
          success={!selectedUser?.is_active}
          loading={deactivateLoading} />
      </div>
    </AppLayout>
  );
}
