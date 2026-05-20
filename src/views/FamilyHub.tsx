import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { ChatMessage } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { Send, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

export default function FamilyHub() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async () => {
    try {
      const c = await api.chat.getAll();
      setMessages(c);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.chat.send(newMessage);
      setNewMessage("");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] lg:h-[700px] max-w-4xl mx-auto pb-4">
      {/* Dynamic Header - more compact on mobile */}
      <div className="flex items-center justify-between px-4 pb-4 md:pb-6">
        <div className="hidden md:block">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Family Hub</h2>
          <p className="text-gray-500 text-sm">Stay connected with your family anywhere.</p>
        </div>
      </div>

      <section className="flex-1 bg-white md:bg-white/80 md:backdrop-blur-sm rounded-[32px] md:rounded-[40px] border-0 md:border md:border-gray-100 shadow-none md:shadow-xl flex flex-col overflow-hidden">
        <div className="hidden md:flex p-6 border-b border-gray-100 items-center bg-gradient-to-r from-indigo-50/50 to-white">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl mr-4 shadow-sm shadow-indigo-100">
            <MessageCircle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Shared Conversation</h3>
            <p className="text-xs text-gray-500 font-medium">Private family chat room</p>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-2 md:p-8 space-y-4 md:space-y-6 custom-scrollbar bg-gray-50/10">
          {messages.map((m) => {
            const isOwn = m.user_id === user?.id;
            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={m.id} 
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[90%] md:max-w-[85%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0 mt-auto ${isOwn ? 'ml-2 md:ml-3' : 'mr-2 md:mr-3'} border-2 border-white shadow-sm`}>
                    {m.profile_url ? (
                      <img src={m.profile_url} alt={m.user_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] md:text-sm font-bold uppercase">
                        {m.user_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className={`p-3 md:p-5 rounded-2xl md:rounded-3xl ${isOwn ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'} shadow-md`}>
                    {!isOwn && <p className="text-[10px] font-black uppercase mb-1.5 text-indigo-500 tracking-widest font-sans">{m.user_name}</p>}
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{m.message}</p>
                    <p className={`text-[9px] mt-1.5 opacity-60 font-bold ${isOwn ? 'text-right text-indigo-100' : 'text-left text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Action Area */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2 md:gap-3">
            <input 
              type="text" 
              placeholder="Message your family..."
              className="flex-1 bg-gray-50 border border-gray-100 rounded-[20px] md:rounded-2xl py-3 px-5 md:py-4 md:px-6 focus:ring-2 focus:ring-indigo-500 shadow-inner transition-all text-sm font-medium"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="bg-indigo-600 text-white p-3 md:p-4 rounded-[20px] md:rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send size={22} className="md:w-6 md:h-6" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
