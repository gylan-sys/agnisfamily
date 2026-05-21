import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "id" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    // Layout & Navigation
    "nav.dashboard": "Dasbor",
    "nav.budgets": "Anggaran",
    "nav.bills": "Tagihan",
    "nav.planning": "Rencana Keluarga",
    "nav.familyhub": "Family Hub",
    "nav.gallery": "Galeri Foto",
    "nav.ai_assistant": "Asisten AI",
    "nav.profile": "Profil Saya",
    "nav.settings": "Pengaturan",
    "nav.logout": "Keluar",
    "layout.household": "Manajemen Rumah Tangga",
    "layout.logged_in_as": "Masuk sebagai",

    // Settings General
    "settings.title": "Pengaturan",
    "settings.subtitle": "Atur konfigurasi ruang keluarga digital pribadi Anda.",
    "settings.tab.account": "Keamanan Akun",
    "settings.tab.preferences": "Preferensi",
    "settings.tab.family": "Manajemen Keluarga",

    // Settings Security
    "settings.security.title": "Keamanan Akun",
    "settings.security.subtitle": "Perbarui kata sandi Anda untuk menjaga keamanan ruang keluarga digital.",
    "settings.security.old_pass": "Kata Sandi Lama",
    "settings.security.new_pass": "Kata Sandi Baru",
    "settings.security.confirm_pass": "Konfirmasi Kata Sandi Baru",
    "settings.security.submit": "Perbarui Kata Sandi",

    // Settings Preferences
    "settings.pref.title": "Preferensi Aplikasi",
    "settings.pref.subtitle": "Sesuaikan tampilan dan nuansa estetika portal masuk ruang keluarga Anda.",
    "settings.pref.bg_title": "Latar Belakang Portal Masuk",
    "settings.pref.lang_title": "Bahasa Aplikasi (Language)",
    "settings.pref.lang_subtitle": "Pilih bahasa utama yang ingin Anda gunakan di seluruh aplikasi.",
    "settings.pref.toast_applied": "Bahasa Indonesia berhasil diterapkan!",
    
    // Settings Family Circle
    "settings.family.title": "Lingkar Keluarga",
    "settings.family.subtitle": "Kelola anggota keluarga dan tingkat akses mereka.",
    "settings.family.add": "Tambah Anggota",
    "settings.family.table.name": "Nama",
    "settings.family.table.account": "Akun",
    "settings.family.table.role": "Peran Hak Akses",
    "settings.family.table.actions": "Tindakan",
    "settings.family.modal.title": "Tambah Anggota Keluarga",
    "settings.family.modal.subtitle": "Undang anggota keluarga baru ke rumah tangga digital.",
    "settings.family.modal.submit": "Tambah Anggota",
  },
  en: {
    // Layout & Navigation
    "nav.dashboard": "Dashboard",
    "nav.budgets": "Budgets",
    "nav.bills": "Bills",
    "nav.planning": "Family Planning",
    "nav.familyhub": "Family Hub",
    "nav.gallery": "Gallery",
    "nav.ai_assistant": "AI Assistant",
    "nav.profile": "Profile",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
    "layout.household": "Household Management",
    "layout.logged_in_as": "Logged in as",

    // Settings General
    "settings.title": "Settings",
    "settings.subtitle": "Manage your private digital household space.",
    "settings.tab.account": "Account Security",
    "settings.tab.preferences": "Preferences",
    "settings.tab.family": "Family Management",

    // Settings Security
    "settings.security.title": "Account Security",
    "settings.security.subtitle": "Update your credentials to keep your family space secure.",
    "settings.security.old_pass": "Current Password",
    "settings.security.new_pass": "New Password",
    "settings.security.confirm_pass": "Confirm New Password",
    "settings.security.submit": "Update Credentials",

    // Settings Preferences
    "settings.pref.title": "App Preferences",
    "settings.pref.subtitle": "Customize the layout and aesthetic feel of your family workspace login portal.",
    "settings.pref.bg_title": "Login Portal Background",
    "settings.pref.lang_title": "Application Language",
    "settings.pref.lang_subtitle": "Select the primary language you want to use throughout the application.",
    "settings.pref.toast_applied": "English language successfully applied!",

    // Settings Family Circle
    "settings.family.title": "Family Circle",
    "settings.family.subtitle": "Manage members and their roles.",
    "settings.family.add": "Add Member",
    "settings.family.table.name": "Name",
    "settings.family.table.account": "Account",
    "settings.family.table.role": "Permission Role",
    "settings.family.table.actions": "Actions",
    "settings.family.modal.title": "Add Family",
    "settings.family.modal.subtitle": "Invite a member to your household.",
    "settings.family.modal.submit": "Add Member",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("agnisfamily-lang");
    return (saved === "en" || saved === "id") ? saved : "id"; // Default to Indonesian
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("agnisfamily-lang", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
