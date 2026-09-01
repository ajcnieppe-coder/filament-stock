'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  ArrowDownLeft, ShoppingCart, Trash2, 
  Clock, Truck, PackageCheck, Calendar, Store, Edit3, X, Check, Plus
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
}

interface PurchaseOrderGroup {
  id: string;
  supplier: string;
  created_at: string;
  items: PurchaseItem[];
  totalQty: number;
  totalCost: number;
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
}

interface SalesOrderGroup {
  id: string;
  platform: string;
  created_at: string;
  status: 'Achat en cours' | 'Colis envoyé' | 'Colis reçu';
  items: SaleItem[];
  totalQty: number;
  totalRevenue: number;
}

function getColorHex(colorName: string): { bg: string; border: string } {
  const c = (colorName || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (c.includes('noir') || c.includes('black')) return { bg: '#000000', border: '#475569' };
  if (c.includes('blanc') || c.includes('white')) return { bg: '#ffffff', border: '#cbd5e1' };
  if (c.includes('rouge') || c.includes('red')) return { bg: '#ef4444', border: '#b91c1c' };
  if (c.includes('cyan') || c.includes('bleu cyan') || c.includes('sky')) return { bg: '#06b6d4', border: '#0891b2' };
  if (c.includes('bleu') || c.includes('blue')) return { bg: '#2563eb', border: '#1d4ed8' };
  if (c.includes('jaune') || c.includes('yellow')) return { bg: '#eab308', border: '#ca8a04' };
  if (c.includes('orange')) return { bg: '#f97316', border: '#c2410c' };
  if (c.includes('vert') || c.includes('green')) return { bg: '#22c55e', border: '#15803d' };
  if (c.includes('violet') || c.includes('purple')) return { bg: '#a855f7', border: '#7e22ce' };
  if (c.includes('rose') || c.includes('pink')) return { bg: '#ec4899', border: '#be185d' };
  if (c.includes('argent') || c.includes('silver')) return { bg: '#cbd5e1', border: '#94a3b8' };
  if (c.includes('gris') || c.includes('grey') || c.includes('gray')) return { bg: '#64748b', border: '#475569' };
  if (c.includes('beige') || c.includes('skin') || c.includes('glace')) return { bg: '#d6c7a1', border: '#a89a74' };
  if (c.includes('or') || c.includes('gold')) return { bg: '#eab308', border: '#a16207' };
  if (c.includes('marron') || c.includes('brown')) return { bg: '#78350f', border: '#451a03' };
  if (c.includes('transparent') || c.includes('clear')) return { bg: 'rgba(255,255,255,0.2)', border: '#94a3b8' };
  return { bg: '#6366f1', border: '#4338ca' };
}

export default function HistoryPage() {
  const [historySubTab, setHistorySubTab] = useState<'purchases' | 'sales'>('sales');
  const [purchaseGroups, setPurchaseGroups] = useState<PurchaseOrderGroup[]>([]);
  const [salesGroups, setSalesGroups] = useState<SalesOrderGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // État Édition Vente
  const [editingSale, setEditingSale] = useState<SalesOrderGroup | null>(null);
  const [editSalePlatform, setEditSalePlatform] = useState('');
  const [editSaleCreatedAt, setEditSaleCreatedAt] = useState('');
  const [editSaleStatus, setEditSaleStatus] = useState<'Achat en cours' | 'Colis envoyé' | 'Colis reçu'>('Achat en cours');
  const [editSaleItems, setEditSaleItems] = useState<SaleItem[]>([]);

  // État Édition Achat
  const [editingPurchase, setEditingPurchase] = useState<PurchaseOrderGroup | null>(null);
  const [editPurchaseSupplier, setEditPurchaseSupplier] = useState('');
  const [editPurchaseCreatedAt, setEditPurchaseCreatedAt] = useState('');
  const [editPurchaseItems, setEditPurchaseItems] = useState<PurchaseItem[]>([]);

  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: prodData } = await supabase.from('products').select('*');
      const { data: pOrders } = await supabase.from('purchase_orders').select('*');
      const { data: pItems } = await supabase.from('purchase_items').select('*');
      const { data: sOrders } = await supabase.from('sales_orders').select('*');
      const { data: sItems } = await supabase.from('sales_items').select('*');

      if (prodData) setProducts(prodData);

      // 1. Groupes Achats triés strictement par Date & Heure
      if (pOrders && pItems) {
        const groups: PurchaseOrderGroup[] = pOrders.map((ord: any) => {
          const itemsForOrder = pItems
            .filter((it: any) => it.purchase_order_id === ord.id)
            .map((it: any) => ({
              ...it,
              product: prodData?.find((p) => p.id === it.product_id),
            }));

          const totalQty = itemsForOrder.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
          const totalCost = itemsForOrder.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_cost || 0)), 0);

          return {
            id: ord.id,
            supplier: ord.supplier || 'Fournisseur direct',
            created_at: ord.created_at,
            items: itemsForOrder,
            totalQty,
            totalCost,
          };
        }).filter(g => g.items.length > 0);

        groups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPurchaseGroups(groups);
      }

      // 2. Groupes Ventes triés strictement par Date & Heure
      if (sOrders && sItems) {
        const groups: SalesOrderGroup[] = sOrders.map((ord: any) => {
          const itemsForOrder = sItems
            .filter((it: any) => it.sales_order_id === ord.id)
            .map((it: any) => ({
              ...it,
              product: prodData?.find((p) => p.id === it.product_id),
            }));

          const totalQty = itemsForOrder.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
          const totalRevenue = itemsForOrder.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_sell_price || 0)), 0);

          return {
            id: ord.id,
            platform: ord.platform || 'Leboncoin',
            created_at: ord.created_at,
            status: ord.status || 'Achat en cours',
            items: itemsForOrder,
            totalQty,
            totalRevenue,
          };
        }).filter(g => g.items.length > 0);

        groups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setSalesGroups(groups);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('sales_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Erreur mise à jour statut : ' + error.message);
    } else {
      setSalesGroups(prev =>
        prev.map(g => (g.id === orderId ? { ...g, status: newStatus as any } : g))
      );
    }
  }

  // --- LOGIQUE ÉDITION VENTE ---
  function handleOpenSaleEdit(group: SalesOrderGroup) {
    setEditingSale(group);
    setEditSalePlatform(group.platform);
    setEditSaleStatus(group.status);
    setEditSaleItems(JSON.parse(JSON.stringify(group.items)));
    
    const d = new Date(group.created_at);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setEditSaleCreatedAt(localISOTime);
  }

  async function handleSaveSaleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSale) return;

    if (editSaleItems.length === 0) {
      alert('Une vente doit contenir au moins une bobine.');
      return;
    }

    setSavingEdit(true);
    try {
      const updatedTimestamp = new Date(editSaleCreatedAt).toISOString();

      // 1. Mettre à jour l'ordre de vente
      const { error: ordErr } = await supabase
        .from('sales_orders')
        .update({
          platform: editSalePlatform.trim() || 'Vente directe',
          status: editSaleStatus,
          created_at: updatedTimestamp,
        })
        .eq('id', editingSale.id);

      if (ordErr) throw ordErr;

      // 2. Réconcilier les items et le stock
      const originalItems = editingSale.items;

      for (const orig of originalItems) {
        const updatedItem = editSaleItems.find(it => it.id === orig.id);
        if (!updatedItem) {
          // Bobine supprimée du lot => Réinjecter l'ancienne quantité au stock
          await supabase.from('sales_items').delete().eq('id', orig.id);
          if (orig.product_id) {
            const prod = products.find(p => p.id === orig.product_id);
            if (prod) {
              await supabase.from('products').update({
                stock_quantity: prod.stock_quantity + Number(orig.quantity)
              }).eq('id', orig.product_id);
            }
          }
        } else {
          // Mise à jour de la quantité et/ou du prix unitaire
          const qtyDiff = Number(updatedItem.quantity) - Number(orig.quantity);
          await supabase.from('sales_items').update({
            quantity: Number(updatedItem.quantity),
            unit_sell_price: Number(updatedItem.unit_sell_price),
            created_at: updatedTimestamp,
          }).eq('id', updatedItem.id);

          if (qtyDiff !== 0 && orig.product_id) {
            const prod = products.find(p => p.id === orig.product_id);
            if (prod) {
              await supabase.from('products').update({
                stock_quantity: Math.max(0, prod.stock_quantity - qtyDiff)
              }).eq('id', orig.product_id);
            }
          }
        }
      }

      setEditingSale(null);
      await fetchData();
    } catch (err: any) {
      alert('Erreur lors de la modification de la vente : ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  // --- LOGIQUE ÉDITION ACHAT ---
  function handleOpenPurchaseEdit(group: PurchaseOrderGroup) {
    setEditingPurchase(group);
    setEditPurchaseSupplier(group.supplier);
    setEditPurchaseItems(JSON.parse(JSON.stringify(group.items)));

    const d = new Date(group.created_at);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setEditPurchaseCreatedAt(localISOTime);
  }

  async function handleSavePurchaseEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPurchase) return;

    if (editPurchaseItems.length === 0) {
      alert('Un achat doit contenir au moins une bobine.');
      return;
    }

    setSavingEdit(true);
    try {
      const updatedTimestamp = new Date(editPurchaseCreatedAt).toISOString();

      // 1. Mettre à jour l'ordre d'achat
      const { error: ordErr } = await supabase
        .from('purchase_orders')
        .update({
          supplier: editPurchaseSupplier.trim() || 'Fournisseur direct',
          created_at: updatedTimestamp,
        })
        .eq('id', editingPurchase.id);

      if (ordErr) throw ordErr;

      // 2. Réconcilier les items et ajuster le stock
      const originalItems = editingPurchase.items;

      for (const orig of originalItems) {
        const updatedItem = editPurchaseItems.find(it => it.id === orig.id);
        if (!updatedItem) {
          // Bobine retirée de la commande => Déduire l'ancienne quantité du stock
          await supabase.from('purchase_items').delete().eq('id', orig.id);
          if (orig.product_id) {
            const prod = products.find(p => p.id === orig.product_id);
            if (prod) {
              await supabase.from('products').update({
                stock_quantity: Math.max(0, prod.stock_quantity - Number(orig.quantity))
              }).eq('id', orig.product_id);
            }
          }
        } else {
          // Quantité ou coût modifié
          const qtyDiff = Number(updatedItem.quantity) - Number(orig.quantity);
          await supabase.from('purchase_items').update({
            quantity: Number(updatedItem.quantity),
            unit_cost: Number(updatedItem.unit_cost),
            created_at: updatedTimestamp,
          }).eq('id', updatedItem.id);

          if (qtyDiff !== 0 && orig.product_id) {
            const prod = products.find(p => p.id === orig.product_id);
            if (prod) {
              await supabase.from('products').update({
                stock_quantity: Math.max(0, prod.stock_quantity + qtyDiff)
              }).eq('id', orig.product_id);
            }
          }
        }
      }

      setEditingPurchase(null);
      await fetchData();
    } catch (err: any) {
      alert('Erreur lors de la modification de l\'achat : ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function deletePurchaseOrder(orderId: string) {
    if (!confirm('Supprimer cette commande d\'achat complète ? Le stock sera recalculé.')) return;
    await supabase.from('purchase_items').delete().eq('purchase_order_id', orderId);
    await supabase.from('purchase_orders').delete().eq('id', orderId);
    fetchData();
  }

  async function deleteSalesOrder(orderId: string) {
    if (!confirm('Supprimer cette commande de vente complète ? Le stock sera réintégré.')) return;
    await supabase.from('sales_items').delete().eq('sales_order_id', orderId);
    await supabase.from('sales_orders').delete().eq('id', orderId);
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 text-sm animate-pulse">Chargement de l'historique...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête des onglets */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit gap-1">
        <button
          onClick={() => setHistorySubTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            historySubTab === 'sales' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart size={16} /> Lots Vendus ({salesGroups.length})
        </button>
        <button
          onClick={() => setHistorySubTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            historySubTab === 'purchases' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft size={16} /> Commandes Achats ({purchaseGroups.length})
        </button>
      </div>

      {/* 1. COMMANDES DE VENTES */}
      {historySubTab === 'sales' && (
        <div className="space-y-4">
          {salesGroups.map((group) => {
            const dateObj = new Date(group.created_at);
            const dateStr = dateObj.toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            });
            const timeStr = dateObj.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={group.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-3">
                <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <ShoppingCart size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{group.platform}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          {group.totalQty} bobine(s)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <Calendar size={12} /> {dateStr} à {timeStr}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total encaissé</div>
                      <div className="font-mono font-bold text-emerald-400 text-base">+{group.totalRevenue.toFixed(2)} €</div>
                    </div>
                    
                    <button
                      onClick={() => handleOpenSaleEdit(group)}
                      className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
                      title="Modifier la vente et les bobines"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => deleteSalesOrder(group.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
                      title="Supprimer ce lot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* MODULE SUIVI D'EXPÉDITION */}
                <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/50 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Truck size={14} className="text-indigo-400" /> État de la commande :
                  </span>

                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(group.id, 'Achat en cours')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        group.status === 'Achat en cours'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Clock size={13} /> Achat en cours
                    </button>

                    <button
                      type="button"
                      onClick={() => updateOrderStatus(group.id, 'Colis envoyé')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        group.status === 'Colis envoyé'
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Truck size={13} /> Colis envoyé
                    </button>

                    <button
                      type="button"
                      onClick={() => updateOrderStatus(group.id, 'Colis reçu')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        group.status === 'Colis reçu'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <PackageCheck size={13} /> Colis reçu
                    </button>
                  </div>
                </div>

                {/* Détail des bobines du lot */}
                <div className="p-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {group.items.map((item) => {
                      const colorHex = item.product ? getColorHex(item.product.color) : null;
                      return (
                        <div key={item.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              style={{
                                display: 'inline-block',
                                width: '13px',
                                height: '13px',
                                minWidth: '13px',
                                minHeight: '13px',
                                borderRadius: '9999px',
                                backgroundColor: colorHex?.bg,
                                border: `1.5px solid ${colorHex?.border}`,
                              }}
                            />
                            <div className="truncate">
                              <div className="text-xs font-semibold text-white truncate">
                                [{item.product?.material || '?'}] {item.product?.brand || ''}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">{item.product?.color}</div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-bold text-emerald-400 font-mono">x{item.quantity}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{Number(item.unit_sell_price).toFixed(2)} €/u</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {salesGroups.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500">
              Aucune vente enregistrée pour le moment.
            </div>
          )}
        </div>
      )}

      {/* 2. COMMANDES D'ACHATS */}
      {historySubTab === 'purchases' && (
        <div className="space-y-4">
          {purchaseGroups.map((group) => {
            const dateObj = new Date(group.created_at);
            const dateStr = dateObj.toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            });
            const timeStr = dateObj.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={group.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-3">
                <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                      <Store size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{group.supplier}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                          {group.totalQty} bobine(s)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <Calendar size={12} /> {dateStr} à {timeStr}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total commande</div>
                      <div className="font-mono font-bold text-rose-400 text-base">-{group.totalCost.toFixed(2)} €</div>
                    </div>

                    <button
                      onClick={() => handleOpenPurchaseEdit(group)}
                      className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
                      title="Modifier l'achat et les bobines"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => deletePurchaseOrder(group.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
                      title="Supprimer cette commande"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {group.items.map((item) => {
                      const colorHex = item.product ? getColorHex(item.product.color) : null;
                      return (
                        <div key={item.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              style={{
                                display: 'inline-block',
                                width: '13px',
                                height: '13px',
                                minWidth: '13px',
                                minHeight: '13px',
                                borderRadius: '9999px',
                                backgroundColor: colorHex?.bg,
                                border: `1.5px solid ${colorHex?.border}`,
                              }}
                            />
                            <div className="truncate">
                              <div className="text-xs font-semibold text-white truncate">
                                [{item.product?.material || '?'}] {item.product?.brand || ''}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">{item.product?.color}</div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-bold text-cyan-400 font-mono">x{item.quantity}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{Number(item.unit_cost).toFixed(2)} €/u</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {purchaseGroups.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500">
              Aucune commande d'achat enregistrée pour le moment.
            </div>
          )}
        </div>
      )}

      {/* MODALE DE MODIFICATION D'UNE VENTE */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-400" />
                Modifier le lot vendu
              </h3>
              <button
                onClick={() => setEditingSale(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSaleEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Canal / Plateforme
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['Vente directe', 'Leboncoin', 'Vinted', 'Autre'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditSalePlatform(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        editSalePlatform === p
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editSalePlatform}
                  onChange={(e) => setEditSalePlatform(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Date & Heure
                  </label>
                  <input
                    type="datetime-local"
                    value={editSaleCreatedAt}
                    onChange={(e) => setEditSaleCreatedAt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Statut expédition
                  </label>
                  <select
                    value={editSaleStatus}
                    onChange={(e) => setEditSaleStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Achat en cours">Achat en cours</option>
                    <option value="Colis envoyé">Colis envoyé</option>
                    <option value="Colis reçu">Colis reçu</option>
                  </select>
                </div>
              </div>

              {/* ÉDITION DES BOBINES VENDUES */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-white block">
                  Bobines dans le lot ({editSaleItems.length})
                </label>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editSaleItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          [{item.product?.material}] {item.product?.brand}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.product?.color}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Qté</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setEditSaleItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                            }}
                            className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 block">Prix (€/u)</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_sell_price}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditSaleItems(prev => prev.map((it, i) => i === idx ? { ...it, unit_sell_price: val } : it));
                            }}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-mono text-center font-bold"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditSaleItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-500 hover:text-rose-400 mt-3 transition"
                          title="Supprimer cette ligne"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Check size={15} />
                  {savingEdit ? 'Enregistrement...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE MODIFICATION D'UN ACHAT */}
      {editingPurchase && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 size={18} className="text-cyan-400" />
                Modifier la commande d'achat
              </h3>
              <button
                onClick={() => setEditingPurchase(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Fournisseur
                </label>
                <input
                  type="text"
                  value={editPurchaseSupplier}
                  onChange={(e) => setEditPurchaseSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Date & Heure de l'achat
                </label>
                <input
                  type="datetime-local"
                  value={editPurchaseCreatedAt}
                  onChange={(e) => setEditPurchaseCreatedAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>

              {/* ÉDITION DES BOBINES ACHETÉES */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-white block">
                  Bobines reçues ({editPurchaseItems.length})
                </label>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editPurchaseItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          [{item.product?.material}] {item.product?.brand}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.product?.color}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Qté</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setEditPurchaseItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                            }}
                            className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 block">Coût (€/u)</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_cost}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditPurchaseItems(prev => prev.map((it, i) => i === idx ? { ...it, unit_cost: val } : it));
                            }}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-rose-400 font-mono text-center font-bold"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditPurchaseItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-500 hover:text-rose-400 mt-3 transition"
                          title="Supprimer cette ligne"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPurchase(null)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
                >
                  <Check size={15} />
                  {savingEdit ? 'Enregistrement...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
