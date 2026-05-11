"use client";
import Modal from "@/components/ui/Modal";
import Timeline from "@/components/ui/Timeline";
import { formatDateTime, formatDate } from "@/lib/utils";
import type { Registration } from "@/types";
import { getUser } from "@/lib/auth";
import { useState } from "react";
import StorageEditModal from "./StorageEditModal";

interface Props {
  open: boolean;
  onClose: () => void;
  registration: Registration | null;
  onSaved?: () => void;
}

export default function StorageTimelineModal({ open, onClose, registration, onSaved }: Props) {
  const user = typeof window !== "undefined" ? getUser() : null;
  const isAdmin = user?.role === "admin";
  const [editingStorage, setEditingStorage] = useState<{id: number, start_date: string, end_date: string | null, moved_at: string, note: string} | null>(null);

  // Langsung ambil dari data registrasi, tidak perlu fetch API lagi
  const records = registration?.storage_records || [];

  const items = records.map(r => ({
    id: r.id,
    title: `${r.yard?.name || "Yard"} — Block ${r.block?.block_code || "-"}`,
    subtitle: r.note || undefined,
    datetime: formatDateTime(r.moved_at),
    badge: `L${r.pos_length} W${r.pos_width} H${r.pos_height}`,
    badgeColor: "green" as const,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ),
    onEdit: isAdmin ? () => setEditingStorage({ id: r.id, start_date: r.start_date, end_date: r.end_date || null, moved_at: r.moved_at, note: r.note || "" }) : undefined,
    details: [
      { label: "Status", value: r.cargo_status?.description || "-" },
      { label: "Mulai", value: formatDate(r.start_date) },
      { 
        label: "Tarif/Hari", 
        value: r.storage_price_per_day ? (
          <span className="text-emerald-400 font-medium">Rp {Number(r.storage_price_per_day).toLocaleString('id-ID')}</span>
        ) : "-" 
      },
      { 
        label: "Operator", 
        value: r.moved_by ? (
          <div className="flex flex-col gap-0.5 mt-0.5">
            <span className="text-slate-200 font-medium leading-none">{r.moved_by.name}</span>
            {(r.moved_by.jabatan || r.moved_by.bagian) && (
              <span className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded w-fit mt-1">
                {r.moved_by.jabatan}{r.moved_by.jabatan && r.moved_by.bagian ? ' • ' : ''}{r.moved_by.bagian}
              </span>
            )}
          </div>
        ) : "-" 
      },
    ],
  }));

  return (
    <Modal open={open} onClose={onClose} title="Riwayat Storage" size="md">
      {records.length === 0 ? (
        <p className="text-center text-slate-500 py-8">Belum ada riwayat Storage</p>
      ) : (
        <Timeline items={items} />
      )}
      
      <StorageEditModal 
        open={!!editingStorage} 
        onClose={() => setEditingStorage(null)} 
        storageId={editingStorage?.id || null} 
        initialData={editingStorage}
        onSaved={() => {
          setEditingStorage(null);
          if (onSaved) onSaved();
          onClose(); // Close the timeline modal so user refreshes data
        }}
      />
    </Modal>
  );
}