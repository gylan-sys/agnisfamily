import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Bill } from "../types";
import { Plus, CheckCircle2, Circle, Calendar, Receipt } from "lucide-react";
import { motion } from "motion/react";

export default function Bills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [showModal, setShowModal] = useState(false);
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

  const toggleStatus = async (bill: Bill) => {
    const newStatus = bill.status === 'paid' ? 'unpaid' : 'paid';
    await api.bills.updateStatus(bill.id, newStatus);
    loadBills();
  };

  return (
    <div className="pb-16 lg:pb-0 space-y-6 md:space-y-8">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">Bills</h2>
          <p className="text-gray-400 mt-1 text-xs md:text-sm font-medium">Manage and track family obligations.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="hidden md:flex items-center bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all font-black uppercase tracking-widest text-xs"
        >
          <Plus size={20} className="mr-2" />
          Add Bill
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {bills.map((bill) => (
          <motion.div 
            layout
            key={bill.id}
            onClick={() => toggleStatus(bill)}
            className={`flex items-center justify-between p-5 md:p-6 rounded-[32px] border-2 cursor-pointer active:scale-[0.98] transition-all ${
              bill.status === 'paid' 
                ? 'bg-gray-50/50 border-transparent opacity-60' 
                : 'bg-white border-indigo-50 shadow-sm md:shadow-xl hover:border-indigo-100'
            }`}
          >
            <div className="flex items-center overflow-hidden mr-4">
              <div className={`p-3 md:p-4 rounded-[20px] md:rounded-[24px] mr-4 md:mr-6 transition-all ${
                bill.status === 'paid' ? 'bg-green-100 text-green-600 shadow-sm shadow-green-50' : 'bg-indigo-100 text-indigo-600 shadow-sm shadow-indigo-50'
              }`}>
                {bill.status === 'paid' ? <CheckCircle2 size={24} /> : <Receipt size={24} />}
              </div>
              <div className="overflow-hidden">
                <h4 className={`text-base md:text-xl font-black uppercase tracking-tighter truncate ${bill.status === 'paid' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {bill.name}
                </h4>
                <div className="flex items-center text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mt-1">
                  <Calendar size={12} className="mr-2" />
                  Due {new Date(bill.due_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className={`text-lg md:text-2xl font-black italic tracking-tighter leading-none ${bill.status === 'paid' ? 'text-gray-400' : 'text-indigo-600'}`}>
                Rp{bill.amount.toLocaleString()}
              </p>
              <div className={`inline-block text-[8px] md:text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-lg mt-2 ${
                bill.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {bill.status}
              </div>
            </div>
          </motion.div>
        ))}

        {bills.length === 0 && (
          <div className="py-24 text-center bg-gray-50/50 rounded-[40px] border-4 border-dashed border-gray-100">
             <div className="p-6 bg-white rounded-full inline-block shadow-sm mb-4 text-gray-300">
               <Receipt size={48} />
             </div>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">All clear!</p>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform shadow-indigo-200"
      >
        <Plus size={32} />
      </button>

      {/* New Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl p-10 max-w-md w-full relative"
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full transition-all"
            >
              <Plus size={24} className="rotate-45" />
            </button>
            
            <div className="mb-8">
              <h3 className="text-2xl font-black text-gray-900 mb-1">New Liability</h3>
              <p className="text-gray-400 text-sm font-medium">Record a recurring family expense.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Bill Name</label>
                <input
                  required
                  type="text"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold shadow-sm"
                  placeholder="e.g. Fiber Internet"
                  value={newBill.name}
                  onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Amount Due</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xs">Rp</span>
                    <input
                      required
                      type="number"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-indigo-600 font-black text-lg shadow-sm"
                      placeholder="0"
                      value={newBill.amount}
                      onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Next Due</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold shadow-sm"
                    value={newBill.due_date}
                    onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4 uppercase tracking-[0.2em]"
              >
                Record Bill
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
