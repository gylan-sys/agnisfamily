import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Save, User as UserIcon, Palette, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    background_url: "",
    profile_url: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        background_url: user.background_url || "",
        profile_url: user.profile_url || ""
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    try {
      await api.auth.updateProfile(formData);
      await refreshUser();
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(err);
    } finally {
      setIsSaving(false);
    }
  };

  const presetBackgrounds = [
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1920"
  ];

  return (
    <div className="pb-24 lg:pb-0 max-w-2xl mx-auto space-y-6 md:space-y-10">
      <header className="px-2">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 leading-none">Identity</h2>
        <p className="text-gray-400 mt-1 text-xs md:text-sm font-medium">Personalize your family presence.</p>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white md:bg-white/80 md:backdrop-blur-sm p-6 md:p-12 rounded-[40px] border-0 md:border md:border-gray-100 shadow-none md:shadow-2xl"
      >
        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col items-center">
             <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] bg-indigo-50 flex items-center justify-center text-indigo-600 overflow-hidden shadow-2xl border-4 border-white active:scale-95 transition-transform">
                  {formData.profile_url ? (
                    <img src={formData.profile_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <UserIcon size={48} className="opacity-20" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-2xl shadow-xl">
                  <Palette size={20} />
                </div>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mt-6 text-center max-w-[200px]">IDENTIFIER VISIBLE TO ALL FAMILY MEMBERS</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Display Name</label>
              <input
                required
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-indigo-600 font-bold shadow-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Avatar Source URL</label>
              <input
                type="url"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-indigo-600 font-bold shadow-sm text-xs"
                placeholder="https://..."
                value={formData.profile_url}
                onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              />
            </div>

            <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Global Background</label>
               <input
                 type="url"
                 className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-indigo-600 font-bold shadow-sm text-xs"
                 placeholder="Dashboard wallpaper URL..."
                 value={formData.background_url}
                 onChange={(e) => setFormData({ ...formData, background_url: e.target.value })}
               />
               <div className="mt-4 grid grid-cols-4 gap-3">
                 {presetBackgrounds.map((bg, idx) => (
                   <button
                     key={idx}
                     type="button"
                     onClick={() => setFormData({ ...formData, background_url: bg })}
                     className={`h-12 rounded-[14px] overflow-hidden border-2 transition-all ${formData.background_url === bg ? 'border-indigo-600 scale-110 shadow-lg' : 'border-white shadow-sm hover:scale-105'}`}
                   >
                     <img src={bg} className="w-full h-full object-cover" />
                   </button>
                 ))}
               </div>
            </div>
          </div>

          <AnimatePresence>
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl text-center shadow-xl shadow-indigo-100"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className={`hidden md:flex w-full items-center justify-center font-black py-5 rounded-[24px] uppercase tracking-[0.2em] transition-all shadow-2xl ${
              isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            <Save size={20} className="mr-3" />
            {isSaving ? "Synchronizing..." : "Save Identity"}
          </button>
        </form>
      </motion.div>

      {/* Mobile Sticky Save Action */}
      <div className="md:hidden fixed bottom-24 left-0 right-0 px-6 z-40 pointer-events-none">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full pointer-events-auto flex items-center justify-center font-black py-5 rounded-[24px] uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-90 ${
            isSaving ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 text-white shadow-indigo-100'
          }`}
        >
          <Save size={20} className="mr-3" />
          {isSaving ? "..." : "Commit"}
        </button>
      </div>
    </div>
  );
}
