'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Boxes } from 'lucide-react';

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
  product_id?: string;
  quantity: number;
  unit_cost: number;
}

interface SaleItem {
  id: string;
  product_id?: string;
  quantity: number;
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

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .order('material')
        .order('brand')
        .order('color');

      const { data: items } = await supabase.from('sales_items').select('id, product_id, quantity');
      const { data: purchaseItems } = await supabase.from('purchase_items').select('id, product_id, quantity, unit_cost');

      if (prodData) setProducts(prodData);
      if (purchaseItems) setPurchases(purchaseItems);
      if (items) setSales(items);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function getProductPurchased(productId: string) {
    return purchases
      .filter((p) => p.product_id === productId)
      .reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  }

  function getProductSold(productId: string) {
    return sales
      .filter((s) => s.product_id === productId)
      .reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  }

  function getProductStock(productId: string) {
    return getProductPurchased(productId) - getProductSold(productId);
  }

  function getProductCUMP(product: Product) {
    const prodPurchases = purchases.filter((p) => p.product_id === product.id);
    const totalSpent = prodPurchases.reduce((sum, p) => sum + (Number(p.quantity || 0) * Number(p.unit_cost || 0)), 0);
    const totalQty = prodPurchases.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    return totalQty > 0 ? (totalSpent / totalQty) : (product.avg_buy_price || 0);
  }

  const categories = Array.from(new Set(products.map((p) => p.material)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 text-sm animate-pulse">Chargement de l'état des stocks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Boxes className="text-indigo-400" size={20} /> État Détaillé des Stocks
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualisation des stocks réels calculés, Coût Unitaire Moyen Pondéré (CUMP) et marges prévisionnelles.
          </p>
        </div>
      </div>

      {categories.map((category) => {
        const categoryProducts = products.filter((p) => p.material === category);
        const categorySpools = categoryProducts.reduce((acc, p) => acc + getProductStock(p.id), 0);
        const categoryPurchasedTotal = categoryProducts.reduce((acc, p) => acc + getProductPurchased(p.id), 0);
        const categoryValue = categoryProducts.reduce((acc, p) => acc + (getProductStock(p.id) * getProductCUMP(p)), 0);

        return (
          <div key={category} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="bg-slate-950/60 p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white tracking-wide">{category}</span>
                <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
                  {categorySpools} bobine(s) en stock
                </span>
              </div>
              <div className="text-sm font-medium text-slate-400">
                Valeur : <span className="text-emerald-400 font-mono font-semibold">{categoryValue.toFixed(2)} €</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400 border-b border-slate-800/60 uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-5">Marque / Format</th>
                    <th className="p-3.5">Couleur</th>
                    <th className="p-3.5 text-center">Achats totaux</th>
                    <th className="p-3.5 text-center">Quantité en stock</th>
                    <th className="p-3.5 font-mono">Coût Moyen (CUMP)</th>
                    <th className="p-3.5 font-mono">Prix Vente</th>
                    <th className="p-3.5 font-mono">Marge estimée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {categoryProducts.map((item) => {
                    const currentStock = getProductStock(item.id);
                    const totalBought = getProductPurchased(item.id);
                    const realCump = getProductCUMP(item);
                    const margin = item.default_sell_price - realCump;
                    const cStyle = getColorStyle(item.color);

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3.5 pl-5 font-semibold text-white">{item.brand}</td>
                        <td className="p-3.5">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border"
                               style={{ backgroundColor: `${cStyle.dot}20`, borderColor: `${cStyle.border}50` }}>
                            <span 
                              className="w-3.5 h-3.5 rounded-full border shadow-sm flex-shrink-0"
                              style={{ backgroundColor: cStyle.dot, borderColor: cStyle.border }}
                            />
                            <span className="text-slate-200">{item.color}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-block min-w-8 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {totalBought}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block min-w-8 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              currentStock === 0
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : currentStock <= item.min_stock_alert
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {currentStock}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">{realCump.toFixed(2)} €</td>
                        <td className="p-3.5 font-mono text-slate-300">{Number(item.default_sell_price).toFixed(2)} €</td>
                        <td className="p-3.5 font-mono text-emerald-400 font-medium">+{margin.toFixed(2)} €</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-950/80 border-t-2 border-slate-800 text-xs font-bold">
                  <tr>
                    <td className="p-3.5 pl-5 text-slate-400 uppercase tracking-wider" colSpan={2}>
                      Total {category}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="text-cyan-400 font-mono text-sm">{categoryPurchasedTotal}</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="text-emerald-400 font-mono text-sm">{categorySpools}</span>
                    </td>
                    <td className="p-3.5" colSpan={2}></td>
                    <td className="p-3.5 font-mono text-emerald-400 text-sm font-bold">
                      {categoryValue.toFixed(2)} €
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}