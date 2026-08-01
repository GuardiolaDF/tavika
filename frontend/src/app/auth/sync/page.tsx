"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AuthSyncPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      window.location.href = "/";
      return;
    }

    fetch("/backend/auth/exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code })
    })
      .then(res => {
        if (!res.ok) throw new Error("Exchange failed");
        return res.json();
      })
      .then(data => {
        if (data.is_admin) {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      })
      .catch(() => {
        window.location.href = "/";
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald/30 border-t-emerald animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Sincronizando sesión segura...</p>
      </div>
    </div>
  );
}

