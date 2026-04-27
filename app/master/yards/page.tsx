"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { yardsApi, blocksApi } from "@/lib/api";
import { getErrorMessage, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Yard, Block } from "@/types";

interface BlockForm { block_code: string; max_length: string; max_width: string; max_height: string; id?: number; }

export default function YardsPage() {
  const [yards, setYards] = useState<Yard[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedYard, setExpandedYard] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editYard, setEditYard] = useState<Yard | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [blockForms, setBlockForms] = useState<BlockForm[]>([{ block_code: "", max_length: "", max_width: "", max_height: "" }]);
  const [saving, setSaving] = useState(false);

  const [deactivateYard, setDeactivateYard] = useState<Yard | null>(null);
  const [deactivateBlock, setDeactivateBlock] = useState<Block | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [y, b] = await Promise.all([yardsApi.getAll(), blocksApi.getAll()]);
      setYards(y.data.data || []);
      setBlocks(b.data.data || []);
    } catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openForm(yard?: Yard) {
    setEditYard(yard || null);
    if (yard) {
      setForm({ name: yard.name, code: yard.code, description: yard.description || "" });
      const yardBlocks = blocks.filter(b => b.yard_id === yard.id);
      setBlockForms(yardBlocks.length > 0
        ? yardBlocks.map(b => ({ id: b.id, block_code: b.block_code, max_length: String(b.max_length), max_width: String(b.max_width), max_height: String(b.max_height) }))
        : [{ block_code: "", max_length: "", max_width: "", max_height: "" }]);
    } else {
      setForm({ name: "", code: "", description: "" });
      setBlockForms([{ block_code: "", max_length: "", max_width: "", max_height: "" }]);
    }
    setFormOpen(true);
  }

  function addBlockRow() { setBlockForms(p => [...p, { block_code: "", max_length: "", max_width: "", max_height: "" }]); }
  function removeBlockRow(i: number) { setBlockForms(p => p.filter((_, idx) => idx !== i)); }
  function setBlockField(i: number, k: keyof BlockForm, v: string) {
    setBlockForms(p => p.map((b, idx) => idx === i ? { ...b, [k]: v } : b));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      let yardId: number;
      if (editYard) {
        await yardsApi.update(editYard.id, { name: form.name, code: form.code, description: form.description });
        yardId = editYard.id;
      } else {
        const res = await yardsApi.create({ name: form.name, code: form.code, description: form.description });
        yardId = res.data.data.id;
      }
      // Save blocks
      for (const bf of blockForms) {
        if (!bf.block_code) continue;
        const payload = { yard_id: yardId, block_code: bf.block_code, max_length: Number(bf.max_length), max_width: Number(bf.max_width), max_height: Number(bf.max_height) };
        if (bf.id) await blocksApi.update(bf.id, payload);
        else await blocksApi.create(payload);
      }
      toast.success(editYard ? "Yard diperbarui" : "Yard dibuat"); setFormOpen(false); fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function handleDeactivateYard() {
    if (!deactivateYard) return; setDeactivateLoading(true);
    try { await yardsApi.deactivate(deactivateYard.id); toast.success("Yard dinonaktifkan"); setDeactivateYard(null); fetchData(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  async function handleDeactivateBlock() {
    if (!deactivateBlock) return; setDeactivateLoading(true);
    try { await blocksApi.deactivate(deactivateBlock.id); toast.success("Block dinonaktifkan"); setDeactivateBlock(null); fetchData(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  const filteredYards = search ? yards.filter(y => [y.name, y.code].some(v => v?.toLowerCase().includes(search.toLowerCase()))) : yards;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="Yard & Block" subtitle="Manajemen lokasi dan blok penyimpanan"
          actions={<button className="btn-primary btn-sm sm:btn" onClick={() => openForm()}>+ Tambah Yard</button>} />

        <div className="card p-4 mb-4">
          <input className="input max-w-sm" placeholder="Cari yard..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="space-y-3">
          {loading ? <div className="card p-8 text-center text-slate-500">Memuat...</div>
          : filteredYards.length === 0 ? <div className="card p-8 text-center text-slate-500">Tidak ada data</div>
          : filteredYards.map(yard => {
            const yardBlocks = blocks.filter(b => b.yard_id === yard.id);
            const isExpanded = expandedYard === yard.id;
            return (
              <div key={yard.id} className={cn("card overflow-hidden", !yard.is_active && "opacity-50")}>
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => setExpandedYard(isExpanded ? null : yard.id)}>
                  <svg className={cn("w-4 h-4 text-slate-500 transition-transform", isExpanded && "rotate-90")}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{yard.name}</span>
                      <span className="badge badge-slate">{yard.code}</span>
                      <span className="text-xs text-slate-500">{yardBlocks.length} block</span>
                    </div>
                    {yard.description && <p className="text-xs text-slate-500 mt-0.5">{yard.description}</p>}
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-sm btn-ghost" onClick={() => openForm(yard)} title="Edit">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button className="btn btn-sm btn-ghost text-red-400" onClick={() => setDeactivateYard(yard)} title="Nonaktifkan">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-800">
                    {yardBlocks.length === 0 ? (
                      <p className="text-sm text-slate-500 px-8 py-4">Belum ada block</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-800/40">
                          <tr>
                            {["Kode Block", "Max Length", "Max Width", "Max Height", "Status", "Aksi"].map(h => (
                              <th key={h} className="px-4 py-2 text-left table-header text-xs">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {yardBlocks.map(block => (
                            <tr key={block.id} className={cn("border-t border-slate-800/50", !block.is_active && "opacity-40")}>
                              <td className="px-4 py-2 font-medium text-slate-200">{block.block_code}</td>
                              <td className="px-4 py-2 text-slate-400">{block.max_length}</td>
                              <td className="px-4 py-2 text-slate-400">{block.max_width}</td>
                              <td className="px-4 py-2 text-slate-400">{block.max_height}</td>
                              <td className="px-4 py-2">
                                <span className={cn("badge", block.is_active ? "badge-green" : "badge-slate")}>
                                  {block.is_active ? "Aktif" : "Nonaktif"}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <button className="btn btn-sm btn-ghost text-red-400" onClick={() => setDeactivateBlock(block)} title="Nonaktifkan">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636" /></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Yard Form Modal */}
        <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editYard ? "Edit Yard" : "Tambah Yard"} size="xl">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Informasi Yard</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Nama Yard <span className="text-red-400">*</span></label>
                  <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="label">Kode Yard <span className="text-red-400">*</span></label>
                  <input className="input" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
                <div className="sm:col-span-2"><label className="label">Deskripsi</label>
                  <input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Daftar Block</p>
                <button type="button" className="btn-ghost btn-sm text-brand-400" onClick={addBlockRow}>+ Tambah Block</button>
              </div>
              <div className="space-y-3">
                {blockForms.map((bf, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-end p-3 bg-slate-800/40 rounded-lg">
                    <div><label className="label">Kode Block</label>
                      <input className="input" required={i === 0} value={bf.block_code} onChange={e => setBlockField(i, "block_code", e.target.value)} placeholder="A" /></div>
                    <div><label className="label">Max Length</label>
                      <input className="input" type="number" min={1} required={!!bf.block_code} value={bf.max_length} onChange={e => setBlockField(i, "max_length", e.target.value)} /></div>
                    <div><label className="label">Max Width</label>
                      <input className="input" type="number" min={1} required={!!bf.block_code} value={bf.max_width} onChange={e => setBlockField(i, "max_width", e.target.value)} /></div>
                    <div><label className="label">Max Height</label>
                      <input className="input" type="number" min={1} required={!!bf.block_code} value={bf.max_height} onChange={e => setBlockField(i, "max_height", e.target.value)} /></div>
                    <div>{i > 0 && !bf.id && (
                      <button type="button" onClick={() => removeBlockRow(i)} className="btn btn-sm btn-ghost text-red-400 w-full justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog open={!!deactivateYard} onClose={() => setDeactivateYard(null)} onConfirm={handleDeactivateYard}
          title="Nonaktifkan Yard" message={`Nonaktifkan yard "${deactivateYard?.name}"?`} confirmLabel="Nonaktifkan" danger loading={deactivateLoading} />
        <ConfirmDialog open={!!deactivateBlock} onClose={() => setDeactivateBlock(null)} onConfirm={handleDeactivateBlock}
          title="Nonaktifkan Block" message={`Nonaktifkan block "${deactivateBlock?.block_code}"?`} confirmLabel="Nonaktifkan" danger loading={deactivateLoading} />
      </div>
    </AppLayout>
  );
}
