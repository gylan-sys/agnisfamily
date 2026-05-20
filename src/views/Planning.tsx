import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Task, GroceryItem, User } from "../types";
import { 
  Plus, 
  CheckSquare, 
  Square, 
  Trash2, 
  ShoppingCart, 
  ClipboardList,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  ArrowUpAZ,
  ArrowDownAZ,
  SortAsc
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Planning() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newGrocery, setNewGrocery] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    assigned_to: ""
  });
  const [taskSort, setTaskSort] = useState<'none' | 'asc' | 'desc'>('none');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [t, g, u] = await Promise.all([
      api.tasks.getAll(),
      api.grocery.getAll(),
      api.users.getAll()
    ]);
    setTasks(t);
    setGroceries(g);
    setUsers(u);
  };

  const handleAddGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrocery.trim()) return;
    await api.grocery.create({ item: newGrocery });
    setNewGrocery("");
    loadData();
  };

  const toggleGrocery = async (item: GroceryItem) => {
    const newStatus = item.status === 'bought' ? 'pending' : 'bought';
    await api.grocery.updateStatus(item.id, newStatus);
    loadData();
  };

  const clearGroceries = async () => {
    await api.grocery.clearCompleted();
    loadData();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.tasks.create({
      ...newTask,
      assigned_to: newTask.assigned_to ? parseInt(newTask.assigned_to) : null
    });
    setShowTaskModal(false);
    setNewTask({ title: "", description: "", due_date: "", assigned_to: "" });
    loadData();
  };

  const updateTaskStatus = async (id: number, status: string) => {
    await api.tasks.updateStatus(id, status);
    loadData();
  };

  return (
    <div className="pb-16 lg:pb-0 space-y-6 md:space-y-8">
      <div className="px-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Planning</h2>
        <p className="text-gray-400 text-sm font-medium">Coordinate household chores and supplies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        {/* Grocery List */}
        <section className="bg-white md:bg-white/80 md:backdrop-blur-sm p-6 md:p-8 rounded-[40px] border-0 md:border md:border-gray-100 shadow-none md:shadow-xl flex flex-col h-[500px] md:h-[600px] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl mr-4 shadow-sm shadow-amber-50">
                <ShoppingCart size={22} />
              </div>
              <h3 className="text-xl font-black text-gray-900">Groceries</h3>
            </div>
            <button 
              onClick={clearGroceries}
              className="text-[10px] font-black text-gray-300 hover:text-rose-600 uppercase tracking-[0.2em] transition-colors"
            >
              Clear Cart
            </button>
          </div>

          <form onSubmit={handleAddGrocery} className="flex gap-3 mb-6">
            <input 
              type="text" 
              placeholder="What do we need?"
              className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-500 font-bold transition-all"
              value={newGrocery}
              onChange={(e) => setNewGrocery(e.target.value)}
            />
            <button type="submit" className="bg-amber-500 text-white p-4 rounded-2xl shadow-xl shadow-amber-100 hover:bg-amber-600 active:scale-95 transition-all">
              <Plus size={24} />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            <AnimatePresence initial={false}>
              {groceries.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  onClick={() => toggleGrocery(item)}
                  className={`flex items-center justify-between p-4 rounded-[24px] cursor-pointer active:scale-[0.98] transition-all border-2 ${
                    item.status === 'bought' ? 'bg-gray-50/50 border-transparent opacity-60' : 'bg-amber-50/20 border-amber-50 hover:bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-1.5 rounded-lg mr-4 transition-colors ${item.status === 'bought' ? 'bg-amber-100/50 text-amber-600' : 'bg-white border border-amber-200 text-transparent'}`}>
                      <CheckCircle2 size={16} />
                    </div>
                    <span className={`text-sm font-bold uppercase ${item.status === 'bought' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {item.item}
                    </span>
                  </div>
                  <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-[9px] text-gray-400 uppercase font-black">{item.user_name}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {groceries.length === 0 && (
              <div className="py-20 text-center text-gray-300">
                <p className="font-bold uppercase tracking-widest text-xs">Stocked up!</p>
              </div>
            )}
          </div>
        </section>

        {/* Household Tasks */}
        <section className="bg-white md:bg-white/80 md:backdrop-blur-sm p-6 md:p-8 rounded-[40px] border-0 md:border md:border-gray-100 shadow-none md:shadow-xl flex flex-col h-[500px] md:h-[600px] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl mr-4 shadow-sm shadow-indigo-50">
                <ClipboardList size={22} />
              </div>
              <h3 className="text-xl font-black text-gray-900">Task Board</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setTaskSort(prev => {
                  if (prev === 'none') return 'asc';
                  if (prev === 'asc') return 'desc';
                  return 'none';
                })}
                className={`p-2.5 rounded-xl transition-all border ${
                  taskSort !== 'none' 
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-600'
                }`}
                title="Sort by Due Date"
              >
                {taskSort === 'desc' ? <ArrowDownAZ size={20} /> : <SortAsc size={20} className={taskSort === 'none' ? 'opacity-50' : ''} />}
              </button>
              <button 
                onClick={() => setShowTaskModal(true)}
                className="hidden md:flex bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {[...tasks].sort((a, b) => {
              if (taskSort === 'none') return 0;
              
              const dateA = a.due_date ? new Date(a.due_date).getTime() : (taskSort === 'asc' ? Infinity : -Infinity);
              const dateB = b.due_date ? new Date(b.due_date).getTime() : (taskSort === 'asc' ? Infinity : -Infinity);

              if (taskSort === 'asc') return dateA - dateB;
              return dateB - dateA;
            }).map((task) => (
              <div key={task.id} className="bg-white border-2 border-gray-50 p-6 rounded-[32px] hover:border-indigo-100 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h4 className={`text-base font-black uppercase tracking-tight ${task.status === 'completed' ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  <select 
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    className="text-[9px] font-black uppercase tracking-wider py-1.5 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="pending">Wait</option>
                    <option value="in-progress">Busy</option>
                    <option value="completed">Done</option>
                  </select>
                </div>
                <p className="text-xs text-gray-400 font-medium mb-5 line-clamp-2 leading-relaxed">{task.description}</p>
                <div className="flex justify-between items-center bg-gray-50 p-1 rounded-2xl">
                  <div className="flex items-center text-[10px] font-bold text-gray-400 px-3">
                    <Calendar size={12} className="mr-2" />
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Deadline'}
                  </div>
                  <div className="flex items-center bg-white text-indigo-600 px-4 py-2 rounded-xl font-black text-[10px] shadow-sm uppercase italic">
                    {task.assigned_name || 'Family'}
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="py-20 text-center text-gray-300">
                <p className="font-bold uppercase tracking-widest text-xs">All clear!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => setShowTaskModal(true)}
        className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform shadow-indigo-200"
      >
        <Plus size={32} />
      </button>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl p-10 max-w-md w-full relative"
          >
            <button 
              onClick={() => setShowTaskModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full"
            >
              <Plus size={24} orientation="vertical" className="rotate-45" />
            </button>
            
            <div className="mb-8">
              <h3 className="text-2xl font-black text-gray-900 mb-2">New Task</h3>
              <p className="text-gray-400 text-sm font-medium">Assign a new responsibility to the family.</p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Task Title</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold"
                    placeholder="e.g. Garden maintenance"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Details</label>
                  <textarea
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-medium"
                    rows={3}
                    placeholder="Add some context..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Deadline</label>
                    <input
                      type="date"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Assignee</label>
                    <select
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold appearance-none"
                      value={newTask.assigned_to}
                      onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                    >
                      <option value="">Family</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4 uppercase tracking-[0.2em]"
              >
                Create Task
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function CircleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
