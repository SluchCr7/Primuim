"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { useAppSelector } from "../../../lib/store";
import { API_BASE_URL } from "@/redux/api";
import { useToast } from "../../components/Toast";
import { useTranslation } from "react-i18next";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const {t} = useTranslation();
  const { accessToken } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    try {
      setDownloading(true);
      showToast("Generating invoice PDF...", "info");

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/invoice`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Invoice downloaded successfully!", "success");
    } catch (err: any) {
      showToast("Could not retrieve PDF invoice.", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-16 flex items-center justify-center">
        <div className="w-full max-w-lg luxury-card p-8 text-center flex flex-col items-center gap-6 shadow-xl border-gold/30">
          <div className="rounded-full bg-success/10 p-5 text-success animate-bounce">
            <CheckCircle2 className="h-12 w-12" />
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-widest text-gold uppercase">{t("Order Confirmed")}</span>
            <h1 className="font-serif text-3xl font-bold mt-1">{t("Order Placed Successfully")}</h1>
            <p className="text-xs text-muted mt-2 max-w-sm mx-auto leading-relaxed">
              {t("Your order has been placed with cash on delivery. Payment is due when your order arrives.")}
            </p>
          </div>

          {orderId && (
            <div className="w-full bg-background p-4 rounded border border-card-border flex justify-between items-center text-xs">
              <span className="text-muted uppercase tracking-wider font-semibold">{t("Order ID")}</span>
              <span className="font-mono font-semibold text-gold">{orderId}</span>
            </div>
          )}

          <div className="w-full border-t border-card-border pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            {orderId && (
              <button
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded border border-gold hover:bg-gold/10 px-5 text-gold font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              >
                <FileText className="h-4 w-4" /> {downloading ? t("Downloading...") : t("Download PDF Invoice")}
              </button>
            )}
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded bg-foreground px-6 text-background hover:bg-gold hover:text-luxury-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              {t("Order Status")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

    </div>
  );
}
