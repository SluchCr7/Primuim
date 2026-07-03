"use client";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function LanguageWrapper({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.className = lang === 'ar' ? 'font-arabic' : 'font-sans';
  }, [lang]);

  return <>{children}</>;
}