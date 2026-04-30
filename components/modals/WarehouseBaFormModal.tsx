"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { freightForwardersApi, warehouseBeritaAcarasApi } from "@/lib/api";
import { getErrorMessage, formatCurrency, cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function WarehouseBaFormModal({ open, onClose, onSaved }: Props) {
  const [step, setStep] = useState(1);
  const [ffs, setFfs] = useState<any[]>([]);
  const [ffId, setFfId] = useState("");
  const [warehouseGroups, setWarehouseGroups] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [loadingRegs, setLoadingRegs] = useState(false);

  const [selectedRegIds, setSelectedRegIds] = useState<number[]>([]);
  const [additionalFees, setAdditionalFees] = useState<{ fee_name: string; fee_amount: number }[]>([]);

  const [form, setForm] = useState({
    ba_date: new Date().toISOString().slice(0, 10),
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    signer_smnt_name: "",
    signer_smnt_position: "",
    signer_ff_name: "",
    signer_ff_position: "",
    approver_ff_name: "",
    approver_ff_position: ""
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1); setFfId(""); setWarehouseGroups([]); setSelectedWarehouseId(""); setSelectedRegIds([]); setAdditionalFees([]);
      freightForwardersApi.getAll().then(res => setFfs(res.data.data)).catch(() => { });
    }
  }, [open]);

  useEffect(() => {
    if (ffId && step === 2) {
      setLoadingRegs(true);
      warehouseBeritaAcarasApi.getInvoiceableRegistrations(Number(ffId))
        .then(res => setWarehouseGroups(res.data.data))
        .finally(() => setLoadingRegs(false));
    }
  }, [ffId, step]);

  const selectedWarehouseData = warehouseGroups.find(g => String(g.warehouse.id) === selectedWarehouseId);
  const selectedRegsSubtotal = selectedWarehouseData?.registrations
    .filter((r: any) => selectedRegIds.includes(r.id))
    .reduce((sum: number, r: any) => sum + Number(r.subtotal), 0) || 0;
  const feesTotal = additionalFees.reduce((sum, f) => sum + f.fee_amount, 0);
  const total = selectedRegsSubtotal + feesTotal;

  async function handleSubmit() {
    setSaving(true);
    try {
      await warehouseBeritaAcarasApi.create({
        freight_forwarder_id: Number(ffId),
        warehouse_id: Number(selectedWarehouseId),
        registration_ids: selectedRegIds,
        additional_fees: additionalFees,
        ...form
      });
      toast.success("Berita Acara berhasil dibuat"); onSaved();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Buat BA Warehouse - Langkah ${step}/3`} size="xl">
      <div className="space-y-6">
        {step === 1 && (
          <div className="grid grid-cols-1 gap-4">
            <div><label className="label">Pilih Freight Forwarder</label>
              <select className="input" value={ffId} onChange={e => setFfId(e.target.value)}>
                <option value="">-- Pilih --</option>{ffs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select></div>
            {ffId && (
              <div className="flex justify-end"><button className="btn-primary" onClick={() => setStep(2)}>Lanjut</button></div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {loadingRegs ? <p className="text-center py-8">Memuat data sewa...</p>
              : warehouseGroups.length === 0 ? <p className="text-center py-8 text-slate-500">Tidak ada data sewa yang siap diinvoice untuk FF ini.</p>
                : (
                  <>
                    <div><label className="label">Pilih Warehouse</label>
                      <select className="input" value={selectedWarehouseId} onChange={e => { setSelectedWarehouseId(e.target.value); setSelectedRegIds([]); }}>
                        <option value="">-- Pilih --</option>
                        {warehouseGroups.map(g => <option key={g.warehouse.id} value={g.warehouse.id}>{g.warehouse.name} ({g.registrations.length} sewa)</option>)}
                      </select></div>

                    {selectedWarehouseData && (
                      <div className="border border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-800">
                            <tr>
                              <th className="px-3 py-2 text-left"><input type="checkbox" onChange={e => {
                                if (e.target.checked) setSelectedRegIds(selectedWarehouseData.registrations.map((r: any) => r.id));
                                else setSelectedRegIds([]);
                              }} checked={selectedRegIds.length === selectedWarehouseData.registrations.length} /></th>
                              <th className="px-3 py-2 text-left">Chamber</th>
                              <th className="px-3 py-2 text-left">Periode</th>
                              <th className="px-3 py-2 text-left">Hari</th>
                              <th className="px-3 py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedWarehouseData.registrations.map((r: any) => (
                              <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                                <td className="px-3 py-2"><input type="checkbox" checked={selectedRegIds.includes(r.id)} onChange={e => {
                                  if (e.target.checked) setSelectedRegIds(p => [...p, r.id]);
                                  else setSelectedRegIds(p => p.filter(id => id !== r.id));
                                }} /></td>
                                <td className="px-3 py-2">{r.chamber?.code}</td>
                                <td className="px-3 py-2">{formatDate(r.rent_start)} - {formatDate(r.rent_end)}</td>
                                <td className="px-3 py-2">{r.total_rent_days}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(r.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <button className="btn-secondary" onClick={() => setStep(1)}>Kembali</button>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Terpilih: {selectedRegIds.length} item</p>
                        <p className="text-sm font-bold text-white">Subtotal: {formatCurrency(selectedRegsSubtotal)}</p>
                      </div>
                      {selectedRegIds.length > 0 && <button className="btn-primary" onClick={() => setStep(3)}>Lanjut</button>}
                    </div>
                  </>
                )}
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Biaya Tambahan</p>
                  <button className="text-brand-400 text-xs hover:underline" onClick={() => setAdditionalFees(p => [...p, { fee_name: "", fee_amount: 0 }])}>+ Tambah</button>
                </div>
                <div className="space-y-2">
                  {additionalFees.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="input text-xs flex-1" placeholder="Nama Biaya" value={f.fee_name} onChange={e => setAdditionalFees(p => p.map((x, idx) => idx === i ? { ...x, fee_name: e.target.value } : x))} />
                      <input className="input text-xs w-32"
                        placeholder="Jumlah"
                        value={new Intl.NumberFormat("id-ID").format(f.fee_amount)}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "");
                          setAdditionalFees(p => p.map((x, idx) => idx === i ? { ...x, fee_amount: parseInt(val) || 0 } : x))
                        }}
                      />
                      <button className="text-red-400 p-2" onClick={() => setAdditionalFees(p => p.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-500 uppercase">Informasi Pembayaran (Bank)</p>
                <div className="grid grid-cols-1 gap-3">
                  <div><label className="label text-[10px]">Nama Bank</label><input className="input text-xs" value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label text-[10px]">Nama Rekening</label><input className="input text-xs" value={form.bank_account_name} onChange={e => setForm(p => ({ ...p, bank_account_name: e.target.value }))} /></div>
                    <div><label className="label text-[10px]">Nomor Rekening</label><input className="input text-xs" value={form.bank_account_number} onChange={e => setForm(p => ({ ...p, bank_account_number: e.target.value }))} /></div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-lg space-y-2 mt-4">
                <div className="flex justify-between text-xs text-slate-400"><span>Subtotal Sewa:</span><span>{formatCurrency(selectedRegsSubtotal)}</span></div>
                <div className="flex justify-between text-xs text-slate-400"><span>Biaya Tambahan:</span><span>{formatCurrency(feesTotal)}</span></div>
                <div className="flex justify-between text-base font-bold text-brand-400 pt-2 border-t border-slate-700"><span>TOTAL:</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase">Informasi Penandatangan</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2"><label className="label">Tanggal BA</label><input className="input" type="date" value={form.ba_date} onChange={e => setForm(p => ({ ...p, ba_date: e.target.value }))} /></div>

                <div className="space-y-2 p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Pihak SMNT</p>
                  <div><label className="label text-[10px]">Nama</label><input className="input text-xs" value={form.signer_smnt_name} onChange={e => setForm(p => ({ ...p, signer_smnt_name: e.target.value }))} /></div>
                  <div><label className="label text-[10px]">Jabatan</label><input className="input text-xs" value={form.signer_smnt_position} onChange={e => setForm(p => ({ ...p, signer_smnt_position: e.target.value }))} /></div>
                </div>

                <div className="space-y-2 p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Pihak FF (Operasional)</p>
                  <div><label className="label text-[10px]">Nama</label><input className="input text-xs" value={form.signer_ff_name} onChange={e => setForm(p => ({ ...p, signer_ff_name: e.target.value }))} /></div>
                  <div><label className="label text-[10px]">Jabatan</label><input className="input text-xs" value={form.signer_ff_position} onChange={e => setForm(p => ({ ...p, signer_ff_position: e.target.value }))} /></div>
                </div>

                <div className="col-span-2 space-y-2 p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Approver FF (Direktur/Pimpinan)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label text-[10px]">Nama</label><input className="input text-xs" value={form.approver_ff_name} onChange={e => setForm(p => ({ ...p, approver_ff_name: e.target.value }))} /></div>
                    <div><label className="label text-[10px]">Jabatan</label><input className="input text-xs" value={form.approver_ff_position} onChange={e => setForm(p => ({ ...p, approver_ff_position: e.target.value }))} /></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-6 border-t border-slate-800">
                <button className="btn-secondary" onClick={() => setStep(2)}>Kembali</button>
                <button className="btn-primary" disabled={saving} onClick={handleSubmit}>{saving ? "Menyimpan..." : "Simpan Berita Acara"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
