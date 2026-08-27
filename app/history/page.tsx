'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  ArrowDownLeft, ShoppingCart, Trash2, 
  Clock, Truck, PackageCheck, Calendar, Store
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
  const [historySubTab, setHistorySubTab] = useState<'purchases' | 'sales'>('purchases');
  const [purchaseGroups, setPurchaseGroups] = useState<PurchaseOrderGroup[]>([]);
  const [salesGroups, setSalesGroups] = useState<SalesOrderGroup[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Regroupement et tri strict décroissant par milliseconde (le plus récent en premier)
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

      // Regroupement et tri strict décroissant pour les ventes
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
        <div className="text-slate-400 text-sm animate-pulse">Chargement de l'historique des commandes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête des onglets */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit gap-1">
        <button
          onClick={() => setHistorySubTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            historySubTab === 'purchases' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft size={16} /> Commandes Achats ({purchaseGroups.length})
        </button>
        <button
          onClick={() => setHistorySubTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            historySubTab === 'sales' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart size={16} /> Lots Vendus ({salesGroups.length})
        </button>
      </div>

      {/* 1. COMMANDES D'ACHATS SÉPARÉES */}
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
                {/* En-tête du bon de commande */}
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

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total commande</div>
                      <div className="font-mono font-bold text-rose-400 text-base">-{group.totalCost.toFixed(2)} €</div>
                    </div>
                    <button
                      onClick={() => deletePurchaseOrder(group.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
                      title="Supprimer cette commande"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Détail des bobines de la commande */}
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

      {/* 2. COMMANDES DE VENTES AVEC MODULE D'EXPÉDITION */}
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
                {/* En-tête de la vente */}
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

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total encaissé</div>
                      <div className="font-mono font-bold text-emerald-400 text-base">+{group.totalRevenue.toFixed(2)} €</div>
                    </div>
                    <button
                      onClick={() => deleteSalesOrder(group.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
                      title="Supprimer ce lot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* MODULE SUIVI D'EXPÉDITION (ACHAT EN COURS / ENVOYÉ / REÇU) */}
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
    </div>
  );
}