import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, Heart, Sparkles, Lock } from "lucide-react";

const BACKGROUND_PRESETS: { [key: string]: string } = {
  "cozy-aura": "bg-gradient-to-tr from-indigo-100 via-purple-50 to-rose-100",
  "sunset-minimal": "bg-gradient-to-tr from-amber-50 via-rose-50 to-indigo-100",
  "forest-calm": "bg-gradient-to-tr from-emerald-50 via-teal-50 to-indigo-150",
  "deep-nebula": "bg-gradient-to-tr from-gray-950 via-slate-900 to-indigo-950",
  "vibrant-energy": "bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500",
  "minimalist-ivory": "bg-[#f8fafc]",
};

export default function Auth() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBg] = useState<string>(() => localStorage.getItem("agnisfamily-bg") || "cozy-aura");
  
  const { login: setAuthData } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const { token, user } = await api.auth.login({
        email: formData.email,
        password: formData.password
      });
      setAuthData(token, user);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const bgClass = BACKGROUND_PRESETS[selectedBg] || BACKGROUND_PRESETS["cozy-aura"];
  const isDarkBg = selectedBg === "deep-nebula" || selectedBg === "vibrant-energy";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 md:p-8 transition-colors duration-1000 ${bgClass}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative max-w-md w-full bg-white/95 backdrop-blur-md rounded-[32px] md:rounded-[40px] px-8 py-12 md:p-14 border border-white/50 shadow-2xl shadow-indigo-950/5 flex flex-col justify-center overflow-hidden"
      >
        {/* Subtle Brand Accent Stripe */}
        <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-md flex items-center space-x-2">
            <Heart className="fill-indigo-600 text-indigo-600 animate-pulse" size={24} />
            <span className="font-sans text-xl font-black tracking-tight italic uppercase pr-1">Agnisfamily</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-1 uppercase tracking-tighter">
            Portal
          </h2>
          <p className="text-gray-400 text-xs md:text-sm font-semibold max-w-xs">
            Authorized family members only. Please enter your credentials to open the sanctuary door.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
              Email Address
            </label>
            <input
              required
              type="email"
              className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold shadow-inner transition-colors"
              placeholder="name@family.com"
              value={formData.email}
              disabled={isLoading}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
              Security Key
            </label>
            <input
              required
              type="password"
              className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold shadow-inner transition-colors"
              placeholder="••••••••"
              value={formData.password}
              disabled={isLoading}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50 text-rose-600 text-[10px] font-black p-4 rounded-2xl uppercase tracking-widest border border-rose-100 text-center flex items-center justify-center space-x-2"
              >
                <span>⚠️ {error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center mt-8 uppercase tracking-[0.2em] text-xs md:text-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="flex items-center space-x-2">
                <LogIn size={16} />
                <span>Access Sanctuary</span>
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center space-x-2 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          <Lock size={12} />
          <span>Secure AES 256 Environment</span>
        </div>
      </motion.div>
    </div>
  );
}
