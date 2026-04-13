import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { getErr } from "../../utils/errorUtils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TradesTab() {
  const [tradeCategories, setTradeCategories] = useState([]);
  const [trades, setTrades] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [tradeForm, setTradeForm] = useState({ name: "", category_id: "" });
  const [catForm, setCatForm] = useState({ name: "" });
  const [editCat, setEditCat] = useState(null);
  const [editTrade, setEditTrade] = useState(null);

  const fetchTradeCategories = async () => {
    try {
      const res = await axios.get(`${API}/trades/admin/categories`);
      setTradeCategories(res.data.categories || []);
    } catch (e) { console.error("fetchTradeCategories failed", e); }
  };

  const fetchTrades = async (catId = null) => {
    const url = catId ? `${API}/trades/admin/trades?category_id=${catId}` : `${API}/trades/admin/trades`;
    try {
      const res = await axios.get(url);
      setTrades(res.data.trades || []);
    } catch (e) { console.error("fetchTrades failed", e); }
  };

  useEffect(() => {
    fetchTradeCategories();
    fetchTrades();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Trade Categories</h3>
            <span className="text-xs text-slate-400">{tradeCategories.length} total</span>
          </div>
          <div className="flex gap-2 mb-4">
            <input type="text"
              value={editCat ? editCat.name : catForm.name}
              onChange={e => editCat ? setEditCat(c => ({ ...c, name: e.target.value })) : setCatForm({ name: e.target.value })}
              placeholder="Category name..."
              className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
              data-testid="cat-name-input" />
            {editCat ? (
              <>
                <button onClick={async () => {
                  if (!editCat.name.trim()) return;
                  try { await axios.put(`${API}/trades/admin/categories/${editCat.id}`, { name: editCat.name }); toast.success("Category updated"); setEditCat(null); fetchTradeCategories(); } catch (e) { toast.error(getErr(e, "Failed")); }
                }} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold" data-testid="save-cat-btn">Save</button>
                <button onClick={() => setEditCat(null)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-500 rounded-lg text-xs" data-testid="cancel-cat-btn">×</button>
              </>
            ) : (
              <button onClick={async () => {
                if (!catForm.name.trim()) return;
                try { await axios.post(`${API}/trades/admin/categories`, { name: catForm.name }); toast.success("Category created"); setCatForm({ name: "" }); fetchTradeCategories(); } catch (e) { toast.error(getErr(e, "Failed")); }
              }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold" data-testid="add-cat-btn">+ Add</button>
            )}
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {tradeCategories.map(cat => (
              <div key={cat.id}
                onClick={() => { setSelectedCatId(cat.id); setTradeForm(f => ({ ...f, category_id: cat.id })); fetchTrades(cat.id); }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedCatId === cat.id ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-500" : "hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent"}`}
                data-testid={`cat-row-${cat.id}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.is_active ? "bg-green-400" : "bg-slate-300"}`} />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cat.name}</span>
                  <span className="text-xs text-slate-400">({cat.trade_count || 0})</span>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setEditCat({ id: cat.id, name: cat.name })} className="text-xs px-2 py-1 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20" data-testid={`edit-cat-${cat.id}`}>Edit</button>
                  <button onClick={async () => {
                    try { await axios.post(`${API}/trades/admin/categories/${cat.id}/${cat.is_active ? "suspend" : "activate"}`); fetchTradeCategories(); } catch (e) { toast.error(getErr(e, "Failed")); }
                  }} className={`text-xs px-2 py-1 rounded ${cat.is_active ? "text-amber-500 hover:bg-amber-50" : "text-green-500 hover:bg-green-50"}`} data-testid={`toggle-cat-${cat.id}`}>{cat.is_active ? "Suspend" : "Activate"}</button>
                  <button onClick={async () => {
                    if (!window.confirm("Delete category? All trades must be removed first.")) return;
                    try { await axios.delete(`${API}/trades/admin/categories/${cat.id}`); toast.success("Deleted"); if (selectedCatId === cat.id) setSelectedCatId(null); fetchTradeCategories(); } catch (e) { toast.error(getErr(e, "Failed")); }
                  }} className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-50" data-testid={`delete-cat-${cat.id}`}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trades */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
              {selectedCatId ? `Trades — ${tradeCategories.find(c => c.id === selectedCatId)?.name || ""}` : "Trades (select a category)"}
            </h3>
            <span className="text-xs text-slate-400">{trades.length} trades</span>
          </div>
          {selectedCatId && (
            <div className="flex gap-2 mb-4">
              <input type="text"
                value={editTrade ? editTrade.name : tradeForm.name}
                onChange={e => editTrade ? setEditTrade(t => ({ ...t, name: e.target.value })) : setTradeForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Trade name..."
                className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                data-testid="trade-name-input" />
              {editTrade ? (
                <>
                  <button onClick={async () => {
                    if (!editTrade.name.trim()) return;
                    try { await axios.put(`${API}/trades/admin/trades/${editTrade.id}`, { name: editTrade.name }); toast.success("Trade updated"); setEditTrade(null); fetchTrades(selectedCatId); } catch (e) { toast.error(getErr(e, "Failed")); }
                  }} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold" data-testid="save-trade-btn">Save</button>
                  <button onClick={() => setEditTrade(null)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-500 rounded-lg text-xs" data-testid="cancel-trade-btn">×</button>
                </>
              ) : (
                <button onClick={async () => {
                  if (!tradeForm.name.trim() || !selectedCatId) return;
                  try { await axios.post(`${API}/trades/admin/trades`, { name: tradeForm.name, category_id: selectedCatId }); toast.success("Trade created"); setTradeForm(f => ({ ...f, name: "" })); fetchTrades(selectedCatId); } catch (e) { toast.error(getErr(e, "Failed")); }
                }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold" data-testid="add-trade-btn">+ Add</button>
              )}
            </div>
          )}
          {!selectedCatId ? (
            <p className="text-sm text-slate-400 text-center py-8">← Select a category to manage its trades</p>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {trades.map(trade => (
                <div key={trade.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700" data-testid={`trade-row-${trade.id}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${trade.is_active ? "bg-green-400" : "bg-slate-300"}`} />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{trade.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditTrade({ id: trade.id, name: trade.name })} className="text-xs px-2 py-1 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20" data-testid={`edit-trade-${trade.id}`}>Edit</button>
                    <button onClick={async () => {
                      try { await axios.post(`${API}/trades/admin/trades/${trade.id}/${trade.is_active ? "suspend" : "activate"}`); fetchTrades(selectedCatId); } catch (e) { toast.error(getErr(e, "Failed")); }
                    }} className={`text-xs px-2 py-1 rounded ${trade.is_active ? "text-amber-500 hover:bg-amber-50" : "text-green-500 hover:bg-green-50"}`} data-testid={`toggle-trade-${trade.id}`}>{trade.is_active ? "Suspend" : "Activate"}</button>
                    <button onClick={async () => {
                      if (!window.confirm("Delete this trade?")) return;
                      try { await axios.delete(`${API}/trades/admin/trades/${trade.id}`); toast.success("Deleted"); fetchTrades(selectedCatId); } catch (e) { toast.error(getErr(e, "Failed")); }
                    }} className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-50" data-testid={`delete-trade-${trade.id}`}>Del</button>
                  </div>
                </div>
              ))}
              {trades.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No trades yet. Add one above.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
