import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, UserPlus, Heart, Sparkles } from "lucide-react";

export default function Auth() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-white md:bg-indigo-50/30">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[40px] shadow-none md:shadow-2xl md:shadow-indigo-100 overflow-hidden min-h-[auto] md:min-h-[700px]">
        {/* Left Side: Illustration & Text */}
        <div className="hidden lg:flex flex-col justify-center p-16 bg-indigo-600 text-white relative">
          <div className="absolute top-10 left-10 text-2xl font-black flex items-center tracking-tighter uppercase italic">
             <Heart className="mr-2 fill-white" /> Agnisfamily
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h1 className="text-6xl font-black leading-tight mb-6 uppercase tracking-tighter italic">
              The heart of <br />your home, <br />
              <span className="text-white opacity-40">organized.</span>
            </h1>
            <p className="text-lg text-indigo-100 font-medium leading-relaxed max-w-sm">
              A private digital sanctuary for household coordination, financial tracking, and shared memories.
            </p>
          </motion.div>

          <div className="flex gap-4">
            <div className="flex items-center bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/10">
              <Sparkles size={20} className="mr-3 text-indigo-300" />
              <p className="text-xs font-black uppercase tracking-widest text-indigo-50">Secure</p>
            </div>
            <div className="flex items-center bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/10">
              <Heart size={20} className="mr-3 text-indigo-300" />
              <p className="text-xs font-black uppercase tracking-widest text-indigo-50">Private</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-20 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-12">
              <div className="lg:hidden mb-12 flex items-center justify-center">
                <div className="p-4 bg-indigo-600 text-white rounded-[24px] shadow-xl shadow-indigo-100 italic font-black uppercase tracking-tighter flex items-center">
                   <LogIn size={20} className="mr-2" /> Agnisfamily
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-1 uppercase tracking-tighter">
                Portal
              </h2>
              <p className="text-gray-400 text-xs md:text-sm font-medium">
                Authorized family members only.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-300 mb-2 px-1">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold shadow-sm"
                  placeholder="name@family.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-300 mb-2 px-1">Security Key</label>
                <input
                  required
                  type="password"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-600 font-bold shadow-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 text-[10px] font-black p-4 rounded-2xl uppercase tracking-widest border border-rose-100 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white font-black py-5 rounded-[24px] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center mt-8 uppercase tracking-[0.2em] text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Access Sanctuary
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
