import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  LayoutDashboard, 
  Wallet, 
  ReceiptText, 
  ListTodo, 
  MessagesSquare, 
  Images, 
  UserCircle,
  LogOut,
  Menu,
  X,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/budgets", label: "Budgets", icon: Wallet },
  { path: "/bills", label: "Bills", icon: ReceiptText },
  { path: "/planning", label: "Family Planning", icon: ListTodo },
  { path: "/family-hub", label: "Family Hub", icon: MessagesSquare },
  { path: "/gallery", label: "Gallery", icon: Images },
  { path: "/profile", label: "Profile", icon: UserCircle },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const getNavLabel = (path: string, defaultLabel: string) => {
    switch (path) {
      case "/": return t("nav.dashboard");
      case "/budgets": return t("nav.budgets");
      case "/bills": return t("nav.bills");
      case "/planning": return t("nav.planning");
      case "/family-hub": return t("nav.familyhub");
      case "/gallery": return t("nav.gallery");
      case "/profile": return t("nav.profile");
      case "/settings": return t("nav.settings");
      default: return defaultLabel;
    }
  };

  const getMobileLabel = (path: string, defaultLabel: string) => {
    switch (path) {
      case "/": return t("nav.dashboard");
      case "/budgets": return t("nav.budgets");
      case "/planning": return t("nav.planning");
      case "/family-hub": return t("nav.familyhub");
      case "/gallery": return t("nav.gallery");
      default: return defaultLabel;
    }
  };

  const mobileNavItems = [
    { path: "/", label: "Home", icon: LayoutDashboard },
    { path: "/budgets", label: "Money", icon: Wallet },
    { path: "/planning", label: "Plan", icon: ListTodo },
    { path: "/family-hub", label: "Chat", icon: MessagesSquare },
    { path: "/gallery", label: "Gallery", icon: Images },
  ];

  const currentPath = location.pathname;
  const activeNavItem = navItems.find(item => item.path === currentPath) || navItems[0];

  const bgStyle = user?.background_url ? {
    backgroundImage: `url(${user.background_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  } : {};

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-gray-900 font-sans" style={bgStyle}>
      {/* Background Overlay if image exists */}
      {user?.background_url && <div className="fixed inset-0 bg-white/80 backdrop-blur-sm -z-10" />}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/70 backdrop-blur-md border-r border-gray-200 sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">Agnisfamily</h1>
          <p className="text-xs text-gray-500 font-mono mt-1">{t("layout.household")}</p>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                  : "text-gray-600 hover:bg-white/50 hover:text-indigo-600"
                }`}
              >
                <Icon size={20} className="mr-3" />
                {getNavLabel(item.path, item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center px-4 py-3 bg-white/50 rounded-xl mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
              {user?.profile_url ? (
                <img src={user.profile_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0)
              )}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative pb-20 lg:pb-0">
        {/* Header - Mobile */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-indigo-100 italic">
              A
            </div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">{getNavLabel(activeNavItem.path, activeNavItem.label)}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/profile" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
              {user?.profile_url ? (
                <img src={user.profile_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={20} className="text-gray-400" />
              )}
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="p-2 text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation - Mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-2xl border-t border-gray-100 flex items-center justify-around px-2 z-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center w-16 h-full transition-all group"
              >
                <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
                  isActive ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 -translate-y-1" : "text-gray-400 group-hover:text-indigo-600"
                }`}>
                  <Icon size={isActive ? 22 : 24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold mt-1 transition-all ${
                  isActive ? "text-indigo-600 scale-110" : "text-gray-400 opacity-0 group-hover:opacity-100"
                }`}>
                  {getMobileLabel(item.path, item.label)}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="mobileActiveIndicator"
                    className="absolute -bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b">
                <h1 className="text-2xl font-bold text-indigo-600">Agnisfamily</h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-4 text-lg font-medium rounded-xl ${
                        isActive ? "bg-indigo-600 text-white shadow-lg" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon size={24} className="mr-4" />
                      {getNavLabel(item.path, item.label)}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-6 border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-4 text-lg font-medium text-red-600 bg-red-50 rounded-2xl"
                >
                  <LogOut size={24} className="mr-4" />
                  {t("nav.logout")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
