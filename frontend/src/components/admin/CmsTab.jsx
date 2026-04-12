import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FileText, Shield, Users, Info, HelpCircle, BookOpen } from "lucide-react";
import WysiwygEditor from "../WysiwygEditor";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CMS_PAGES = [
  { slug: "terms",                icon: FileText,    label: "Terms & Conditions" },
  { slug: "privacy",              icon: Shield,      label: "Privacy Policy" },
  { slug: "community-guidelines", icon: Users,       label: "Community Guidelines" },
  { slug: "about",                icon: Info,        label: "About" },
  { slug: "faqs",                 icon: HelpCircle,  label: "FAQs" },
  { slug: "what-is-a-punch-list", icon: BookOpen,    label: "What is a Punch List?" },
];

export default function CmsTab() {
  const [cmsPages, setCmsPages] = useState([]);
  const [activeCmsSlug, setActiveCmsSlug] = useState("terms");
  const [cmsForm, setCmsForm] = useState({ title: "", header_text: "", content: "", youtube_url: "" });

  useEffect(() => {
    axios.get(`${API}/cms/pages`)
      .then(r => {
        setCmsPages(r.data || []);
        const first = (r.data || [])[0];
        if (first) {
          setActiveCmsSlug(first.slug);
          setCmsForm({ title: first.title, header_text: first.header_text || "", content: first.content || "", youtube_url: first.youtube_url || "" });
        }
      })
      .catch(() => {});
  }, []);

  const saveCmsPage = async () => {
    try {
      await axios.put(`${API}/cms/pages/${activeCmsSlug}`, cmsForm);
      toast.success("Page saved");
      setCmsPages(p => p.map(pg => pg.slug === activeCmsSlug ? { ...pg, ...cmsForm } : pg));
    } catch { toast.error("Failed to save page"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <div className="card p-2 space-y-1">
          {CMS_PAGES.map(({ slug, icon: Icon, label }) => (
            <button key={slug} onClick={() => {
              setActiveCmsSlug(slug);
              const page = cmsPages.find(p => p.slug === slug);
              if (page) setCmsForm({ title: page.title || "", header_text: page.header_text || "", content: page.content || "", youtube_url: page.youtube_url || "" });
            }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left ${activeCmsSlug === slug ? "bg-slate-800 dark:bg-slate-700 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              data-testid={`cms-page-${slug}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-3 space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
              {CMS_PAGES.find(p => p.slug === activeCmsSlug)?.label}
            </h3>
            <span className="text-xs text-slate-400 font-mono">/{activeCmsSlug}</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Page Title</label>
              <input type="text" value={cmsForm.title} onChange={e => setCmsForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                data-testid="cms-title-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Header / Subtitle</label>
              <input type="text" value={cmsForm.header_text} onChange={e => setCmsForm(f => ({ ...f, header_text: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                data-testid="cms-header-input" />
            </div>
            {activeCmsSlug === "about" && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">YouTube Video URL</label>
                <input type="url" value={cmsForm.youtube_url} onChange={e => setCmsForm(f => ({ ...f, youtube_url: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                  placeholder="https://www.youtube.com/watch?v=..." data-testid="cms-youtube-input" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                {activeCmsSlug === "faqs" ? "Content (JSON array of {question, answer})" : "Content"}
              </label>
              {activeCmsSlug === "faqs" ? (
                <textarea value={cmsForm.content} onChange={e => setCmsForm(f => ({ ...f, content: e.target.value }))}
                  rows={10}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                  data-testid="cms-content-editor" />
              ) : (
                <WysiwygEditor key={activeCmsSlug} value={cmsForm.content} onChange={v => setCmsForm(f => ({ ...f, content: v }))} placeholder={`Enter ${activeCmsSlug} content...`} />
              )}
            </div>
          </div>
          <button onClick={saveCmsPage}
            className="mt-5 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            data-testid="save-cms-btn">
            Save Page
          </button>
        </div>
      </div>
    </div>
  );
}
