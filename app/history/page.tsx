'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  ArrowDownLeft, ShoppingCart, Edit2, Trash2, X, Check 
} from 'lucide-react';

interface Product {
  id: string;
  brand: string;
  material: string;
  color: string;
  weight_g: number;
  stock_quantity: number;
  min_stock_alert: number;
  avg_buy_price: number;
  default_sell_price: number;
}

interface PurchaseItem {
  id: string;
  purchase_order_id?: string;
  product_id?: string;
  quantity: number;
  unit_cost: number;
  created_at: string;
  product?: Product;
  order?: {
    id?: string;
    supplier?: string;
    created_at?: string;
  };
}

interface SaleItem {
  id: string;
  sales_order_id?: string;
  product_id?: string;
  created_at: string;
  quantity: number;
  unit_sell_price: number;
  unit_cost_snapshot: number;
  product?: Product;
  order?: {
    id?: string;
    platform: string;
    created_at: string;
  };
}

function getColorStyle(colorName: string) {
  const c = (colorName || '').trim().toLowerCase();
  if (c.includes('noir') || c.includes('black')) return { bg: '#0f172a', border: '#475569', text: '#ffffff', dot: '#1e293b' };
  if (c.includes('blanc') || c.includes('white')) return { bg: '#f8fafc', border: '#cbd5e1', text: '#0f172a', dot: '#e2e8f0' };
  if (c.includes('rouge') || c.includes('red')) return { bg: '#dc2626', border: '#ef4444', text: '#ffffff', dot: '#ef4444' };
  if (c.includes('cyan') || c.includes('bleu cyan')) return { bg: '#06b6d4', border: '#22d3ee', text: '#ffffff', dot: '#06b6d4' };
  if (c.includes('bleu') || c.includes('blue')) return { bg: '#2563eb', border: '#3b82f6', text: '#ffffff', dot: '#2563eb' };
  if (c.includes('jaune') || c.includes('yellow')) return { bg: '#eab308', border: '#fde047', text: '#713f12', dot: '#eab308' };
  if (c.includes('orange')) return { bg: '#ea580c', border: '#f97316', text: '#ffffff', dot: '#f97316' };
  if (c.includes('vert') || c.includes('green')) return { bg: '#16a34a', border: '#22c55e', text: '#ffffff', dot: '#16a34a' };
  if (c.includes('violet') || c.includes('purple')) return { bg: '#9333ea', border: '#a855f7', text: '#ffffff', dot: '#9333ea' };
  if (c.includes('rose') || c.includes('pink')) return { bg: '#db2777', border: '#f472b6', text: '#ffffff', dot: '#ec4899' };
  if (c.includes('argent') || c.includes('silver')) return { bg: '#94a3b8', border: '#cbd5e1', text: '#0f172a', dot: '#cbd5e1' };
  if (c.includes('gris') || c.includes('grey') || c.includes('gray')) return { bg: '#64748b', border: '#94a3b8', text: '#ffffff', dot: '#64748b' };
  if (c.includes('beige') || c.includes('skin') || c.includes('glace')) return { bg: '#d6c7a1', border: '#e2d9bc', text: '#451a03', dot: '#d6c7a1' };
  if (c.includes('or') || c.includes('gold')) return { bg: '#ca8a04', border: '#eab308', text: '#ffffff', dot: '#d97706' };
  if (c.includes('marron') || c.includes('brown')) return { bg: '#78350f', border: '#92400e', text: '#ffffff', dot: '#78350f' };
  return { bg: '#475569', border: '#64748b', text: '#ffffff', dot: '#818cf8' };
}

