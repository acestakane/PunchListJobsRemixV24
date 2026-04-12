import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertTriangle, ChevronLeft, User, Mail, Briefcase,
  CheckCircle, Loader2, FileText
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  "Inappropriate Behavior",
  "Payment Dispute",
  "Job Fraud / Scam",
  "Profile Impersonation",
  "Safety Concern",
  "Technical Issue",
  "Other",
];

export default function ReportConcern() {
  const { user } = useAuth();
  const [form, setForm] = useState({ category: "", subject: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category || !form.subject.trim() || !form.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/concerns/`, form);
      setSubmitted(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to submit concern");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#050A30] dark:text-white mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
            Concern Submitted
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Thank you for reporting. Our team will review your concern.
          </p>
          <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-5 py-3 mb-6">
            <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              We will review in 5 business days
            </p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/help/resolve-issue"
              className="px-5 py-2.5 bg-[#0000FF] text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
              data-testid="view-my-concerns-btn">
              Track My Concerns
            </Link>
            <Link to="/help"
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Back to Help
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">

        {/* Back link */}
        <Link to="/help" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0000FF] mb-6 transition-colors"
          data-testid="back-to-help">
          <ChevronLeft className="w-4 h-4" /> Back to Help
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
              Report a Concern
            </h1>
            <p className="text-sm text-slate-500">All reports are reviewed within 5 business days</p>
          </div>
        </div>

        {/* Auto-attached user info */}
        <div className="card p-4 mb-5 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Submitting as</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
              <span className="font-semibold">{user?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Mail className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Briefcase className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
              <span className="capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0000FF]/30"
              data-testid="concern-category"
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Brief summary of your concern"
              maxLength={200}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0000FF]/30"
              data-testid="concern-subject"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Please provide as much detail as possible…"
              rows={5}
              maxLength={2000}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0000FF]/30 resize-none"
              data-testid="concern-description"
            />
            <p className="text-right text-xs text-slate-400 mt-1">{form.description.length}/2000</p>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
            <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              We will review in 5 business days
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0000FF] text-white font-bold py-3 rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            data-testid="submit-concern-btn"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit Concern"}
          </button>
        </form>
      </div>
    </div>
  );
}
