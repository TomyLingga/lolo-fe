"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Timeline from "@/components/ui/Timeline";
import { remarksApi } from "@/lib/api";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Registration, RegistrationRemark } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  registration: Registration | null;
  readOnly?: boolean;
}

export default function RemarkModal({ open, onClose, registration, readOnly }: Props) {
  const [remarks, setRemarks] = useState<RegistrationRemark[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRemark, setNewRemark] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !registration) return;
    setLoading(true);
    remarksApi.getByRegistration(registration.id)
      .then(r => setRemarks(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, registration]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!registration || !newRemark.trim()) return;
    setSaving(true);
    try {
      await remarksApi.create(registration.id, newRemark.trim());
      toast.success("Catatan ditambahkan");
      setNewRemark("");
      const r = await remarksApi.getByRegistration(registration.id);
      setRemarks(r.data.data || []);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  const items = remarks.map(r => ({
    id: r.id, title: r.remark,
    subtitle: r.created_by || "",
    datetime: formatDateTime(r.created_at),
    badgeColor: "slate" as const,
  }));

  return (
    <Modal open={open} onClose={onClose} title="Catatan Registrasi" size="md">
      {loading ? <p className="text-center text-slate-500 py-8">Memuat...</p> : <Timeline items={items} />}
      {!readOnly && (
        <form onSubmit={handleAdd} className="mt-4 border-t border-slate-800 pt-4 flex gap-2">
          <input className="input flex-1" placeholder="Tambah catatan..." value={newRemark}
            onChange={e => setNewRemark(e.target.value)} required />
          <button type="submit" className="btn-primary" disabled={saving}>Tambah</button>
        </form>
      )}
    </Modal>
  );
}
