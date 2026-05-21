import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Bill } from "../types";
import { Plus, CheckCircle2, Calendar, Receipt, Check, AlertTriangle, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

export default function Bills() {
  const { language, t } = useLanguage();
  const [bills, setBills] = useState<Bill[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [confirmBill, setConfirmBill] = useState<Bill | null>(null);
  const [newBill, setNewBill] = useState({
    name: "",
    amount: "",
    due_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    const data = await api.bills.getAll();
    setBills(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.bills.create({
      ...newBill,
      amount: parseFloat(newBill.amount)
    });
    setShowModal(false);
    loadBills();
    setNewBill({ name: "", amount: "", due_date: new Date().toISOString().split('T')[0] });
  };

  const executeToggleStatus = async () => {
    if (!confirmBill) return;
    const newStatus = confirmBill.status === 'paid' ? 'unpaid' : 'paid';
    await api.bills.updateStatus(confirmBill.id, newStatus);
    setConfirmBill(null);
    loadBills();
  };

  // Calculations for total statistics
  const unpaidBills = bills.filter(b => b.status === 'unpaid');
  const paidBills = bills.filter(b => b.status === 'paid');

  const totalUnpaidAmount = unpaidBills.reduce((acc, b) => acc + b.amount, 0);
  const totalPaidAmount = paidBills.reduce((acc, b) => acc + b.amount, 0);
  const totalAmount = bills.reduce((acc, b) => acc + b.amount, 0);

  // Filter list
  const filteredBills = bills.filter(b => {
    if (filter === 'paid') return b.status === 'paid';
    if (filter === 'unpaid') return b.status === 'unpaid';
    return true;
  });

  // Multilingual labels helper
  const label = {
    title: t("nav.bills"),
    subtitle: language === "id" 
      ? "Lacak dan kelola kewajiban bulanan keluarga Anda." 
      : "Manage and track family obligations.",
    unpaidTitle: language === "id" ? "Belum Lunas" : "Unpaid",
    paidTitle: language === "id" ? "Sudah Lunas" : "Paid",
    totalTitle: language === "id" ? "Total Tagihan" : "Total Bills",
    billsCount: (count: number) => language === "id" ? `${count} Tagihan` : `${count} Bills`,
    all: language === "id" ? "Semua" : "All",
    dueLabel: language === "id" ? "Jatuh Tempo" : "Due Date",
    btnMarkPaid: language === "id" ? "Bayar" : "Mark Paid",
    btnMarkUnpaid: language === "id" ? "Belum Bayar" : "Mark Unpaid",
    confirmTitle: language === "id" ? "Konfirmasi Status Tagihan" : "Confirm Status Change",
    confirmTextPaid: (name: string) => language === "id" 
      ? `Apakah Anda yakin ingin menandai tagihan "${name}" sebagai SUDAH LUNAS?`
      : `Are you sure you want to mark "${name}" as PAID?`,
    confirmTextUnpaid: (name: string) => language === "id" 
      ? `Apakah Anda yakin ingin mengembalikan tagihan "${name}" menjadi BELUM LUNAS?`
      : `Are you sure you want to change "${name}" back to UNPAID?`,
    btnConfirm: language === "id" ? "Ya, Konfirmasi" : "Yes, Confirm",
    btnCancel: language === "id" ? "Batal" : "Cancel",
    addBill: language === "id" ? "Tambah Tagihan" : "Add Bill",
    newLabelTitle: language === "id" ? "Catat Tagihan Baru" : "New Liability",
    newLabelSubtitle: language === "id" ? "Masukkan pengeluaran keluarga berkala baru." : "Record a recurring family expense.",
    fieldName: language === "id" ? "Nama Pengeluaran" : "Bill Name",
    fieldAmount: language === "id" ? "Jumlah Tagihan" : "Amount Due",
    fieldDate: language === "id" ? "Tanggal Jatuh Tempo" : "Next Due",
    placeholderName: language === "id" ? "Contoh: Internet Indihome" : "e.g. Fiber Internet",
    submitBtn: language === "id" ? "Simpan Catatan" : "Record Bill"
  };

  return (
    <div id="bills-view-container" className="pb-24 lg:pb-8 space-y-5 md:space-y-6">
      {/* Header section with Add Button */}
      <div id="bills-header-row" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1">
        <div>
          <h2 id="bills-page-title" className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            <Receipt className="text-indigo-600" size={28} />
            {label.title}
          </h2>
          <p id="bills-page-subtitle" className="text-gray-500 text-xs md:text-sm mt-0.5 font-medium">{label.subtitle}</p>
        </div>
        <button 
          id="btn-add-bill-desktop"
          onClick={() => setShowModal(true)}
          className="hidden sm:flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={16} className="mr-1.5" />
          {label.addBill}
        </button>
      </div>

      {/* KPI Stats Summary Section - HIGH COMPACTNESS & RICH INFO */}
      <div id="bills-stats-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Unpaid Card */}
        <div id="bills-stat-unpaid" className="bg-gradient-to-br from-red-50/75 to-orange-50/50 border border-red-100/60 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] md:text-xs font-semibold text-red-600/90 uppercase tracking-widest">{label.unpaidTitle}</span>
            <p className="text-lg md:text-xl font-bold text-red-700 tracking-tight leading-none">
              Rp{totalUnpaidAmount.toLocaleString()}
            </p>
            <span className="text-[10px] text-red-500/80 block font-medium">{label.billsCount(unpaidBills.length)}</span>
          </div>
          <div className="rounded-lg bg-red-100/70 p-2 text-red-600 flex items-center justify-center">
            <Receipt size={18} />
          </div>
        </div>

        {/* Paid Card */}
        <div id="bills-stat-paid" className="bg-gradient-to-br from-emerald-50/75 to-green-50/50 border border-emerald-100/60 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] md:text-xs font-semibold text-emerald-600/95 uppercase tracking-widest">{label.paidTitle}</span>
            <p className="text-lg md:text-xl font-bold text-emerald-700 tracking-tight leading-none">
              Rp{totalPaidAmount.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-500/80 block font-medium">{label.billsCount(paidBills.length)}</span>
          </div>
          <div className="rounded-lg bg-emerald-100/70 p-2 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Total Overall Card */}
        <div id="bills-stat-total" className="bg-gradient-to-br from-indigo-50/75 to-slate-50/50 border border-indigo-100/40 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] md:text-xs font-semibold text-indigo-600/90 uppercase tracking-widest">{label.totalTitle}</span>
            <p className="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-none">
              Rp{totalAmount.toLocaleString()}
            </p>
            <span className="text-[10px] text-indigo-500/75 block font-medium">{label.billsCount(bills.length)}</span>
          </div>
          <div className="rounded-lg bg-indigo-100/70 p-2 text-indigo-600 flex items-center justify-center">
            <Calendar size={18} />
          </div>
        </div>
      </div>

      {/* Segmented Filter Pills & Info Text */}
      <div id="bills-filter-bar" className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
          <button
            id="filter-all-btn"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filter === 'all' 
                ? 'bg-white text-gray-900 shadow-xs font-bold' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {label.all} ({bills.length})
          </button>
          <button
            id="filter-unpaid-btn"
            onClick={() => setFilter('unpaid')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filter === 'unpaid' 
                ? 'bg-white text-red-600 shadow-xs font-bold' 
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            {label.unpaidTitle} ({unpaidBills.length})
          </button>
          <button
            id="filter-paid-btn"
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filter === 'paid' 
                ? 'bg-white text-emerald-600 shadow-xs font-bold' 
                : 'text-gray-500 hover:text-emerald-500'
            }`}
          >
            {label.paidTitle} ({paidBills.length})
          </button>
        </div>

        <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100/60 hidden sm:inline-block">
          💡 Klik badge status di sebelah kanan untuk memperbarui status pembayaran Anda secara aman.
        </span>
      </div>

      {/* Structured, More Proportional Compact Bills List */}
      <div id="bills-list-wrapper" className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredBills.map((bill) => {
          const isPaid = bill.status === 'paid';
          return (
            <motion.div 
              layout
              key={bill.id}
              id={`bill-row-${bill.id}`}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                isPaid 
                  ? 'bg-slate-50/85 border-slate-100 opacity-75' 
                  : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              {/* Left Column: Icon Indicator & Title */}
              <div className="flex items-center overflow-hidden min-w-0 mr-2">
                <div className={`p-2.5 rounded-lg flex-shrink-0 mr-3 transition-colors ${
                  isPaid ? 'bg-slate-200/50 text-slate-500' : 'bg-rose-50 border border-rose-100 text-rose-500'
                }`}>
                  <Receipt size={16} />
                </div>
                
                <div className="truncate pr-1">
                  <h4 className={`text-sm md:text-base font-bold tracking-tight truncate ${
                    isPaid ? 'text-slate-400 line-through font-normal' : 'text-slate-800'
                  }`}>
                    {bill.name}
                  </h4>
                  <div className="flex items-center text-[10px] md:text-xs text-slate-400 font-medium mt-0.5">
                    <Calendar size={11} className="mr-1 flex-shrink-0" />
                    <span>{label.dueLabel} {new Date(bill.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Amount & Interactive Status Button (Guarded to avoid click slipups) */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className={`text-sm md:text-base font-extrabold tracking-tight ${
                    isPaid ? 'text-slate-400' : 'text-slate-900'
                  }`}>
                    Rp{bill.amount.toLocaleString()}
                  </p>
                </div>

                {/* Explicit interactive trigger - clicking here brings up confirm dialog */}
                <button
                  id={`btn-toggle-receipt-${bill.id}`}
                  onClick={() => setConfirmBill(bill)}
                  className={`flex items-center gap-1 text-[10px] md:text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    isPaid 
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100' 
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100'
                  }`}
                  title="Ubah Status Pembayaran"
                >
                  {isPaid ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span>{label.paidTitle}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      <span>{label.unpaidTitle}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}

        {filteredBills.length === 0 && (
          <div id="bills-empty-state" className="col-span-full py-16 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
             <div className="p-4 bg-white rounded-full inline-block shadow-xs mb-3 text-slate-300">
               <Receipt size={32} />
             </div>
             <p className="text-slate-500 font-semibold tracking-wide text-xs uppercase">{label.all} Clear!</p>
             <p className="text-slate-400 text-xxs mt-0.5">Tidak ada tagihan yang cocok dengan filter yang dipilih.</p>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button (Only visible on smallest devices) */}
      <button 
        id="btn-add-bill-mobile"
        onClick={() => setShowModal(true)}
        className="sm:hidden fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>

      {/* Safe Action Confirmation Dialog (Absolute protection against accidental taps) */}
      <AnimatePresence>
        {confirmBill && (
          <div id="safety-confirmation-overlay" className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[80] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="safety-dialog-box"
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  confirmBill.status === 'paid' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <AlertTriangle size={20} />
                </div>
                <div className="space-y-1">
                  <h3 id="confirm-dialog-heading" className="text-base font-extrabold text-slate-900">
                    {label.confirmTitle}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {confirmBill.status === 'paid' 
                      ? label.confirmTextUnpaid(confirmBill.name)
                      : label.confirmTextPaid(confirmBill.name)
                    }
                  </p>
                </div>
              </div>

              {/* Tiny Invoice Card mockup in dialog for maximum visibility */}
              <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-400">Tagihan:</span>
                  <span className="font-bold text-slate-800">{confirmBill.name}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-400">Nominal:</span>
                  <span className="font-bold text-slate-800">Rp{confirmBill.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-400">Jatuh Tempo:</span>
                  <span className="text-slate-800">{new Date(confirmBill.due_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  id="btn-confirm-cancel"
                  onClick={() => setConfirmBill(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {label.btnCancel}
                </button>
                <button
                  id="btn-confirm-execute"
                  onClick={executeToggleStatus}
                  className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer ${
                    confirmBill.status === 'paid' 
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                  }`}
                >
                  {label.btnConfirm}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Bill Creation Drawer/Modal */}
      {showModal && (
        <div id="new-bill-modal-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <motion.div 
            initial={{ y: "15%" }}
            animate={{ y: 0 }}
            id="new-bill-sheet"
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-7 max-w-sm w-full relative"
          >
            <button 
              id="close-bill-modal-btn"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <div className="mb-5">
              <h3 className="text-base font-extrabold text-slate-900">{label.newLabelTitle}</h3>
              <p className="text-slate-400 text-xs">{label.newLabelSubtitle}</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 px-0.5">{label.fieldName}</label>
                <input
                  id="input-bill-name"
                  required
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2 px-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                  placeholder={label.placeholderName}
                  value={newBill.name}
                  onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 px-0.5">{label.fieldAmount}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                  <input
                    id="input-bill-amount"
                    required
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2 pl-8 pr-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                    placeholder="0"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 px-0.5">{label.fieldDate}</label>
                <input
                  id="input-bill-duedate"
                  required
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2 px-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold text-sm cursor-pointer"
                  value={newBill.due_date}
                  onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                />
              </div>

              <button
                id="btn-record-bill"
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-100 transition-all mt-2 cursor-pointer"
              >
                {label.submitBtn}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
