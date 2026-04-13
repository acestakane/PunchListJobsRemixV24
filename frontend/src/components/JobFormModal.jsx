import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import TradeSelect from "./TradeSelect";
import { MapPin, AlertTriangle, Eye, X } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const normalizeTrade = (trade) =>
  trade?.startsWith("__cat__:") ? trade.replace("__cat__:", "") : trade;

/**
 * JobFormModal — full job creation form.
 * Address suggestions are managed internally.
 * Tasks and images are managed internally and passed to onSubmit.
 */
export default function JobFormModal({ show, onClose, onSubmit, copyEditMode, jobForm, onChange, grouped, user, onPreview }) {
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [fetchingAddressSuggestions, setFetchingAddressSuggestions] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [jobImages, setJobImages] = useState([]);
  const addressDebounceRef = useRef(null);
  const addressSuggestionsRef = useRef(null);

  const fetchAddressSuggestions = useCallback(async (q) => {
    if (!q || q.length < 3) { setAddressSuggestions([]); setShowAddressSuggestions(false); return; }
    setFetchingAddressSuggestions(true);
    try {
      const res = await axios.get(`${API}/utils/address/search`, { params: { q, limit: 5 } });
      setAddressSuggestions(res.data.results || []);
      setShowAddressSuggestions(true);
    } catch { setAddressSuggestions([]); }
    finally { setFetchingAddressSuggestions(false); }
  }, []);

  const handleAddressChange = (val) => {
    onChange("address", val);
    clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(() => fetchAddressSuggestions(val), 380);
  };

  const selectSuggestion = (s) => {
    onChange("address", s.full_address);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  const handleClose = () => {
    setTaskInput("");
    setJobImages([]);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    onClose();
  };

  const addTask = () => {
    if (taskInput.trim()) {
      onChange("tasks", [...(jobForm.tasks || []), taskInput.trim()]);
      setTaskInput("");
    }
  };

  const removeTask = (idx) => onChange("tasks", (jobForm.tasks || []).filter((_, i) => i !== idx));

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[10] flex items-center justify-center p-4 overflow-y-auto">
      <div className="card max-w-lg w-full p-6 relative my-4">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-extrabold text-[#050A30] dark:text-white text-xl mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
          {copyEditMode ? "Copy & Edit Job" : "Post a Job"}
        </h2>
        <p className="text-slate-500 text-sm mb-5">
          {copyEditMode ? "Edit the copied job details, then post." : "Workers will be notified in real-time"}
        </p>

        <form onSubmit={e => onSubmit(e, jobImages)} className="space-y-4">
          {/* Job type toggle */}
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => onChange("is_emergency", false)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm border-2 transition-colors ${!jobForm.is_emergency ? "bg-emerald-600 text-white border-emerald-600" : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200"}`}
              data-testid="regular-job-btn">Regular Job</button>
            <button type="button" onClick={() => onChange("is_emergency", true)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm border-2 flex items-center justify-center gap-1 transition-colors ${jobForm.is_emergency ? "bg-red-600 text-white border-red-600" : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200"}`}
              data-testid="emergency-job-btn">
              <AlertTriangle className="w-4 h-4" /> Emergency
            </button>
          </div>

          {/* Boost toggle */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
            <div>
              <p className="text-xs font-bold text-[#050A30] dark:text-white">Job Boost <span className="text-purple-500 text-[10px] font-semibold ml-1">PAID</span></p>
              <p className="text-xs text-slate-400">Priority placement in crew feed</p>
            </div>
            <button type="button" onClick={() => onChange("is_boosted", !jobForm.is_boosted)}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${jobForm.is_boosted ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-600"}`}
              data-testid="boost-job-toggle">
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${jobForm.is_boosted ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {jobForm.is_emergency && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-3 text-xs text-red-700 dark:text-red-300">
              Emergency jobs broadcast to all nearby crew. First to accept wins the slot.
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[#050A30] dark:text-white mb-1">Job Title *</label>
            <input type="text" required value={jobForm.title} onChange={e => onChange("title", e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0000FF] dark:bg-slate-800 dark:text-white"
              placeholder="e.g. Framing Crew Needed" data-testid="job-title-input" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#050A30] dark:text-white mb-1">Description <span className="text-red-500">*</span></label>
            <textarea value={jobForm.description} onChange={e => onChange("description", e.target.value)} rows={3} required
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0000FF] dark:bg-slate-800 dark:text-white"
              placeholder="Describe the work..." data-testid="job-desc-input" />
          </div>

          {/* PunchList Tasks */}
          <div>
            <label className="block text-sm font-semibold text-[#050A30] dark:text-white mb-1">PunchList Tasks</label>
            <div className="flex gap-2 mb-2">
              <input value={taskInput} onChange={e => setTaskInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }}
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0000FF] dark:bg-slate-800 dark:text-white"
                placeholder="Add a task…" data-testid="task-input" />
              <button type="button" onClick={addTask}
                className="px-3 py-2 bg-[#0000FF] text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                data-testid="add-task-btn">Add</button>
            </div>
            {(jobForm.tasks || []).length > 0 && (
              <ul className="space-y-1" data-testid="task-list">
                {(jobForm.tasks || []).map((t, i) => (
                  <li key={`task-${i}-${t}`} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300">
                    <span>{t}</span>
                    <button type="button" onClick={() => removeTask(i)}
                      className="text-slate-400 hover:text-red-500 ml-2 transition-colors" data-testid={`remove-task-${i}`}>✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Job Images */}
          <div>
            <label className="block text-sm font-semibold text-[#050A30] dark:text-white mb-1">
              Job Images <span className="text-xs text-slate-400">(max 4, jpeg/png/webp)</span>
            </label>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp"
              onChange={e => {
                const valid = Array.from(e.target.files).filter(f => ["image/jpeg", "image/png", "image/webp"].includes(f.type));
                if (valid.length > 4) { toast.error("Max 4 images allowed"); return; }
                setJobImages(valid);
              }}
              className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#0000FF] hover:file:bg-blue-100 transition-colors"
              data-testid="job-images-input" />
            {jobImages.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">{jobImages.length} image{jobImages.length > 1 ? "s" : ""} selected</p>
            )}
          </div>

          {/* Trade + Crew Needed */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#050A30] dark:text-white mb-1">Trade *</label>
              <TradeSelect grouped={grouped} value={jobForm.trade} onChange={v => onChange("trade", v)} required placeholder="Select trade" data-testid="job-trade-select" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#050A30] dark:text-white mb-1">Crew Needed *</label>
              <input type="number" min="1" max="50" required value={jobForm.crew_needed} onChange={e => onChange("crew_needed", e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0000FF] dark:bg-slate-800 dark:text-white"
                data-testid="job-crew-needed-input" />
            </div>
          </div>

          {/* Start Time + Pay Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#050A30] dark:text-white mb-1">Start Time *</label>
              <input type="datetime-local" required value={jobForm.start_time} onChange={e => onChange("start_time", e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0000FF] dark:bg-slate-800 dark:text-white"
                data-testid="job-start-time-input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#050A30] dark:text-white mb-1">Pay Rate ($/hr) *</label>
              <input type="number" min="1" step="0.50" required value={jobForm.pay_rate} onChange={e => onChange("pay_rate", e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0000FF] dark:bg-slate-800 dark:text-white"
                placeholder="25.00" data-testid="job-pay-rate-input" />
            </div>
          </div>

          {/* Address with autocomplete */}
          <div>
            <label className="block text-sm font-semibold text-[#050A30] dark:text-white mb-1">Job Location (Address) *</label>
            <div className="relative" ref={addressSuggestionsRef}>
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
              <input type="text" required value={jobForm.address}
                onChange={e => handleAddressChange(e.target.value)}
                onFocus={() => addressSuggestions.length > 0 && setShowAddressSuggestions(true)}
                autoComplete="off"
                className="w-full pl-9 pr-8 border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 text-sm focus:outline-none focus:border-[#0000FF] dark:bg-slate-800 dark:text-white"
                placeholder="123 Main St, Atlanta, GA" data-testid="job-address-input" />
              {fetchingAddressSuggestions && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#0000FF] border-t-transparent rounded-full animate-spin" />
              )}
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <ul className="absolute z-[11] left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {addressSuggestions.map((s, i) => (
                    <li key={s.full_address || i} onMouseDown={() => selectSuggestion(s)}
                      className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <MapPin className="w-3.5 h-3.5 text-[#0000FF] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-[#050A30] dark:text-white leading-tight">
                          {s.city && s.state ? `${s.city}, ${s.state}` : s.full_address.split(",").slice(0, 2).join(",")}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-xs">{s.full_address}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button"
              onClick={() => onPreview({
                ...jobForm,
                trade: normalizeTrade(jobForm.trade),
                contractor_name: user?.company_name || user?.name,
                status: "open",
                crew_accepted: [],
                location: { city: jobForm.address?.split(",")[1]?.trim() || jobForm.address },
              })}
              className="flex-1 flex items-center justify-center gap-1.5 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold text-sm hover:border-slate-300 transition-colors"
              data-testid="preview-form-btn">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button type="submit"
              className="flex-1 bg-[#0000FF] text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              data-testid="submit-job-btn">
              {copyEditMode ? "Post Copy" : jobForm.is_emergency ? "Send Emergency Alert" : "Post Job Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
