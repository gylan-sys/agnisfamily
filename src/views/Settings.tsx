import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { User } from "../types";
import { 
  Settings as SettingsIcon, 
  Users, 
  Lock, 
  ShieldAlert, 
  Trash2, 
  UserCog,
  CheckCircle2,
  XCircle,
  Plus,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'family'>('account');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "member" });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const data = await api.users.getAll();
      setAllUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    try {
      await api.users.changePassword({ 
        oldPassword: passwordData.oldPassword, 
        newPassword: passwordData.newPassword 
      });
      setMsg({ type: "success", text: "Password updated successfully!" });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      await api.users.updateRole(userId, newRole);
      loadUsers();
      setMsg({ type: "success", text: "Role updated" });
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const deleteUser = async (userId: number) => {
    if (confirm("Are you sure you want to remove this family member?")) {
      try {
        await api.users.delete(userId);
        loadUsers();
        setMsg({ type: "success", text: "User removed" });
        setTimeout(() => setMsg({ type: "", text: "" }), 3000);
      } catch (err: any) {
        setMsg({ type: "error", text: err.message });
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.users.create(newUser);
      setMsg({ type: "success", text: "New family member added!" });
      setShowAddModal(false);
      setNewUser({ name: "", email: "", password: "", role: "member" });
      loadUsers();
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const tabs = [
    { id: 'account', label: 'Account Security', icon: Lock },
    ...(user?.role === 'admin' ? [{ id: 'family', label: 'Family Management', icon: Users }] : []),
  ];

  return (
    <div className="pb-16 lg:pb-0 space-y-6 md:space-y-8">
      <header className="px-2">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 leading-none">Settings</h2>
        <p className="text-gray-400 mt-1 text-xs md:text-sm font-medium">Manage your private digital household space.</p>
      </header>

      <div className="bg-white md:bg-white/80 md:backdrop-blur-xl rounded-[40px] border-0 md:border md:border-gray-100 shadow-none md:shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
        {/* Tab Header */}
        <div className="px-4 md:px-8 pt-4 md:pt-8 border-b border-gray-50 md:border-gray-100 bg-gray-50/30">
          <div className="flex space-x-6 md:space-x-8 overflow-x-auto no-scrollbar scroll-smooth">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 md:pb-6 text-xs md:text-sm font-black uppercase tracking-widest flex items-center relative transition-all flex-shrink-0 ${
                    isActive ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-600'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {tab.label}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 md:h-1.5 bg-indigo-600 rounded-t-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 md:p-10 flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              {activeTab === 'account' ? (
                <div className="max-w-xl">
                  <div className="mb-8 md:mb-10">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">Account Security</h3>
                    <p className="text-gray-400 text-xs md:text-sm font-medium">Update your credentials to keep your family space secure.</p>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Current Password</label>
                        <input
                          required
                          type="password"
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold"
                          value={passwordData.oldPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">New Password</label>
                          <input
                            required
                            type="password"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Confirm</label>
                          <input
                            required
                            type="password"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full md:w-auto bg-indigo-600 text-white font-black py-5 md:py-4 px-10 rounded-2xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-widest"
                      >
                        Update Credentials
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-1">Family Circle</h3>
                      <p className="text-gray-400 text-xs md:text-sm font-medium">Manage members and their roles.</p>
                    </div>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="hidden md:flex bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 items-center font-black text-xs uppercase tracking-widest"
                    >
                      <UserPlus size={18} className="mr-2" />
                      Add Member
                    </button>
                  </div>

                  {/* Desktop View Table */}
                  <div className="hidden md:block border-2 border-gray-50 rounded-[40px] overflow-hidden bg-white">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50 text-left text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] border-b border-gray-50">
                          <th className="py-6 px-10">Name</th>
                          <th className="py-6 px-10">Account</th>
                          <th className="py-6 px-10">Permission Role</th>
                          <th className="py-6 px-10 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {allUsers.map((u) => (
                          <motion.tr 
                            layout
                            key={u.id} 
                            className="group hover:bg-indigo-50/20 transition-colors"
                          >
                            <td className="py-6 px-10">
                              <div className="flex items-center">
                                <div className="w-12 h-12 rounded-[18px] bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shadow-sm border border-white">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <p className="font-black text-gray-900 uppercase tracking-tighter italic">
                                    {u.name}
                                  </p>
                                  {u.id === user?.id && (
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Master Account</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-6 px-10 text-sm font-bold text-gray-400">{u.email}</td>
                            <td className="py-6 px-10">
                              <select
                                disabled={u.id === user?.id}
                                value={u.role}
                                onChange={(e) => updateUserRole(u.id, e.target.value)}
                                className="text-[10px] font-black uppercase tracking-widest border-none bg-gray-50 rounded-xl py-2 px-4 focus:ring-2 focus:ring-indigo-600 disabled:opacity-40 appearance-none cursor-pointer"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="py-6 px-10 text-right">
                              {u.id !== user?.id && (
                                <button
                                  onClick={() => deleteUser(u.id)}
                                  className="p-3 text-gray-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View Cards */}
                  <div className="md:hidden space-y-4">
                    {allUsers.map((u) => (
                      <div key={u.id} className="bg-white border-2 border-gray-50 p-6 rounded-[32px] shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-[18px] bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm border border-white shadow-sm">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <h4 className="font-black text-gray-900 uppercase tracking-tighter italic">{u.name}</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[120px]">{u.email}</p>
                            </div>
                          </div>
                          {u.id !== user?.id && (
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="p-3 text-rose-300 bg-rose-50 rounded-xl"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl">
                          <select
                            disabled={u.id === user?.id}
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            className="flex-1 text-[10px] font-black uppercase tracking-widest border-none bg-transparent rounded-xl py-2 px-3 focus:ring-0 disabled:opacity-50 appearance-none"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <div className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest ${u.id === user?.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400'}`}>
                            {u.id === user?.id ? 'You' : u.role}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Mobile FAB */}
          {user?.role === 'admin' && activeTab === 'family' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform shadow-indigo-100"
            >
              <UserPlus size={28} />
            </button>
          )}

          {/* Modal for Adding User */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl p-10 max-w-md w-full relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-rose-500" />
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full transition-all"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-gray-900 mb-1">Add Family</h3>
                  <p className="text-gray-400 text-sm font-medium">Invite a member to your household.</p>
                </div>
                
                <form onSubmit={handleAddUser} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Name</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold shadow-sm"
                        placeholder="e.g. John Doe"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Email</label>
                      <input
                        required
                        type="email"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold shadow-sm"
                        placeholder="john@family.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Secret</label>
                        <input
                          required
                          type="password"
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold shadow-sm"
                          placeholder="••••••"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Role</label>
                        <select
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold appearance-none shadow-sm"
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4 uppercase tracking-[0.15em]"
                  >
                    Add Member
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {/* Toast Notification Container */}
          <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[70] flex flex-col space-y-2 pointer-events-none">
            <AnimatePresence>
              {msg.text && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  className={`p-5 rounded-[24px] flex items-center shadow-2xl pointer-events-auto border font-black text-xs uppercase tracking-widest min-w-[280px] ${
                    msg.type === 'error' ? 'bg-white text-rose-600 border-rose-50' : 'bg-indigo-600 text-white border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-xl mr-4 ${msg.type === 'error' ? 'bg-rose-50' : 'bg-white/20'}`}>
                    {msg.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                  </div>
                  <p>{msg.text}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
