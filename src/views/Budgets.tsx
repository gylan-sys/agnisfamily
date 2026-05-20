import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Budget, Transaction } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { Plus, Target, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: "Groceries",
    limit_amount: "",
    month: new Date().toISOString().substring(0, 7)
  });

  const categories = ["Groceries", "Bills", "Rent", "Entertainment", "Dining", "Health", "Transport", "Other"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [b, t] = await Promise.all([api.budgets.getAll(), api.transactions.getAll()]);
    setBudgets(b);
    setTransactions(t);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.budgets.create({
      ...newBudget,
      limit_amount: parseFloat(newBudget.limit_amount)
    });
    setShowModal(false);
    loadData();
  };

  const currentMonth = new Date().toISOString().substring(0, 7);
  
  const budgetStats = budgets
    .filter(b => b.month === currentMonth)
    .map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...b, spent };
    });

  return (
    <div className="pb-16 lg:pb-0 space-y-6 md:space-y-8">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">Budgets</h2>
          <p className="text-gray-400 mt-1 text-xs md:text-sm font-medium">Smart spending limits for your family.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowModal(true)}
            className="hidden md:flex items-center bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all font-black uppercase tracking-widest text-xs"
          >
            <Plus size={20} className="mr-2" />
            Set Budget
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {budgetStats.map((b) => {
          const percent = Math.min((b.spent / b.limit_amount) * 100, 100);
          const isOver = b.spent > b.limit_amount;

          return (
            <motion.div 
              layout
              key={b.id}
              className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-gray-50 shadow-sm md:shadow-xl hover:border-indigo-100 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm shadow-indigo-50">
                  <Target size={24} />
                </div>
                {isOver && (
                  <div className="flex items-center text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl animate-pulse">
                    <AlertCircle size={14} className="mr-1.5" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Over Budget</span>
                  </div>
                )}
              </div>

              <h4 className="text-xl font-black text-gray-900 mb-1 uppercase italic tracking-tighter">{b.category}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Monthly Limit • {b.month}</p>

              <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Spent</p>
                    <p className="text-lg font-black text-gray-900 leading-none">Rp{b.spent.toLocaleString()}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Limit</p>
                    <p className="text-xs font-black text-gray-500">Rp{b.limit_amount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden p-1 border border-gray-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.4)]'}`}
                  />
                </div>

                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{Math.round(percent)}% Explored</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isOver ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}`}>
                     {isOver ? `Excess: Rp${(b.spent - b.limit_amount).toLocaleString()}` : `Left: Rp${(b.limit_amount - b.spent).toLocaleString()}`}
                   </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        
        {budgetStats.length === 0 && (
          <div className="col-span-full py-24 text-center bg-gray-50/50 rounded-[40px] border-4 border-dashed border-gray-100">
             <div className="p-6 bg-white rounded-full inline-block shadow-sm mb-4">
                <Target size={32} className="text-gray-300" />
             </div>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active plans.</p>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      {user?.role === 'admin' && (
        <button 
          onClick={() => setShowModal(true)}
          className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform shadow-indigo-200"
        >
          <Plus size={32} />
        </button>
      )}

      {/* Set Budget Modal */}
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
              <h3 className="text-2xl font-black text-gray-900 mb-1">Set Limit</h3>
              <p className="text-gray-400 text-sm font-medium">Define spending targets for your family.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Category</label>
                <select
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold appearance-none shadow-sm"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Amount Limit</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xs">Rp</span>
                    <input
                      required
                      type="number"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-indigo-600 font-black text-lg shadow-sm"
                      placeholder="0"
                      value={newBudget.limit_amount}
                      onChange={(e) => setNewBudget({ ...newBudget, limit_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Target Month</label>
                  <input
                    required
                    type="month"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold shadow-sm"
                    value={newBudget.month}
                    onChange={(e) => setNewBudget({ ...newBudget, month: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4 uppercase tracking-[0.2em]"
              >
                Apply Budget
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
