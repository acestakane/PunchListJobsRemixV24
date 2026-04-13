import React, { useState, useEffect } from "react";
import { X, Smartphone, Share } from "lucide-react";

const DISMISS_KEY = "plj_pwa_dismissed";

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner]         = useState(false);
  const [showIOSTip, setShowIOSTip]         = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isInStandaloneMode()) return;
    // Don't show if recently dismissed
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    if (isIOS()) {
      // Safari on iOS doesn't fire beforeinstallprompt
      setShowIOSTip(true);
      setShowBanner(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShowBanner(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div
      data-testid="pwa-install-banner"
      className="fixed bottom-20 left-3 right-3 z-[999] sm:left-auto sm:right-4 sm:bottom-4 sm:w-[340px]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="bg-[#0F172A] border border-blue-800/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top accent stripe */}
        <div className="h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-blue-900/60 border border-blue-700/50 flex items-center justify-center flex-shrink-0">
              <img src="/icon-192.svg" alt="PunchListJobs" className="w-8 h-8" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">
                Save Jobs to Your Phone
              </p>
              <p className="text-slate-400 text-xs mt-0.5 leading-snug">
                {showIOSTip
                  ? "Tap Share then \"Add to Home Screen\" for quick access"
                  : "Get instant access to jobs — no app store needed"}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={dismiss}
              data-testid="pwa-dismiss-btn"
              className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {showIOSTip ? (
              <div className="flex items-center gap-2 bg-blue-900/40 border border-blue-700/40 rounded-xl px-3 py-2 flex-1">
                <Share size={14} className="text-sky-400 flex-shrink-0" />
                <span className="text-sky-300 text-xs font-medium">
                  Share icon → Add to Home Screen
                </span>
              </div>
            ) : (
              <>
                <button
                  onClick={install}
                  data-testid="pwa-install-btn"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors active:scale-95"
                >
                  <Smartphone size={14} />
                  Add to Home Screen
                </button>
                <button
                  onClick={dismiss}
                  data-testid="pwa-nothanks-btn"
                  className="text-slate-400 hover:text-slate-200 text-xs font-medium px-3 transition-colors"
                >
                  Not now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
