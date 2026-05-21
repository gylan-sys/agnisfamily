import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { ChatMessage } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { Send, MessageCircle, Smile, Plus, Trash2, Sparkles, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const CUTE_STICKERS: any[] = [
  { id: "kucing-gemoy", emoji: "🐱", text: "Kucing Gemoy", anim: { y: [0, -10, 0] }, transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" }, bg: "bg-rose-50 border-rose-200 text-rose-700" },
  { id: "bebek-heboh", emoji: "🦆", text: "Bebek Heboh", anim: { scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }, transition: { repeat: Infinity, duration: 1.4, ease: "easeInOut" }, bg: "bg-yellow-50 border-yellow-250 text-yellow-750" },
  { id: "panda-bobo", emoji: "🐼", text: "Bobo Dulu", anim: { opacity: [0.6, 1, 0.6] }, transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }, bg: "bg-slate-50 border-slate-200 text-slate-700" },
  { id: "kelinci-ceria", emoji: "🐰", text: "Lompat-Lompat", anim: { y: [0, -15, 0], scaleY: [1, 0.85, 1.1, 1] }, transition: { repeat: Infinity, duration: 1, ease: "easeInOut" }, bg: "bg-purple-50 border-purple-200 text-purple-700" },
  { id: "love-you", emoji: "🫶", text: "Luv U Pool!", anim: { scale: [1, 1.2, 1] }, transition: { repeat: Infinity, duration: 0.9 }, bg: "bg-pink-50 border-pink-200 text-pink-750" },
  { id: "otw-jalan", emoji: "🚗", text: "OTW Bebs!", anim: { x: [-3, 3, -3] }, transition: { repeat: Infinity, duration: 0.5 }, bg: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: "makan-kenyang", emoji: "🍕", text: "Kenyang Pol", anim: { rotate: [0, 4, -4, 0] }, transition: { repeat: Infinity, duration: 1.6 }, bg: "bg-orange-50 border-orange-200 text-orange-700" },
  { id: "semangat-dino", emoji: "🦖", text: "Raaawr!", anim: { rotateY: [0, 180, 0] }, transition: { repeat: Infinity, duration: 2.2 }, bg: "bg-emerald-50 border-emerald-200 text-emerald-750" },
  { id: "cap-jempol", emoji: "👍", text: "Mantappu", anim: { scale: [1, 1.25, 1] }, transition: { repeat: Infinity, duration: 1.1 }, bg: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  { id: "pesta-hore", emoji: "🥳", text: "Horeee!", anim: { rotate: [0, -10, 10, 0], y: [0, -6, 0] }, transition: { repeat: Infinity, duration: 1.3 }, bg: "bg-amber-50 border-amber-200 text-amber-750" },
];

const PRESET_EMOJIS = ["😀", "😂", "🥰", "😍", "😘", "😜", "😎", "🥳", "😭", "😤", "👍", "👏", "🙌", "🔥", "💖", "🎉", "💤", "🍕", "🎈", "✨", "🍿", "🍔", "🚗", "🌸"];

const CUSTOM_STICKER_THEMES: { [key: string]: { bg: string; name: string } } = {
  rose: { bg: "bg-rose-50 border-rose-200 text-rose-700", name: "Aura Pink" },
  sunshine: { bg: "bg-yellow-50 border-yellow-250 text-yellow-750", name: "Sunlight" },
  mint: { bg: "bg-emerald-50 border-emerald-250 text-emerald-750", name: "Sage Mint" },
  galaxy: { bg: "bg-indigo-950 border-indigo-800 text-indigo-300 font-bold", name: "Galaxy Dark" },
  sky: { bg: "bg-sky-50 border-sky-200 text-sky-700", name: "Cozy Sky" },
  lavender: { bg: "bg-purple-50 border-purple-200 text-purple-750", name: "Lavender" }
};

const SUGGESTED_EMOJIS = ["🐱", "🦊", "🐼", "🦄", "🐶", "🦖", "🐧", "👻", "👾", "💩", "🤡", "💖", "🔥", "🍕", "🍔", "🍺", "☕", "🎉"];

export default function FamilyHub() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<"stickers" | "emojis" | "custom">("stickers");
  
  // Custom sticker composition state
  const [customText, setCustomText] = useState("");
  const [customEmoji, setCustomEmoji] = useState("🦊");
  const [customTheme, setCustomTheme] = useState("rose");
  const [savedCustomStickers, setSavedCustomStickers] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("agnisfamily-custom-stickers") || "[]");
    } catch {
      return [];
    }
  });

  // Screen particles for Emoji Rain / Storm
  const [particles, setParticles] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const triggeredRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle detection of new messages for visual element trigger
  useEffect(() => {
    if (messages.length > 0) {
      const latestMsg = messages[messages.length - 1];
      if (!triggeredRef.current.has(latestMsg.id)) {
        triggeredRef.current.add(latestMsg.id);
        const ageInMs = Date.now() - new Date(latestMsg.created_at).getTime();
        // Only trigger if message is received within the last 15 seconds to prevent spam or old load triggers
        if (ageInMs < 15000) {
          checkMessageForRain(latestMsg.message);
        }
      }
    }
  }, [messages]);

  const triggerEmojiRain = (emojis: string[]) => {
    const list = Array.from({ length: 16 }).map((_, i) => ({
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * 80 + 10, // vertical track percentage
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2,
      scale: 0.8 + Math.random() * 0.8,
      id: Math.random() + i
    }));
    setParticles(list);
    setTimeout(() => {
      setParticles([]);
    }, 4500);
  };

  const checkMessageForRain = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("hore") || lower.includes("pesta") || lower.includes("mantap") || lower.includes("congrats") || lower.includes("selamat") || lower.includes("yatta")) {
      triggerEmojiRain(["🎉", "🎈", "🥳", "✨", "🍿"]);
    } else if (lower.includes("love") || lower.includes("sayang") || lower.includes("love you") || lower.includes("muach") || lower.includes("cinta") || lower.includes("🫶")) {
      triggerEmojiRain(["❤️", "💖", "🥰", "🫶", "💘", "🌹"]);
    } else if (lower.includes("makan") || lower.includes("lapar") || lower.includes("kenyang") || lower.includes("pizza") || lower.includes("bakso") || lower.includes("indomie") || lower.includes("cafe")) {
      triggerEmojiRain(["🍕", "🍟", "🍔", "☕", "🍜", "🍩"]);
    } else if (lower.includes("wkwk") || lower.includes("lucu") || lower.includes("gemas") || lower.includes("xixixi") || lower.includes("gokil") || lower.includes("haha") || lower.includes("hehee")) {
      triggerEmojiRain(["😂", "🤣", "😜", "😻", "👻", "😹"]);
    } else if (lower.includes("semangat") || lower.includes("gas") || lower.includes("gass") || lower.includes("dino") || lower.includes("rawr") || lower.includes("api") || lower.includes("go")) {
      triggerEmojiRain(["🦖", "🔥", "🚀", "💪", "⚡", "🌟"]);
    }
  };

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

  const handleSendSticker = async (stickerId: string) => {
    try {
      await api.chat.send(`[sticker:${stickerId}]`);
      setShowStickerPicker(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAndSendCustomSticker = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalEmoji = customEmoji.trim() || "🦊";
    const finalText = customText.trim() || "Mager Pol!";
    const format = `[custom_sticker:${finalEmoji}:${finalText}:${customTheme}]`;
    
    try {
      // 1. Send as message
      await api.chat.send(format);
      
      // 2. Save inside local list to avoid making it repeatedly
      const newSticker = { emoji: finalEmoji, text: finalText, theme: customTheme, id: Date.now().toString() };
      const updatedList = [newSticker, ...savedCustomStickers.filter(s => s.text !== finalText || s.emoji !== finalEmoji)].slice(0, 8); // cache top 8
      setSavedCustomStickers(updatedList);
      localStorage.setItem("agnisfamily-custom-stickers", JSON.stringify(updatedList));

      // Reset state & close
      setCustomText("");
      setShowStickerPicker(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletedCustomSticker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtrated = savedCustomStickers.filter(item => item.id !== id);
    setSavedCustomStickers(filtrated);
    localStorage.setItem("agnisfamily-custom-stickers", JSON.stringify(filtrated));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] lg:h-[700px] max-w-4xl mx-auto pb-4 relative">
      
      {/* Floating Emoji Particles Layer (Fun Event Rain!) */}
      <div className="absolute inset-x-0 top-0 bottom-24 overflow-hidden pointer-events-none z-40">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ y: "110%", x: `${p.x}%`, opacity: 0, scale: 0.1 }}
              animate={{
                y: "-15%",
                x: `${p.x + (Math.random() * 20 - 10)}%`,
                opacity: [0, 1, 1, 0],
                scale: [0.1, p.scale]
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "linear"
              }}
              style={{ position: "absolute", bottom: 0 }}
              className="text-4xl md:text-5xl select-none"
            >
              {p.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Dynamic Header */}
      <div className="flex items-center justify-between px-4 pb-4 md:pb-6">
        <div className="hidden md:block">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Family Hub</h2>
          <p className="text-gray-500 text-sm">Stay connected with your family anywhere.</p>
        </div>
      </div>

      <section className="flex-1 bg-white md:bg-white/80 md:backdrop-blur-sm rounded-[32px] md:rounded-[40px] border-0 md:border md:border-gray-100 shadow-none md:shadow-xl flex flex-col overflow-hidden relative">
        <div className="hidden md:flex p-6 border-b border-gray-100 items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl mr-4 shadow-sm shadow-indigo-100">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 font-sans">Shared Conversation</h3>
              <p className="text-xs text-gray-500 font-medium">Private family chat room</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-1">
              <Sparkles size={11} className="animate-spin" /> Emoji Storm Activated
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-2 md:p-8 space-y-4 md:space-y-6 custom-scrollbar bg-gray-50/10">
          {messages.map((m) => {
            const isOwn = m.user_id === user?.id;
            
            // Check for standard pre-defined sticker
            const stickerMatch = m.message.match(/^\[sticker:(.+)\]$/);
            const stickerId = stickerMatch ? stickerMatch[1] : null;
            let sticker = stickerId ? CUTE_STICKERS.find(s => s.id === stickerId) : null;

            // Check for Homemade Custom Sticker
            const customStickerMatch = m.message.match(/^\[custom_sticker:(.+):(.+):(.+)\]$/);
            let isCustomSticker = false;
            let customStickerData: any = null;

            if (customStickerMatch) {
              isCustomSticker = true;
              const emojiPart = customStickerMatch[1];
              const textPart = customStickerMatch[2];
              const themeKey = customStickerMatch[3];
              const themeConfig = CUSTOM_STICKER_THEMES[themeKey] || CUSTOM_STICKER_THEMES.rose;
              customStickerData = {
                emoji: emojiPart,
                text: textPart,
                bg: themeConfig.bg
              };
            }

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
                  
                  {sticker ? (
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      {!isOwn && <p className="text-[10px] font-black uppercase mb-1.5 text-indigo-500 tracking-widest font-sans px-1">{m.user_name}</p>}
                      <motion.div 
                        whileHover={{ scale: 1.15, rotate: [0, -4, 4, 0] }}
                        className={`p-4 rounded-3xl flex flex-col items-center justify-center min-w-[130px] border-2 border-dashed ${sticker.bg} hover:shadow-lg transition-transform duration-300 pointer-events-auto cursor-pointer bg-opacity-75`}
                      >
                        <motion.span 
                          animate={sticker.anim}
                          transition={sticker.transition}
                          className="text-5xl md:text-6xl block mb-2 pointer-events-none select-none"
                        >
                          {sticker.emoji}
                        </motion.span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-center pointer-events-none select-none">{sticker.text}</span>
                      </motion.div>
                      <p className={`text-[9px] mt-1.5 opacity-65 font-bold text-gray-400 px-1`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ) : isCustomSticker && customStickerData ? (
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      {!isOwn && <p className="text-[10px] font-black uppercase mb-1.5 text-indigo-500 tracking-widest font-sans px-1">{m.user_name}</p>}
                      <motion.div 
                        whileHover={{ scale: 1.15, rotate: [0, 4, -4, 0] }}
                        className={`p-4 rounded-3xl flex flex-col items-center justify-center min-w-[130px] border-2 border-solid shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${customStickerData.bg}`}
                      >
                        <motion.span 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="text-5xl md:text-6xl block mb-2 select-none"
                        >
                          {customStickerData.emoji}
                        </motion.span>
                        <span className="text-[11px] font-black uppercase tracking-tight text-center select-none breakdown-words max-w-[110px]">
                          {customStickerData.text}
                        </span>
                      </motion.div>
                      <p className={`text-[9px] mt-1.5 opacity-65 font-bold text-gray-400 px-1`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ) : (
                    <div className={`p-3 md:p-5 rounded-2xl md:rounded-3xl ${isOwn ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'} shadow-md`}>
                      {!isOwn && <p className="text-[10px] font-black uppercase mb-1.5 text-indigo-500 tracking-widest font-sans">{m.user_name}</p>}
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{m.message}</p>
                      <p className={`text-[9px] mt-1.5 opacity-60 font-bold ${isOwn ? 'text-right text-indigo-100' : 'text-left text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Action Area with expandable interactive Picker */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100 relative">
          
          <AnimatePresence>
            {showStickerPicker && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-22 left-4 right-4 md:right-auto md:left-4 md:w-[410px] bg-white border border-gray-150 rounded-[32px] shadow-2xl z-50 overflow-hidden flex flex-col h-[420px]"
              >
                {/* Header of Picker */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                    <button
                      type="button"
                      onClick={() => setPickerTab("stickers")}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors flex-shrink-0 ${
                        pickerTab === "stickers" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-900 bg-gray-100"
                      }`}
                    >
                      Pre-set Stickers 🎉
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerTab("emojis")}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors flex-shrink-0 ${
                        pickerTab === "emojis" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-900 bg-gray-100"
                      }`}
                    >
                      Emojis ✨
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerTab("custom")}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors flex-shrink-0 flex items-center gap-1 ${
                        pickerTab === "custom" ? "bg-indigo-600 text-white" : "text-rose-600 hover:text-rose-700 bg-rose-50"
                      }`}
                    >
                      <Wand2 size={11} className="animate-pulse" /> Custom Sticker! 🎨
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStickerPicker(false)}
                    className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full flex-shrink-0 ml-2"
                  >
                    Close
                  </button>
                </div>

                {/* Content Area */}
                <div className="overflow-y-auto custom-scrollbar flex-1 bg-white">
                  {pickerTab === "stickers" ? (
                    <div className="p-4 grid grid-cols-2 gap-3 bg-[#fbfbfe]">
                      {CUTE_STICKERS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSendSticker(s.id)}
                          className={`p-3 rounded-2xl border border-dashed flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 ${s.bg}`}
                        >
                          <span className="text-3.5xl mb-1.5 select-none">{s.emoji}</span>
                          <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-full text-center select-none">
                            {s.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : pickerTab === "emojis" ? (
                    <div className="p-4 grid grid-cols-6 gap-3 bg-[#fbfbfe]">
                      {PRESET_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setNewMessage((prev) => prev + emoji);
                          }}
                          className="text-2xl p-2 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center active:scale-90 bg-white border border-gray-100"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : (
                    // Super Cute Live Sticker Maker Wizard
                    <div className="p-5 space-y-6">
                      <div className="bg-rose-50/40 p-3 rounded-2xl border border-rose-100 flex items-center gap-2">
                        <span className="text-xs font-medium text-rose-700 leading-tight">
                          ✨ <strong>Bikin Sendiri!</strong> Tulis pesan singkatmu, pasangkan emoji menggemaskan, dan hiasi warnanya!
                        </span>
                      </div>

                      {/* Composer Grid */}
                      <div className="grid grid-cols-12 gap-4">
                        {/* Live Preview Area */}
                        <div className="col-span-5 flex flex-col items-center justify-center">
                          <p className="text-[9px] font-black uppercase text-gray-400 mb-2 tracking-widest text-center">Live Preview</p>
                          <motion.div 
                            animate={{ y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className={`p-3.5 rounded-3xl border-2 border-solid flex flex-col items-center justify-center min-w-[110px] shadow-sm max-w-[130px] ${
                              CUSTOM_STICKER_THEMES[customTheme]?.bg || CUSTOM_STICKER_THEMES.rose.bg
                            }`}
                          >
                            <span className="text-4xl mb-1 select-none">{customEmoji || "🐥"}</span>
                            <span className="text-[9px] font-black uppercase tracking-tight text-center select-none break-all max-w-full">
                              {customText.trim() || "Tulis Kata!"}
                            </span>
                          </motion.div>
                        </div>

                        {/* Input Options area */}
                        <div className="col-span-7 space-y-3">
                          <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                              Custom Text (Max 14 chars)
                            </label>
                            <input
                              type="text"
                              maxLength={14}
                              placeholder="e.g., Mager Poll!"
                              value={customText}
                              onChange={(e) => setCustomText(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-150 rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                              Emoji Icon
                            </label>
                            <div className="flex gap-1.5 items-center">
                              <input
                                type="text"
                                maxLength={2}
                                value={customEmoji}
                                onChange={(e) => setCustomEmoji(e.target.value)}
                                className="w-10 bg-gray-50 border border-gray-150 rounded-xl py-1.5 px-1 text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500 flex-shrink-0"
                              />
                              <div className="flex-1 overflow-x-auto py-1 flex gap-1 no-scrollbar bg-gray-50 p-1 rounded-xl">
                                {SUGGESTED_EMOJIS.map((se) => (
                                  <button
                                    key={se}
                                    type="button"
                                    onClick={() => setCustomEmoji(se)}
                                    className={`text-sm p-1 rounded hover:bg-white flex-shrink-0 transition-all ${
                                      customEmoji === se ? "scale-125 bg-white border border-gray-100" : ""
                                    }`}
                                  >
                                    {se}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Theme Colors selector */}
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
                          Pilih Tema Warna
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(CUSTOM_STICKER_THEMES).map(([key, t]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setCustomTheme(key)}
                              className={`py-1.5 px-3 rounded-xl border text-[10px] font-bold transition-all text-center ${
                                customTheme === key 
                                  ? "border-indigo-600 bg-indigo-500 text-white shadow-sm" 
                                  : "border-gray-150 bg-gray-50 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Submit action */}
                      <button
                        type="button"
                        onClick={() => handleCreateAndSendCustomSticker()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-150 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus size={14} /> Kirim Sticker Buatan Sendiri! 🦄
                      </button>

                      {/* Saved collection */}
                      {savedCustomStickers.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            Koleksimu (Klik untuk kirim ulang):
                          </label>
                          <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                            {savedCustomStickers.map((sticker) => {
                              const themeVal = CUSTOM_STICKER_THEMES[sticker.theme] || CUSTOM_STICKER_THEMES.rose;
                              return (
                                <div
                                  key={sticker.id}
                                  onClick={() => {
                                    setCustomEmoji(sticker.emoji);
                                    setCustomText(sticker.text);
                                    setCustomTheme(sticker.theme);
                                    setPickerTab("custom");
                                    api.chat.send(`[custom_sticker:${sticker.emoji}:${sticker.text}:${sticker.theme}]`).then(() => {
                                      setShowStickerPicker(false);
                                      loadData();
                                    });
                                  }}
                                  className={`p-2.5 rounded-xl border border-solid flex items-center justify-between cursor-pointer hover:shadow-md transition-all group ${themeVal.bg}`}
                                >
                                  <div className="flex items-center gap-2 truncate pr-1">
                                    <span className="text-xl select-none">{sticker.emoji}</span>
                                    <span className="text-[10px] font-black uppercase tracking-tight truncate leading-none">
                                      {sticker.text}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeletedCustomSticker(sticker.id, e)}
                                    className="p-1 rounded-md text-red-500 hover:bg-red-50/80 transition-colors opacity-10 md:opacity-0 group-hover:opacity-100 self-center"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSend} className="flex gap-2 md:gap-3 items-center">
            {/* Sticker Toggler */}
            <button
              type="button"
              onClick={() => {
                setShowStickerPicker(!showStickerPicker);
                setPickerTab("stickers");
              }}
              className={`p-3 rounded-[20px] md:rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${
                showStickerPicker ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-gray-50 border-gray-100 text-gray-500 hover:text-indigo-600"
              }`}
            >
              <Smile size={22} className="md:w-6 md:h-6" />
            </button>

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

