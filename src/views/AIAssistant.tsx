import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Send, Bot, Sparkles, AlertCircle, RefreshCw, Layers, Calculator, ListPlus, FlameKindling } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Simple and safe markdown parser that avoids importing custom libraries
function renderFormattedText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    let currentLine = line;
    
    // Bold parsing (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(currentLine)) !== null) {
      if (match.index > lastIndex) {
        parts.push(currentLine.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-extrabold text-indigo-700">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < currentLine.length) {
      parts.push(currentLine.substring(lastIndex));
    }

    const processedLine = parts.length > 0 ? parts : currentLine;

    // List item parsing
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      return (
        <li key={idx} className="ml-4 list-disc pl-1 py-1 text-sm md:text-base leading-relaxed text-gray-700">
          {parts.length > 0 ? processedLine : line.trim().substring(2)}
        </li>
      );
    }

    if (line.trim().startsWith("### ")) {
      return (
        <h4 key={idx} className="text-base md:text-lg font-black text-indigo-900 mt-4 mb-2 tracking-tight uppercase">
          {line.trim().substring(4)}
        </h4>
      );
    }

    if (line.trim().startsWith("## ")) {
      return (
        <h3 key={idx} className="text-lg md:text-xl font-black text-gray-900 mt-6 mb-3 border-b border-indigo-50 pb-1 tracking-tight">
          {line.trim().substring(3)}
        </h3>
      );
    }

    if (line.trim().startsWith("# ")) {
      return (
        <h2 key={idx} className="text-xl md:text-2xl font-black text-gray-900 mt-8 mb-4 tracking-tighter uppercase italic">
          {line.trim().substring(2)}
        </h2>
      );
    }

    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }

    return (
      <p key={idx} className="text-sm md:text-base text-gray-700 leading-relaxed py-1">
        {processedLine}
      </p>
    );
  });
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello ${user?.name || "there"}! 👋\n\nI am your private **Family AI Companion**.\n\nI have complete, secure access to your household's digital hub including **Transactions**, **Budgets**, **Bills**, **Tasks**, and **Groceries**.\n\nYou can ask me complex analytical questions or task me with suggestions like:\n- Are we exceeding any of our budgets?\n- Suggest some recipe ideas based on our grocery list!\n- Summarize all pending tasks and who they are assigned to.\n- Which bills are unpaid and when are they due?`,
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const finalMsg = textToSend || inputMsg;
    if (!finalMsg.trim() || isLoading) return;

    const updatedHistory: Message[] = [...messages, { role: "user", content: finalMsg }];
    setMessages(updatedHistory);
    if (!textToSend) setInputMsg("");
    setIsLoading(true);

    try {
      const response = await api.ai.chat(updatedHistory);
      setMessages([...updatedHistory, { role: "assistant", content: response.text }]);
    } catch (err: any) {
      setMessages([
        ...updatedHistory,
        {
          role: "assistant",
          content: `⚠️ **Error connecting to AI Advisor.**\n\n${err.message || "Please make sure your GEMINI_API_KEY is configured in your Secrets settings panels."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    { label: "Budget Audit", prompt: "Are we exceeding any of our family budget limits right now?", icon: Calculator },
    { label: "Recipe Ideas", prompt: "Look at our grocery list and suggest 2 recipe ideas we can cook with them", icon: FlameKindling },
    { label: "Tasks Summary", prompt: "Who has the most household tasks assigned to them? Give a neat list of pending chores", icon: ListPlus },
    { label: "Unpaid Liabilities", prompt: "Show me all unpaid bills and their exact deadline/amount details in a table structure", icon: Layers },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] lg:h-[700px] max-w-4xl mx-auto pb-4">
      {/* Header section */}
      <div className="flex items-center justify-between px-4 pb-4 md:pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none flex items-center">
            <Sparkles className="mr-2 text-indigo-600 animate-pulse" size={28} />
            AI Assistant
          </h2>
          <p className="text-gray-400 mt-1 text-xs md:text-sm font-medium">Smart companion keeping your digital household organized.</p>
        </div>
      </div>

      {/* Main chat box container */}
      <section className="flex-1 bg-white md:bg-white/80 md:backdrop-blur-sm rounded-[32px] md:rounded-[40px] border-0 md:border md:border-gray-100 shadow-none md:shadow-xl flex flex-col overflow-hidden">
        {/* Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:p-8 space-y-4 md:space-y-6 custom-scrollbar bg-gray-50/15">
          {messages.map((m, idx) => {
            const isOwn = m.role === "user";
            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                key={idx}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[90%] md:max-w-[85%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 mt-auto ${isOwn ? "ml-2 md:ml-3" : "mr-2 md:mr-3"} border-2 border-white shadow-sm flex items-center justify-center`}>
                    {isOwn ? (
                      <div className="w-full h-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] md:text-xs font-black uppercase">
                        {user?.name.charAt(0)}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-indigo-600 text-white flex items-center justify-center">
                        <Bot size={18} />
                      </div>
                    )}
                  </div>
                  <div className={`p-4 md:p-6 rounded-2xl md:rounded-[28px] ${
                    isOwn 
                      ? "bg-indigo-600 text-white rounded-br-none shadow-indigo-100" 
                      : "bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100"
                    } shadow-md`}
                  >
                    {!isOwn && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 font-sans">Agnisfamily Advisor</span>
                        <Sparkles size={10} className="text-indigo-400" />
                      </div>
                    )}
                    <div className="space-y-1">
                      {isOwn ? <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p> : renderFormattedText(m.content)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-3 bg-white border border-gray-100 p-4 rounded-3xl shadow-sm text-gray-400 text-xs font-semibold">
                <RefreshCw size={14} className="animate-spin text-indigo-600" />
                <span>AI is compiling household database context...</span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Action and Prompt suggestions */}
        <div className="p-4 md:p-6 border-t border-gray-100 bg-white space-y-4">
          {/* Sample prompts */}
          {messages.length === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {samplePrompts.map((sp, idx) => {
                const Icon = sp.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(sp.prompt)}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-left hover:border-indigo-200 hover:bg-indigo-50/10 transition-all text-xs font-bold text-gray-600 flex flex-col justify-between h-24 shadow-sm"
                  >
                    <div className="p-2 bg-white rounded-xl text-indigo-600 border border-gray-50 max-w-max">
                      <Icon size={16} />
                    </div>
                    <span className="mt-2 line-clamp-2">{sp.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Chat form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 md:gap-3"
          >
            <input
              type="text"
              placeholder="Ask me anything about your household..."
              className="flex-1 bg-gray-50 border border-gray-100 rounded-[20px] md:rounded-2xl py-3.5 px-5 md:py-4 md:px-6 focus:ring-2 focus:ring-indigo-500 shadow-inner transition-all text-sm font-medium"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || isLoading}
              className="bg-indigo-600 text-white p-3.5 md:p-4 rounded-[20px] md:rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send size={22} className="md:w-6 md:h-6" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
