import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Edit, Check, X, Trash2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: "", type: "percent", value: "", max_uses: "", expires_at: "", plan_restriction: "" });
  const [editCouponId, setEditCouponId] = useState(null);
  const [editCouponForm, setEditCouponForm] = useState({});

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API}/coupons`);
      setCoupons(res.data || []);
    } catch {}
  };

  useEffect(() => { fetchCoupons(); }, []);

  const createCoupon = async () => {
    if (!couponForm.code || !couponForm.value) { toast.error("Code and value are required"); return; }
    try {
      await axios.post(`${API}/coupons`, {
        ...couponForm,
        value: Number(couponForm.value),
        max_uses: couponForm.max_uses ? Number(couponForm.max_uses) : null,
        expires_at: couponForm.expires_at || null,
        plan_restriction: couponForm.plan_restriction || null,
      });
      toast.success("Coupon created");
      setCouponForm({ code: "", type: "percent", value: "", max_uses: "", expires_at: "", plan_restriction: "" });
      fetchCoupons();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to create coupon"); }
  };

  const openEditCoupon = (c) => {
    setEditCouponId(c.id);
    setEditCouponForm({ code: c.code, type: c.type, value: c.value, max_uses: c.max_uses ?? "", expires_at: c.expires_at ?? "", plan_restriction: c.plan_restriction ?? "" });
  };

  const saveEditCoupon = async () => {
    try {
      await axios.patch(`${API}/coupons/${editCouponId}`, {
        ...editCouponForm,
        value: Number(editCouponForm.value),
        max_uses: editCouponForm.max_uses ? Number(editCouponForm.max_uses) : null,
        expires_at: editCouponForm.expires_at || null,
        plan_restriction: editCouponForm.plan_restriction || null,
      });
      toast.success("Coupon updated");
      setEditCouponId(null);
      setEditCouponForm({});
      fetchCoupons();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to update coupon"); }
  };

  const toggleCoupon = async (id) => {
    await axios.patch(`${API}/coupons/${id}/toggle`);
    fetchCoupons();
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    await axios.delete(`${API}/coupons/${id}`);
    toast.success("Coupon deleted");
    fetchCoupons();
  };

  return (
    <div className="space-y-6" data-testid="coupons-tab">
      <div className="card p-5">
        <h3 className="font-bold text-[#050A30] dark:text-white mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>Create Discount Code</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <input placeholder="CODE (e.g. SAVE20)" value={couponForm.code}
            onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white col-span-2 sm:col-span-1"
            data-testid="coupon-code-input" />
          <select value={couponForm.type} onChange={e => setCouponForm(f => ({ ...f, type: e.target.value }))}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none dark:bg-slate-800 dark:text-white"
            data-testid="coupon-type-select">
            <option value="percent">% Percent</option>
            <option value="fixed">$ Fixed</option>
          </select>
          <input type="number" placeholder="Value" min="0" step="0.01" value={couponForm.value}
            onChange={e => setCouponForm(f => ({ ...f, value: e.target.value }))}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
            data-testid="coupon-value-input" />
          <input type="number" placeholder="Max uses (blank=∞)" min="1" value={couponForm.max_uses}
            onChange={e => setCouponForm(f => ({ ...f, max_uses: e.target.value }))}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
            data-testid="coupon-max-uses-input" />
          <input type="datetime-local" value={couponForm.expires_at}
            onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
            data-testid="coupon-expires-input" />
          <select value={couponForm.plan_restriction} onChange={e => setCouponForm(f => ({ ...f, plan_restriction: e.target.value }))}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none dark:bg-slate-800 dark:text-white"
            data-testid="coupon-plan-select">
            <option value="">Any plan</option>
            {["daily", "weekly", "monthly", "annual"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button onClick={createCoupon} className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm" data-testid="create-coupon-btn">
          Create Coupon
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>{["Code", "Type", "Value", "Uses", "Expires", "Plan", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {coupons.map(c => (
                <React.Fragment key={c.id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50" data-testid={`coupon-row-${c.id}`}>
                    <td className="px-4 py-3 font-mono font-bold text-[#050A30] dark:text-white">{c.code}</td>
                    <td className="px-4 py-3 capitalize text-slate-500">{c.type}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{c.type === "percent" ? `${c.value}%` : `$${c.value}`}</td>
                    <td className="px-4 py-3 text-slate-500">{c.used_count}/{c.max_uses ?? "∞"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{c.plan_restriction || "Any"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => editCouponId === c.id ? setEditCouponId(null) : openEditCoupon(c)}
                          title="Edit" className={`p-1.5 rounded ${editCouponId === c.id ? "bg-blue-100 text-blue-700" : "text-blue-500 hover:bg-blue-50"}`}
                          data-testid={`edit-coupon-${c.id}`}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleCoupon(c.id)} title={c.is_active ? "Disable" : "Enable"}
                          className={`p-1.5 rounded ${c.is_active ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                          data-testid={`toggle-coupon-${c.id}`}>
                          {c.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteCoupon(c.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50" title="Delete" data-testid={`delete-coupon-${c.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editCouponId === c.id && (
                    <tr>
                      <td colSpan={8} className="px-4 pb-4 bg-blue-50/50 dark:bg-blue-900/10">
                        <div className="pt-3">
                          <p className="text-xs font-semibold text-blue-600 mb-2">Editing: {c.code}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            <input placeholder="Code" value={editCouponForm.code || ""}
                              onChange={e => setEditCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                              data-testid="edit-coupon-code" />
                            <select value={editCouponForm.type || "percent"} onChange={e => setEditCouponForm(f => ({ ...f, type: e.target.value }))}
                              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none">
                              <option value="percent">% Percent</option>
                              <option value="fixed">$ Fixed</option>
                            </select>
                            <input type="number" placeholder="Value" min="0" step="0.01" value={editCouponForm.value || ""}
                              onChange={e => setEditCouponForm(f => ({ ...f, value: e.target.value }))}
                              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                              data-testid="edit-coupon-value" />
                            <input type="number" placeholder="Max uses" min="1" value={editCouponForm.max_uses || ""}
                              onChange={e => setEditCouponForm(f => ({ ...f, max_uses: e.target.value }))}
                              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                            <input type="datetime-local" value={editCouponForm.expires_at || ""}
                              onChange={e => setEditCouponForm(f => ({ ...f, expires_at: e.target.value }))}
                              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                            <select value={editCouponForm.plan_restriction || ""} onChange={e => setEditCouponForm(f => ({ ...f, plan_restriction: e.target.value }))}
                              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none">
                              <option value="">Any plan</option>
                              {["daily", "weekly", "monthly", "annual"].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={saveEditCoupon} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700" data-testid="save-edit-coupon-btn">Save Changes</button>
                            <button onClick={() => setEditCouponId(null)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500">Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {coupons.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No coupons yet. Create one above.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