export default function HistoryPage() {
  const [historySubTab, setHistorySubTab] = useState<'purchases' | 'sales'>('purchases');
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals d'édition
  const [editingPurchase, setEditingPurchase] = useState<PurchaseItem | null>(null);
  const [editPurchaseQty, setEditPurchaseQty] = useState<number>(1);
  const [editPurchaseCost, setEditPurchaseCost] = useState<number>(0);
  const [editPurchaseDate, setEditPurchaseDate] = useState<string>('');
  const [editPurchaseProductId, setEditPurchaseProductId] = useState<string>('');

  const [editingSale, setEditingSale] = useState<SaleItem | null>(null);
  const [editSaleQty, setEditSaleQty] = useState<number>(1);
  const [editSalePrice, setEditSalePrice] = useState<number>(0);
  const [editSaleDate, setEditSaleDate] = useState<string>('');
  const [editSalePlatform, setEditSalePlatform] = useState<string>('Leboncoin');
  const [editSaleProductId, setEditSaleProductId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: prodData } = await supabase.from('products').select('*');
      const { data: items } = await supabase.from('sales_items').select('*');
      const { data: orders } = await supabase.from('sales_orders').select('*');
      const { data: purchaseItems } = await supabase.from('purchase_items').select('*');
      const { data: purchaseOrders } = await supabase.from('purchase_orders').select('*');

      if (prodData) setProducts(prodData);

      if (purchaseItems && prodData) {
        const formattedPurchases: PurchaseItem[] = purchaseItems.map((item: any) => {
          const prod = prodData.find((p) => p.id === item.product_id);
          const ord = purchaseOrders?.find((o) => o.id === item.purchase_order_id);
          return {
            id: item.id,
            purchase_order_id: item.purchase_order_id,
            product_id: item.product_id,
            created_at: item.created_at || new Date().toISOString(),
            quantity: Number(item.quantity) || 1,
            unit_cost: Number(item.unit_cost) || 0,
            product: prod,
            order: {
              id: ord?.id,
              supplier: ord?.supplier || 'Fournisseur direct',
              created_at: ord?.created_at || item.created_at,
            },
          };
        });

        formattedPurchases.sort((a, b) => {
          const dateA = new Date(a.order?.created_at || a.created_at).getTime();
          const dateB = new Date(b.order?.created_at || b.created_at).getTime();
          return dateB - dateA;
        });

        setPurchases(formattedPurchases);
      }

      if (items && prodData) {
        const formattedSales: SaleItem[] = items.map((item: any) => {
          const prod = prodData.find((p) => p.id === item.product_id);
          const ord = orders?.find((o) => o.id === item.sales_order_id);
          return {
            id: item.id,
            sales_order_id: item.sales_order_id,
            product_id: item.product_id,
            created_at: item.created_at || new Date().toISOString(),
            quantity: Number(item.quantity) || 1,
            unit_sell_price: Number(item.unit_sell_price) || 0,
            unit_cost_snapshot: Number(item.unit_cost_snapshot) || 0,
            product: prod || { id: '', brand: 'Référence supprimée', color: '-', material: '-', weight_g: 1000, stock_quantity: 0, min_stock_alert: 0, avg_buy_price: 0, default_sell_price: 0 },
            order: {
              id: ord?.id,
              platform: ord?.platform || 'Direct',
              created_at: ord?.created_at || item.created_at || new Date().toISOString(),
            },
          };
        });

        formattedSales.sort((a, b) => {
          const dateA = new Date(a.order?.created_at || a.created_at).getTime();
          const dateB = new Date(b.order?.created_at || b.created_at).getTime();
          return dateB - dateA;
        });

        setSales(formattedSales);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function openEditPurchase(p: PurchaseItem) {
    setEditingPurchase(p);
    setEditPurchaseQty(p.quantity);
    setEditPurchaseCost(p.unit_cost);
    setEditPurchaseDate((p.order?.created_at || p.created_at).split('T')[0]);
    setEditPurchaseProductId(p.product_id || '');
  }

  async function saveEditPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPurchase) return;

    const formattedDate = new Date(editPurchaseDate + 'T12:00:00Z').toISOString();

    if (editingPurchase.purchase_order_id) {
      await supabase
        .from('purchase_orders')
        .update({ created_at: formattedDate })
        .eq('id', editingPurchase.purchase_order_id);
    }

    const { error } = await supabase
      .from('purchase_items')
      .update({
        product_id: editPurchaseProductId,
        quantity: Number(editPurchaseQty),
        unit_cost: Number(editPurchaseCost),
        created_at: formattedDate,
      })
      .eq('id', editingPurchase.id);

    if (error) {
      alert("Erreur lors de la modification de l'achat : " + error.message);
    } else {
      setEditingPurchase(null);
      fetchData();
    }
  }

  async function deletePurchase(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet achat ? Le stock sera automatiquement recalculé.')) return;
    const { error } = await supabase.from('purchase_items').delete().eq('id', id);
    if (error) alert('Erreur suppression : ' + error.message);
    else fetchData();
  }

  function openEditSale(s: SaleItem) {
    setEditingSale(s);
    setEditSaleQty(s.quantity);
    setEditSalePrice(s.unit_sell_price);
    setEditSaleDate((s.order?.created_at || s.created_at).split('T')[0]);
    setEditSalePlatform(s.order?.platform || 'Leboncoin');
    setEditSaleProductId(s.product_id || s.product?.id || '');
  }

  async function saveEditSale(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSale) return;

    const formattedDate = new Date(editSaleDate + 'T12:00:00Z').toISOString();

    if (editingSale.sales_order_id) {
      await supabase
        .from('sales_orders')
        .update({
          platform: editSalePlatform,
          created_at: formattedDate,
        })
        .eq('id', editingSale.sales_order_id);
    }

    const { error } = await supabase
      .from('sales_items')
      .update({
        product_id: editSaleProductId,
        quantity: Number(editSaleQty),
        unit_sell_price: Number(editSalePrice),
        created_at: formattedDate,
      })
      .eq('id', editingSale.id);

    if (error) {
      alert('Erreur lors de la modification de la vente : ' + error.message);
    } else {
      setEditingSale(null);
      fetchData();
    }
  }

  async function deleteSale(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cette vente ? Le stock sera automatiquement recalculé.')) return;
    const { error } = await supabase.from('sales_items').delete().eq('id', id);
    if (error) alert('Erreur suppression : ' + error.message);
    else fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 text-sm animate-pulse">Chargement des journaux...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit gap-1">
        <button
          onClick={() => setHistorySubTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            historySubTab === 'purchases' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft size={16} /> Journal des Achats ({purchases.length})
        </button>
        <button
          onClick={() => setHistorySubTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            historySubTab === 'sales' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart size={16} /> Journal des Ventes ({sales.length})
        </button>
      </div>

      {/* JOURNAL DES ACHATS */}
      {historySubTab === 'purchases' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <ArrowDownLeft className="text-cyan-400" size={20} /> Entrées d'achats détaillées
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Modifie ou supprime n'importe quelle entrée pour réajuster ton stock.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Fournisseur</th>
                  <th className="p-4">Bobine</th>
                  <th className="p-4 text-center">Quantité</th>
                  <th className="p-4 font-mono">Coût Unit.</th>
                  <th className="p-4 font-mono">Total Achat</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {purchases.map((p) => {
                  const cStyle = getColorStyle(p.product?.color || '');
                  const dateDisplay = p.order?.created_at
                    ? new Date(p.order.created_at).toLocaleDateString('fr-FR')
                    : new Date(p.created_at).toLocaleDateString('fr-FR');
                  const totalCost = p.quantity * p.unit_cost;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono text-slate-400">{dateDisplay}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {p.order?.supplier || 'Direct'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border shadow-inner flex-shrink-0"
                            style={{ backgroundColor: cStyle.dot, borderColor: cStyle.border }}
                          />
                          <span className="font-semibold text-white">
                            [{p.product?.material || '?'}] {p.product?.brand || 'Inconnu'} - {p.product?.color || ''}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          +{p.quantity}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-300">{p.unit_cost.toFixed(2)} €</td>
                      <td className="p-4 font-mono font-bold text-rose-400">-{totalCost.toFixed(2)} €</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditPurchase(p)}
                            className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition"
                            title="Modifier cet achat"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deletePurchase(p.id)}
                            className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition"
                            title="Supprimer cet achat"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">Aucun achat enregistré pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JOURNAL DES VENTES */}
      {historySubTab === 'sales' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <ShoppingCart className="text-emerald-400" size={20} /> Sorties de ventes détaillées
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Modifie ou supprime n'importe quelle vente pour réajuster ton stock.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Plateforme</th>
                  <th className="p-4">Bobine</th>
                  <th className="p-4 text-center">Quantité</th>
                  <th className="p-4 font-mono">Prix Vente Unit.</th>
                  <th className="p-4 font-mono">Total Encaissé</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sales.map((sale) => {
                  const cStyle = getColorStyle(sale.product?.color || '');
                  const dateDisplay = sale.order?.created_at
                    ? new Date(sale.order.created_at).toLocaleDateString('fr-FR')
                    : new Date(sale.created_at).toLocaleDateString('fr-FR');
                  const totalSold = sale.quantity * sale.unit_sell_price;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono text-slate-400">{dateDisplay}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          {sale.order?.platform || 'Direct'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border shadow-inner flex-shrink-0"
                            style={{ backgroundColor: cStyle.dot, borderColor: cStyle.border }}
                          />
                          <span className="font-semibold text-white">
                            [{sale.product?.material || '?'}] {sale.product?.brand || 'Inconnu'} - {sale.product?.color || ''}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          -{sale.quantity}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-300">{Number(sale.unit_sell_price).toFixed(2)} €</td>
                      <td className="p-4 font-mono font-bold text-emerald-400">+{totalSold.toFixed(2)} €</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditSale(sale)}
                            className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition"
                            title="Modifier cette vente"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteSale(sale.id)}
                            className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition"
                            title="Supprimer cette vente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">Aucune vente enregistrée pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATION ACHAT */}
      {editingPurchase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Edit2 size={16} className="text-cyan-400" /> Modifier l'entrée d'achat
              </h3>
              <button onClick={() => setEditingPurchase(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveEditPurchase} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Bobine associée</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
                  value={editPurchaseProductId}
                  onChange={(e) => setEditPurchaseProductId(e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.material}] {p.brand} - {p.color}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
                    value={editPurchaseQty}
                    onChange={(e) => setEditPurchaseQty(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Coût Unitaire (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
                    value={editPurchaseCost}
                    onChange={(e) => setEditPurchaseCost(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Date de l'achat</label>
                <input
                  type="date"
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
                  value={editPurchaseDate}
                  onChange={(e) => setEditPurchaseDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPurchase(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 font-semibold py-2.5 rounded-xl text-slate-300 transition text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-cyan-600 hover:bg-cyan-500 font-semibold py-2.5 rounded-xl text-white transition text-sm flex items-center justify-center gap-1.5"
                >
                  <Check size={16} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATION VENTE */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Edit2 size={16} className="text-emerald-400" /> Modifier la sortie de vente
              </h3>
              <button onClick={() => setEditingSale(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveEditSale} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Bobine associée</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 text-white"
                  value={editSaleProductId}
                  onChange={(e) => setEditSaleProductId(e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.material}] {p.brand} - {p.color}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Plateforme</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 text-white"
                    value={editSalePlatform}
                    onChange={(e) => setEditSalePlatform(e.target.value)}
                  >
                    <option value="Leboncoin">Leboncoin</option>
                    <option value="Vinted">Vinted</option>
                    <option value="Facebook Marketplace">Facebook</option>
                    <option value="Vente Directe">Direct</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 text-white"
                    value={editSaleDate}
                    onChange={(e) => setEditSaleDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 text-white"
                    value={editSaleQty}
                    onChange={(e) => setEditSaleQty(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Prix de Vente Unit. (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 text-white"
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 font-semibold py-2.5 rounded-xl text-slate-300 transition text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 font-semibold py-2.5 rounded-xl text-white transition text-sm flex items-center justify-center gap-1.5"
                >
                  <Check size={16} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}