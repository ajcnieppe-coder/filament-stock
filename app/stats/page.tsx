'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  DollarSign, Wallet, TrendingUp, Package, Tag, Percent, 
  BarChart3, ArrowDownRight, PieChart 
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
  product_id?: string;
  quantity: number;
  unit_cost: number;
}

interface SaleItem {
  id: string;
  product_id?: string;
  quantity: number;
  unit_sell_price: number;
  unit_cost_snapshot: number;
  created_at: string;
  product?: Product;
  order?: {
    id?: string;
    platform: string;
    created_at: string;
  };
}

function getColorStyle(colorName: string) {
  const c = (colorName || '').trim().toLowerCase();
  if (c.includes('noir') || c.includes('black')) return { dot: '#1e293b' };
  if (c.includes('blanc') || c.includes('white')) return { dot: '#e2e8f0' };
  if (c.includes('rouge') || c.includes('red')) return { dot: '#ef4444' };
  if (c.includes('cyan') || c.includes('bleu cyan')) return { dot: '#06b6d4' };
  if (c.includes('bleu') || c.includes('blue')) return { dot: '#2563eb' };
  if (c.includes('jaune') || c.includes('yellow')) return { dot: '#eab308' };
  if (c.includes('orange')) return { dot: '#f97316' };
  if (c.includes('vert') || c.includes('green')) return { dot: '#16a34a' };
  if (c.includes('violet') || c.includes('purple')) return { dot: '#9333ea' };
  if (c.includes('rose') || c.includes('pink')) return { dot: '#ec4899' };
  if (c.includes('argent') || c.includes('silver')) return { dot: '#cbd5e1' };
  if (c.includes('gris') || c.includes('grey') || c.includes('gray')) return { dot: '#64748b' };
  if (c.includes('beige') || c.includes('skin') || c.includes('glace')) return { dot: '#d6c7a1' };
  if (c.includes('or') || c.includes('gold')) return { dot: '#d97706' };
  if (c.includes('marron') || c.includes('brown')) return { dot: '#78350f' };
  return { dot: '#818cf8' };
}

