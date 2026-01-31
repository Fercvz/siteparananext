"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js", { scope: "/" })
          .then((registration) => {
            console.log("✅ ServiceWorker registered:", registration.scope);
          })
          .catch((error) => {
            console.log("❌ ServiceWorker registration failed:", error);
          });
      });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      (window as Window & { deferredPrompt?: Event }).deferredPrompt = event;
      console.log("💡 PWA install prompt available");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
