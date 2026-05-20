import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Transaction, Budget } from "../types";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2,
  Calendar,
  Tag
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { motion } from "motion/react";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTx, setNewTx] = useState({
    amount: "",
    type: "expense",
    category: "Groceries",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });

  const categories = ["Groceries", "Bills", "Rent", "Entertainment", "Dining", "Health", "Transport", "Other"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txData, budgetData] = await Promise.all([
        api.transactions.getAll(),
        api.budgets.getAll()
      ]);
      setTransactions(txData);
      setBudgets(budgetData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.transactions.create({
        ...newTx,
        amount: parseFloat(newTx.amount)
      });
      setShowAddModal(false);
      loadData();
      setNewTx({ ...newTx, amount: "", description: "" });
    } catch (err) {
      alert(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this transaction?")) {
      await api.transactions.delete(id);
      loadData();
    }
  };

  const totals = transactions.reduce((acc, curr) => {
    if (curr.type === 'income') acc.income += curr.amount;
    else acc.expense += curr.amount;
    return acc;
  }, { income: 0, expense: 0 });

  // Prepare Chart Data
  const chartData = transactions.reduce((acc: any[], curr) => {
    const month = curr.date.substring(0, 7);
    const existing = acc.find(a => a.month === month);
    if (existing) {
      if (curr.type === 'income') existing.income += curr.amount;
      else existing.expense += curr.amount;
    } else {
      acc.push({ month, income: curr.type === 'income' ? curr.amount : 0, expense: curr.type === 'expense' ? curr.amount : 0 });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  const categoryData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], curr) => {
      const existing = acc.find(a => a.name === curr.category);
      if (existing) existing.value += curr.amount;
      else acc.push({ name: curr.category, value: curr.amount });
      return acc;
    }, []);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

  return (
    <div className="pb-16 lg:pb-0 space-y-6 md:space-y-8">
      {/* Header section with context-aware title */}
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Finance</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base flex items-center">
            <Calendar size={14} className="mr-2" />
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="hidden md:flex items-center bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-bold"
        >
          <Plus size={20} className="mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center">
          <div className="p-4 bg-green-100 text-green-600 rounded-2xl mr-4">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Income</p>
            <p className="text-xl md:text-2xl font-black text-gray-900">
              Rp{totals.income.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center">
          <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl mr-4">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Expenses</p>
            <p className="text-xl md:text-2xl font-black text-gray-900">
              Rp{totals.expense.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-indigo-600 text-white p-6 rounded-[32px] shadow-xl shadow-indigo-100 relative overflow-hidden flex items-center">
          <div className="relative z-10 flex items-center w-full">
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl mr-4">
              <Tag size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-200 mb-1">Balance</p>
              <p className="text-xl md:text-2xl font-black">
                Rp{(totals.income - totals.expense).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Main Chart */}
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm h-[320px] md:h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 px-1">Weekly Trends</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.15)', padding: '12px' }}
              />
              <Bar dataKey="income" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Categories */}
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm h-[320px] md:h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 px-1">Spending Split</h3>
          <div className="relative h-[80%]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Total</p>
              <p className="text-lg font-black text-gray-900">100%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Recent Movements</h3>
          <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
            See All
          </button>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/30 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-4">Context</th>
                <th className="px-8 py-4">Tagged</th>
                <th className="px-8 py-4">Identity</th>
                <th className="px-8 py-4 text-right">Value</th>
                <th className="px-8 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-2xl mr-4 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <span className="font-bold text-sm text-gray-800">{t.description || t.category}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-gray-400">{t.user_name}</td>
                  <td className="px-8 py-6 text-right">
                    <span className={`font-black font-mono text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '-'}Rp{t.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="p-2 text-gray-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-gray-50">
          {transactions.map((t) => (
            <div key={t.id} className="p-6 flex items-center justify-between active:bg-gray-50 transition-colors">
              <div className="flex items-center min-w-0">
                <div className={`p-3 rounded-2xl mr-4 shrink-0 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate uppercase mt-1">{t.description || t.category}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{t.category} • {t.user_name}</p>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className={`font-black font-mono text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'income' ? '+' : '-'}Rp{t.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">{t.date}</p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm font-medium">No movements recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform active:bg-indigo-700"
      >
        <Plus size={32} />
      </button>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative"
          >
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <Plus size={24} className="rotate-45" />
            </button>
            <h3 className="text-xl font-bold mb-6">New Transaction</h3>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setNewTx({ ...newTx, type: 'income' })}
                  className={`py-2 rounded-xl text-sm font-bold transition-all ${
                    newTx.type === 'income' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setNewTx({ ...newTx, type: 'expense' })}
                  className={`py-2 rounded-xl text-sm font-bold transition-all ${
                    newTx.type === 'expense' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Expense
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rp</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-600 font-mono text-lg"
                    placeholder="0.00"
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full bg-gray-100 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-600"
                  value={newTx.category}
                  onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  required
                  type="date"
                  className="w-full bg-gray-100 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-600"
                  value={newTx.date}
                  onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-600"
                  placeholder="What was this for?"
                  value={newTx.description}
                  onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4"
              >
                Log Transaction
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