function PieChartComponent({
  title,
  data,
  unit = ''
}: {
  title: string;
  data: { label: string; value: number; color: string }[];
  unit?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <PieChart size={16} className="text-indigo-400" /> {title}
        </h4>
        <div className="text-center py-10 text-xs text-slate-500">Aucune vente enregistrée</div>
      </div>
    );
  }

  let accumulatedPercent = 0;
  const slices = data.map((d) => {
    const percent = (d.value / total) * 100;
    const startAngle = (accumulatedPercent * 360) / 100;
    accumulatedPercent += percent;
    const endAngle = (accumulatedPercent * 360) / 100;

    const startX = Math.cos((Math.PI * (startAngle - 90)) / 180);
    const startY = Math.sin((Math.PI * (startAngle - 90)) / 180);
    const endX = Math.cos((Math.PI * (endAngle - 90)) / 180);
    const endY = Math.sin((Math.PI * (endAngle - 90)) / 180);
    const largeArc = percent > 50 ? 1 : 0;

    const pathData = percent >= 99.9
      ? `M 0 0 m -1, 0 a 1,1 0 1,0 2,0 a 1,1 0 1,0 -2,0`
      : `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArc} 1 ${endX} ${endY} Z`;

    return { ...d, percent, pathData };
  });

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between shadow-sm">
      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
        <PieChart size={16} className="text-indigo-400" /> {title}
      </h4>

      <div className="flex flex-col sm:flex-row items-center gap-6 justify-center my-2">
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90 transform">
            {slices.map((slice, i) => (
              <path
                key={i}
                d={slice.pathData}
                fill={slice.color}
                stroke="#020617"
                strokeWidth="0.03"
                className="hover:opacity-85 transition-opacity"
              />
            ))}
          </svg>
        </div>

        <div className="space-y-1.5 w-full max-h-56 overflow-y-auto pr-1">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-700 shadow-sm"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-slate-300 truncate font-medium">{slice.label}</span>
              </div>
              <div className="font-mono text-slate-400 text-right flex-shrink-0">
                <strong className="text-white">{slice.percent.toFixed(1)}%</strong> ({slice.value.toFixed(unit === '€' ? 2 : 0)}{unit})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (prodData) setProducts(prodData);
      if (purchaseItems) setPurchases(purchaseItems);

      if (items && prodData) {
        const formattedSales: SaleItem[] = items.map((item: any) => {
          const prod = prodData.find((p) => p.id === item.product_id);
          const ord = orders?.find((o) => o.id === item.sales_order_id);
          return {
            id: item.id,
            product_id: item.product_id,
            created_at: item.created_at || new Date().toISOString(),
            quantity: Number(item.quantity) || 1,
            unit_sell_price: Number(item.unit_sell_price) || 0,
            unit_cost_snapshot: Number(item.unit_cost_snapshot) || 0,
            product: prod,
            order: {
              id: ord?.id,
              platform: ord?.platform || 'Direct',
              created_at: ord?.created_at || item.created_at || new Date().toISOString(),
            },
          };
        });
        setSales(formattedSales);
      }
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

  // Totaux calculés
  const totalStockValue = products.reduce((acc, p) => acc + (getProductStock(p.id) * getProductCUMP(p)), 0);
  const totalSpools = products.reduce((acc, p) => acc + getProductStock(p.id), 0);

  const totalStockValueSellingPrice = products.reduce((acc, p) => {
    const stock = getProductStock(p.id);
    return acc + (stock > 0 ? stock * Number(p.default_sell_price || 0) : 0);
  }, 0);

  const totalRevenue = sales.reduce((acc, s) => acc + s.quantity * s.unit_sell_price, 0);
  const totalCostSold = sales.reduce((acc, s) => acc + s.quantity * s.unit_cost_snapshot, 0);
  const totalProfit = totalRevenue - totalCostSold;
  const totalSpoolsSold = sales.reduce((acc, s) => acc + s.quantity, 0);

  const avgMarginPerSpool = totalSpoolsSold > 0 ? (totalProfit / totalSpoolsSold) : 0;
  const globalMarginPercent = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  const totalSpentPurchases = purchases.reduce((acc, p) => acc + (p.quantity * p.unit_cost), 0);
  const totalSpoolsPurchased = purchases.reduce((acc, p) => acc + p.quantity, 0);
  const netCashFlow = totalRevenue - totalSpentPurchases;

  // Camemberts
  const revenueByMaterialMap: { [mat: string]: number } = {};
  sales.forEach((s) => {
    const mat = (s.product?.material || 'PLA').toUpperCase().trim();
    revenueByMaterialMap[mat] = (revenueByMaterialMap[mat] || 0) + (s.quantity * s.unit_sell_price);
  });
  const materialColors: { [mat: string]: string } = {
    PLA: '#6366f1',
    PETG: '#06b6d4',
    ABS: '#f59e0b',
    TPU: '#ec4899',
  };
  const pieRevenueByMaterial = Object.entries(revenueByMaterialMap).map(([mat, val]) => ({
    label: mat,
    value: val,
    color: materialColors[mat] || '#94a3b8',
  }));

  const plaSalesColorMap: { [color: string]: number } = {};
  sales.forEach((s) => {
    const mat = (s.product?.material || '').toUpperCase().trim();
    if (mat === 'PLA') {
      const col = (s.product?.color || 'Inconnu').trim();
      plaSalesColorMap[col] = (plaSalesColorMap[col] || 0) + Number(s.quantity || 0);
    }
  });
  const piePlaSalesColors = Object.entries(plaSalesColorMap)
    .sort((a, b) => b[1] - a[1])
    .map(([col, qty]) => ({
      label: col,
      value: qty,
      color: getColorStyle(col).dot,
    }));

  const petgSalesColorMap: { [color: string]: number } = {};
  sales.forEach((s) => {
    const mat = (s.product?.material || '').toUpperCase().trim();
    if (mat === 'PETG') {
      const col = (s.product?.color || 'Inconnu').trim();
      petgSalesColorMap[col] = (petgSalesColorMap[col] || 0) + Number(s.quantity || 0);
    }
  });
  const piePetgSalesColors = Object.entries(petgSalesColorMap)
    .sort((a, b) => b[1] - a[1])
    .map(([col, qty]) => ({
      label: col,
      value: qty,
      color: getColorStyle(col).dot,
    }));

  // Date
  const salesByDate: { [key: string]: number } = {};
  sales.forEach((s) => {
    const d = (s.order?.created_at || s.created_at).split('T')[0];
    salesByDate[d] = (salesByDate[d] || 0) + (s.quantity * s.unit_sell_price);
  });
  const dateEntries = Object.entries(salesByDate).sort(([a], [b]) => a.localeCompare(b));
  const maxDayRevenue = Math.max(...Object.values(salesByDate), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 text-sm animate-pulse">Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. LIGNE DES KPI PRINCIPAUX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
            <DollarSign size={18} className="text-indigo-400" /> Recettes Totales
          </div>
          <div className="text-2xl font-bold text-white">{totalRevenue.toFixed(2)} €</div>
          <div className="text-xs text-slate-500 mt-1">{totalSpoolsSold} bobine(s) vendue(s)</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
            <ArrowDownRight size={18} className="text-rose-400" /> Dépenses Totales
          </div>
          <div className="text-2xl font-bold text-rose-400">-{totalSpentPurchases.toFixed(2)} €</div>
          <div className="text-xs text-slate-500 mt-1">{totalSpoolsPurchased} bobine(s) approvisionnée(s)</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
            <Wallet size={18} className="text-amber-400" /> Bénéfice Réel (Cash-flow)
          </div>
          <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netCashFlow >= 0 ? `+${netCashFlow.toFixed(2)} €` : `${netCashFlow.toFixed(2)} €`}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {netCashFlow >= 0 ? "Stock déjà amorti & remboursé" : `Reste à amortir : ${Math.abs(netCashFlow).toFixed(2)} €`}
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
            <TrendingUp size={18} className="text-emerald-400" /> Marge Réalisée
          </div>
          <div className="text-2xl font-bold text-emerald-400">+{totalProfit.toFixed(2)} €</div>
          <div className="text-xs text-slate-500 mt-1">Rentabilité : {globalMarginPercent}%</div>
        </div>
      </div>

      {/* 2. LIGNE DES INDICATEURS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
            <Package size={18} className="text-cyan-400" /> Bobines restantes en stock
          </div>
          <div className="text-2xl font-bold text-cyan-400">{totalSpools} bobines</div>
          <div className="text-xs text-slate-500 mt-1">Réparties sur {products.length} références</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
            <Tag size={18} className="text-indigo-400" /> Valeur Stock (Prix Vente Conseillé)
          </div>
          <div className="text-2xl font-bold text-white">{totalStockValueSellingPrice.toFixed(2)} €</div>
          <div className="text-xs text-slate-500 mt-1">Valeur au coût de revient : {totalStockValue.toFixed(2)} €</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
            <Percent size={18} className="text-emerald-400" /> Marge Moyenne / Bobine Vendue
          </div>
          <div className="text-2xl font-bold text-emerald-400">+{avgMarginPerSpool.toFixed(2)} € <span className="text-sm font-normal text-slate-400">/ unité</span></div>
          <div className="text-xs text-slate-500 mt-1">Soit une marge moyenne de {globalMarginPercent}%</div>
        </div>
      </div>

      {/* 3. GRAPHIQUES CAMEMBERTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PieChartComponent
          title="Recettes par Matériau (€)"
          data={pieRevenueByMaterial}
          unit="€"
        />

        <PieChartComponent
          title="Répartition Couleurs PLA (Ventes)"
          data={piePlaSalesColors}
          unit=" vendues"
        />

        <PieChartComponent
          title="Répartition Couleurs PETG (Ventes)"
          data={piePetgSalesColors}
          unit=" vendues"
        />
      </div>

      {/* 4. HISTORIQUE DES RECETTES PAR DATE */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={20} /> Évolution des Recettes par Date
          </h3>
          <span className="text-xs text-slate-400">En € encaissés</span>
        </div>
        
        {dateEntries.length === 0 ? (
          <div className="text-center py-10 text-slate-500">Aucune vente enregistrée pour le moment.</div>
        ) : (
          <div className="space-y-3 pt-4">
            {dateEntries.map(([date, amount]) => {
              const percentage = Math.round((amount / maxDayRevenue) * 100);
              return (
                <div key={date} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">{new Date(date).toLocaleDateString('fr-FR')}</span>
                    <span className="text-emerald-400 font-bold">{amount.toFixed(2)} €</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}