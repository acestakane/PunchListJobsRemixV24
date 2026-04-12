import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronUp, ChevronDown } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentsTab() {
  const [paymentsByUser, setPaymentsByUser] = useState([]);
  const [expandedPayUser, setExpandedPayUser] = useState(null);

  useEffect(() => {
    axios.get(`${API}/admin/payments/by-user`)
      .then(r => setPaymentsByUser(r.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold text-[#050A30] dark:text-white mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
        Payments by User
        <span className="text-sm font-normal text-slate-400 ml-2">({paymentsByUser.length} users)</span>
      </h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                {["User", "Role", "Transactions", "Total Paid"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paymentsByUser.map(p => (
                <React.Fragment key={p.user_id}>
                  <tr
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${expandedPayUser === p.user_id ? "bg-slate-50 dark:bg-slate-800/50" : ""}`}
                    onClick={() => setExpandedPayUser(expandedPayUser === p.user_id ? null : p.user_id)}
                    data-testid={`pay-user-row-${p.user_id}`}>
                    <td className="px-4 py-3">
                      {expandedPayUser === p.user_id
                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#050A30] dark:text-white">{p.user_name}</p>
                      <p className="text-xs text-slate-500">{p.user_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full font-semibold">{p.user_role || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.count}</td>
                    <td className="px-4 py-3 font-extrabold text-[#050A30] dark:text-white">${p.total?.toFixed(2)}</td>
                  </tr>
                  {expandedPayUser === p.user_id && (
                    <tr>
                      <td colSpan={5} className="px-6 pb-4 bg-slate-50 dark:bg-slate-900/40">
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mt-1">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800">
                                {["ID", "Amount", "Plan", "Method", "Status", "Date"].map(h => (
                                  <th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                              {(p.transactions || []).map((t) => (
                                <tr key={t.id} className="hover:bg-white dark:hover:bg-slate-800">
                                  <td className="px-3 py-2 font-mono text-slate-400">{(t.id || "").slice(0, 8)}</td>
                                  <td className="px-3 py-2 font-bold text-[#050A30] dark:text-white">${t.amount?.toFixed(2)}</td>
                                  <td className="px-3 py-2 capitalize text-slate-500">{t.plan}</td>
                                  <td className="px-3 py-2 capitalize text-slate-500">{t.payment_method}</td>
                                  <td className="px-3 py-2">
                                    <span className={`px-1.5 py-0.5 rounded-full font-semibold ${t.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                      {t.payment_status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-slate-400">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {paymentsByUser.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No payment records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
