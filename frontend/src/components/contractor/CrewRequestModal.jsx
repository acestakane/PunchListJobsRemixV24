import React from "react";
import { X } from "lucide-react";

export function CrewRequestModal({ crew, message, onMessageChange, onSend, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[10] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6 relative" data-testid="crew-request-modal">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-extrabold text-[#050A30] dark:text-white text-xl mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
          Request {crew.name}
        </h2>
        <p className="text-slate-500 text-sm mb-4">
          {(crew.trade?.startsWith("__cat__:") ? crew.trade.replace("__cat__:", "") : crew.trade) || "General Labor"}
        </p>
        <textarea
          value={message}
          onChange={e => onMessageChange(e.target.value)}
          placeholder="Add a message (optional)... e.g. I need help with a framing job next week"
          rows={3}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0000FF] dark:bg-slate-800 dark:text-white mb-4"
          data-testid="crew-request-message"
        />
        <button onClick={onSend}
          className="w-full bg-[#0000FF] text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          data-testid="send-crew-request-btn">
          Send Request
        </button>
      </div>
    </div>
  );
}
