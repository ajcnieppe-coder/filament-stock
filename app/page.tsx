'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { 
  Package, ShoppingCart, TrendingUp, AlertTriangle, Plus, 
  ArrowDownLeft, Lock, KeyRound, Trash2, CheckCircle2, AlertCircle,
  RefreshCw, Radio
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
  order?: {
    supplier?: string;
  };
}

interface SaleItem {
  id: string;
  product_id?: string;
  quantity: number;
}

interface PurchaseLine {
  productId: string;
  quantity: number;
  unitCost: number;
}

interface SaleLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface SupplierLink {
  id: string;
  supplier_name: string;
  url: string;
  label: string;
  is_in_stock: boolean;
  last_price: number;
  last_checked: string;
  status_note: string;
  product_id?: string;
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

export default function ActionsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [supplierLinks, setSupplierLinks] = useState<SupplierLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('');
  const [defaultSellPrice, setDefaultSellPrice] = useState(10);

  // Achat multi-lignes
  const [supplier, setSupplier] = useState('Joybuy');
  const [purchaseDate, setPurchaseDate] = useState(todayStr);
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([
    { productId: '', quantity: 1, unitCost: 0 }
  ]);

  // Vente multi-lignes
  const [platform, setPlatform] = useState('Leboncoin');
  const [saleDate, setSaleDate] = useState(todayStr);
  const [saleLines, setSaleLines] = useState<SaleLine[]>([
    { productId: '', quantity: 1, unitPrice: 10 }
  ]);

  const appPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;

  useEffect(() => {
    const savedAuth = localStorage.getItem('filament_app_auth');
    if (!appPassword || savedAuth === appPassword) {
      setIsAuthenticated(true);
      fetchData();
    }
  }, [appPassword]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === appPassword) {
      localStorage.setItem('filament_app_auth', passwordInput);
      setIsAuthenticated(true);
      setAuthError('');
      fetchData();
    } else {
      setAuthError('Mot de passe incorrect');
    }
  }

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
      const { data: purchaseItems } = await supabase.from('purchase_items').select('id, purchase_order_id, product_id, quantity, unit_cost');
      const { data: purchaseOrders } = await supabase.from('purchase_orders').select('id, supplier');
      const { data: supLinks } = await supabase.from('supplier_links').select('*');

      if (prodData) setProducts(prodData);
      if (supLinks) setSupplierLinks(supLinks);

      if (purchaseItems) {
        const formattedPurchases = purchaseItems.map((p) => {
          const ord = purchaseOrders?.find((o) => o.id === p.purchase_order_id);
          return {
            ...p,
            order: { supplier: ord?.supplier || 'Direct' }
          };
        });
        setPurchases(formattedPurchases);
      }
      if (items) setSales(items);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function runManualScan() {
    setIsScanning(true);
    try {
      const res = await fetch('/api/cron/check-stock', { cache: 'no-store' });
      if (res.ok) {
        await fetchData();
      } else {
        alert('Erreur lors du scan');
      }
    } catch (e: any) {
      alert('Erreur scan : ' + e.message);
    }
    setIsScanning(false);
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

  function getJoybuyStatus(product: Product | undefined): { isJoybuy: boolean; inStock: boolean } {
    if (!product) return { isJoybuy: false, inStock: false };

    const b = (product.brand || '').toLowerCase();
    const m = (product.material || '').toUpperCase();

    if (b.includes('anycubic') && m.includes('PLA')) {
      const link = supplierLinks.find(l => l.url?.includes('100187736') || l.label?.includes('PLA Basic'));
      return { isJoybuy: true, inStock: link ? link.is_in_stock : true };
    }

    if (b.includes('anycubic') && m.includes('PETG')) {
      const link = supplierLinks.find(l => l.url?.includes('100392240') || l.label?.includes('PETG'));
      return { isJoybuy: true, inStock: link ? link.is_in_stock : true };
    }

    if (b.includes('cailab')) {
      const link = supplierLinks.find(l => l.url?.includes('10424851') || l.label?.includes('Cailab'));
      return { isJoybuy: true, inStock: link ? link.is_in_stock : true };
    }

    return { isJoybuy: false, inStock: false };
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('products').insert([
      { brand, material, color, stock_quantity: 0, avg_buy_price: 0, default_sell_price: Number(defaultSellPrice) },
    ]);
    if (error) {
      alert('Erreur création produit : ' + error.message);
    } else {
      setBrand('');
      setColor('');
      setDefaultSellPrice(10);
      fetchData();
    }
  }

  // GESTION DES LIGNES D'ACHATS
  function handlePurchaseLineProductChange(index: number, newProductId: string) {
    const nextLines = [...purchaseLines];
    const targetProd = products.find((p) => p.id === newProductId);
    const cump = targetProd ? getProductCUMP(targetProd) : 0;

    nextLines[index] = {
      ...nextLines[index],
      productId: newProductId,
      unitCost: nextLines[index].unitCost > 0 ? nextLines[index].unitCost : (cump > 0 ? Number(cump.toFixed(2)) : 0),
    };

    if (newProductId && index === nextLines.length - 1) {
      nextLines.push({ productId: '', quantity: 1, unitCost: 0 });
    }

    setPurchaseLines(nextLines);
  }

  function handlePurchaseLineQuantityChange(index: number, quantity: number) {
    const nextLines = [...purchaseLines];
    nextLines[index].quantity = quantity;
    setPurchaseLines(nextLines);
  }

  function handlePurchaseLineCostChange(index: number, cost: number) {
    const nextLines = [...purchaseLines];
    nextLines[index].unitCost = cost;
    setPurchaseLines(nextLines);
  }

  function removePurchaseLine(index: number) {
    if (purchaseLines.length === 1) {
      setPurchaseLines([{ productId: '', quantity: 1, unitCost: 0 }]);
      return;
    }
    setPurchaseLines(purchaseLines.filter((_, i) => i !== index));
  }

  function addEmptyPurchaseLine() {
    setPurchaseLines([...purchaseLines, { productId: '', quantity: 1, unitCost: 0 }]);
  }

  async function recordMultiPurchase(e: React.FormEvent) {
    e.preventDefault();

    const validLines = purchaseLines.filter((l) => l.productId && l.productId !== '');
    if (validLines.length === 0) {
      alert('Veuillez sélectionner au moins une bobine reçue !');
      return;
    }

    const formattedDate = new Date(purchaseDate + 'T12:00:00Z').toISOString();

    const { data: order, error: orderErr } = await supabase
      .from('purchase_orders')
      .insert([{ supplier: supplier || 'Joybuy', created_at: formattedDate }])
      .select()
      .single();

    if (orderErr || !order) {
      alert('Erreur Achat (Order) : ' + orderErr?.message);
      return;
    }

    const itemsToInsert = validLines.map((line) => ({
      purchase_order_id: order.id,
      product_id: line.productId,
      quantity: Number(line.quantity),
      unit_cost: Number(line.unitCost),
      created_at: formattedDate,
    }));

    const { error: itemsErr } = await supabase.from('purchase_items').insert(itemsToInsert);

    if (itemsErr) {
      alert('Erreur Achat (Items) : ' + itemsErr.message);
      return;
    }

    alert(`${validLines.length} référence(s) entrée(s) en stock avec succès !`);
    setPurchaseLines([{ productId: '', quantity: 1, unitCost: 0 }]);
    fetchData();
  }

  // GESTION DES LIGNES DE VENTES
  function handleLineProductChange(index: number, newProductId: string) {
    const nextLines = [...saleLines];
    const targetProd = products.find((p) => p.id === newProductId);

    nextLines[index] = {
      ...nextLines[index],
      productId: newProductId,
      unitPrice: targetProd ? (targetProd.default_sell_price || 10) : nextLines[index].unitPrice,
    };

    if (newProductId && index === nextLines.length - 1) {
      nextLines.push({ productId: '', quantity: 1, unitPrice: 10 });
    }

    setSaleLines(nextLines);
  }

  function handleLineQuantityChange(index: number, quantity: number) {
    const nextLines = [...saleLines];
    nextLines[index].quantity = quantity;
    setSaleLines(nextLines);
  }

  function handleLinePriceChange(index: number, price: number) {
    const nextLines = [...saleLines];
    nextLines[index].unitPrice = price;
    setSaleLines(nextLines);
  }

  function removeSaleLine(index: number) {
    if (saleLines.length === 1) {
      setSaleLines([{ productId: '', quantity: 1, unitPrice: 10 }]);
      return;
    }
    setSaleLines(saleLines.filter((_, i) => i !== index));
  }

  function addEmptySaleLine() {
    setSaleLines([...saleLines, { productId: '', quantity: 1, unitPrice: 10 }]);
  }

  async function recordMultiSale(e: React.FormEvent) {
    e.preventDefault();

    const validLines = saleLines.filter((l) => l.productId && l.productId !== '');
    if (validLines.length === 0) {
      alert('Veuillez sélectionner au moins une bobine vendue !');
      return;
    }

    const formattedDate = new Date(saleDate + 'T12:00:00Z').toISOString();

    const { data: order, error: orderErr } = await supabase
      .from('sales_orders')
      .insert([{ platform, created_at: formattedDate }])
      .select()
      .single();

    if (orderErr || !order) {
      alert('Erreur Vente (Order) : ' + orderErr?.message);
      return;
    }

    const itemsToInsert = validLines.map((line) => {
      const prod = products.find((p) => p.id === line.productId);
      const cump = prod ? getProductCUMP(prod) : 0;
      return {
        sales_order_id: order.id,
        product_id: line.productId,
        quantity: Number(line.quantity),
        unit_sell_price: Number(line.unitPrice),
        unit_cost_snapshot: cump,
        created_at: formattedDate,
      };
    });

    const { error: itemsErr } = await supabase.from('sales_items').insert(itemsToInsert);

    if (itemsErr) {
      alert('Erreur Vente (Items) : ' + itemsErr.message);
      return;
    }

    alert(`${validLines.length} bobine(s) enregistrée(s) avec succès !`);
    setSaleLines([{ productId: '', quantity: 1, unitPrice: 10 }]);
    fetchData();
  }

  if (!isAuthenticated && appPassword) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700/80 p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white tracking-tight">Accès Sécurisé</h1>
            <p className="text-sm text-slate-400">Gestion Stock Filament 3D</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Code secret ou mot de passe"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 pl-10 pr-4 py-3 rounded-xl text-white text-sm outline-none focus:border-indigo-500 transition"
                  autoFocus
                />
                <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
              {authError && <p className="text-rose-400 text-xs mt-2 font-medium">{authError}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              Déverrouiller
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalStockValue = products.reduce((acc, p) => acc + (getProductStock(p.id) * getProductCUMP(p)), 0);
  const totalSpools = products.reduce((acc, p) => acc + getProductStock(p.id), 0);

  const currentPurchaseTotal = purchaseLines
    .filter((l) => l.productId)
    .reduce((sum, l) => sum + (Number(l.quantity || 0) * Number(l.unitCost || 0)), 0);

  const currentSaleTotal = saleLines
    .filter((l) => l.productId)
    .reduce((sum, l) => sum + (Number(l.quantity || 0) * Number(l.unitPrice || 0)), 0);

  return (
    <div className="space-y-6">
      {/* SECTION VEILLE STOCK FOURNISSEUR */}
      {supplierLinks.length > 0 && (
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Radio size={20} className={isScanning ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Veille Stock Fournisseurs</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-semibold border border-slate-700">
                  {supplierLinks.filter(s => s.is_in_stock).length}/{supplierLinks.length} Dispo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dernière vérification : {supplierLinks[0]?.last_checked ? new Date(supplierLinks[0].last_checked).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
              </p>
            </div>
          </div>

          <button
            onClick={runManualScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
          >
            <RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Scan en cours...' : 'Scanner maintenant'}
          </button>
        </div>
      )}

      {/* KPI EN-TÊTE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-3 text-slate-300 mb-1 text-sm font-medium"><Package size={18} className="text-indigo-400" /> Bobines en stock</div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalSpools} unités</div>
        </div>
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-3 text-slate-300 mb-1 text-sm font-medium"><TrendingUp size={18} className="text-emerald-400" /> Valeur de revient du stock</div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{totalStockValue.toFixed(2)} €</div>
        </div>
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-3 text-slate-300 mb-1 text-sm font-medium"><AlertTriangle size={18} className="text-amber-400" /> Alertes stock bas</div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{products.filter((p) => getProductStock(p.id) <= p.min_stock_alert).length} référence(s)</div>
        </div>
      </div>

      {/* FORMULAIRES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. CRÉATION PRODUIT */}
        <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-700/80 space-y-4 shadow-md">
          <h2 className="text-base font-bold flex items-center gap-2 text-indigo-300"><Plus size={18} /> 1. Créer une référence</h2>
          <form onSubmit={addProduct} className="space-y-3">
            <input
              type="text"
              placeholder="Marque / Format (ex: Anycubic, Cailab 200G)"
              className="w-full bg-slate-950 border border-slate-700/80 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 text-white placeholder:text-slate-500"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="bg-slate-950 border border-slate-700/80 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 text-white font-medium"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              >
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
                <option value="ABS">ABS</option>
                <option value="TPU">TPU</option>
              </select>
              <input
                type="text"
                placeholder="Couleur (ex: Rouge)"
                className="bg-slate-950 border border-slate-700/80 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 text-white placeholder:text-slate-500"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
              />
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="Prix de vente conseillé (€)"
              className="w-full bg-slate-950 border border-slate-700/80 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 text-white placeholder:text-slate-500 font-mono"
              value={defaultSellPrice || ''}
              onChange={(e) => setDefaultSellPrice(Number(e.target.value))}
            />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-2.5 rounded-xl transition text-white shadow-md shadow-indigo-600/30">
              Créer l'article
            </button>
          </form>
        </div>

        {/* 2. ACHAT MULTI-LIGNES */}
        <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-700/80 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2 text-cyan-300">
              <ArrowDownLeft size={18} /> 2. Enregistrer un achat
            </h2>
            {currentPurchaseTotal > 0 && (
              <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-500/15 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                Total : {currentPurchaseTotal.toFixed(2)} €
              </span>
            )}
          </div>

          <form onSubmit={recordMultiPurchase} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                className="bg-slate-950 border border-slate-700/80 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-400 text-white font-medium"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                <option value="Joybuy">Joybuy</option>
                <option value="AliExpress">AliExpress</option>
                <option value="Amazon">Amazon</option>
                <option value="Direct / Autre">Autre</option>
              </select>
              <input
                type="date"
                className="bg-slate-950 border border-slate-700/80 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-400 text-white font-mono"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {purchaseLines.map((line, idx) => {
                const selectedProd = products.find((p) => p.id === line.productId);
                const colorHex = selectedProd ? getColorHex(selectedProd.color) : { bg: '#6366f1', border: '#4338ca' };
                const stockQty = selectedProd ? getProductStock(selectedProd.id) : 0;
                const cumpVal = selectedProd ? getProductCUMP(selectedProd) : 0;
                const joybuyStatus = selectedProd ? getJoybuyStatus(selectedProd) : { isJoybuy: false, inStock: false };

                return (
                  <div key={idx} className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                      <select
                        className="w-full bg-slate-900 border border-slate-700/80 p-2 rounded-lg text-xs outline-none focus:border-cyan-400 text-white font-medium"
                        value={line.productId}
                        onChange={(e) => handlePurchaseLineProductChange(idx, e.target.value)}
                      >
                        <option value="">Sélectionner une bobine reçue...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.material}] {p.brand} - {p.color}
                          </option>
                        ))}
                      </select>
                      {purchaseLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePurchaseLine(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                          title="Supprimer la ligne"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {selectedProd && (
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span 
                            style={{
                              display: 'inline-block',
                              width: '14px',
                              height: '14px',
                              minWidth: '14px',
                              minHeight: '14px',
                              borderRadius: '9999px',
                              backgroundColor: colorHex.bg,
                              border: `2px solid ${colorHex.border}`,
                              boxShadow: '0 0 5px rgba(0,0,0,0.6)'
                            }}
                          />
                          <span className="text-slate-200 font-semibold">{selectedProd.color}</span>
                          
                          {joybuyStatus.isJoybuy && (
                            joybuyStatus.inStock ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded">
                                Dispo Joybuy
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded">
                                Rupture Joybuy
                              </span>
                            )
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-300">Stock : <strong className="text-cyan-400 font-mono">{stockQty}</strong></span>
                          <span className="text-slate-400 font-mono">CUMP {cumpVal.toFixed(2)}€</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qté"
                        className="bg-slate-900 border border-slate-700/80 p-2 rounded-lg text-xs outline-none focus:border-cyan-400 text-white font-mono"
                        value={line.quantity}
                        onChange={(e) => handlePurchaseLineQuantityChange(idx, Number(e.target.value))}
                        disabled={!line.productId}
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Coût unit. (€)"
                        className="bg-slate-900 border border-slate-700/80 p-2 rounded-lg text-xs outline-none focus:border-cyan-400 text-white font-mono"
                        value={line.unitCost || ''}
                        onChange={(e) => handlePurchaseLineCostChange(idx, Number(e.target.value))}
                        disabled={!line.productId}
                        required
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addEmptyPurchaseLine}
              className="w-full text-xs py-2 border border-dashed border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-400 rounded-xl transition flex items-center justify-center gap-1 font-medium"
            >
              <Plus size={14} /> Ajouter une bobine reçue
            </button>

            <button 
              type="submit" 
              className="w-full bg-cyan-600 hover:bg-cyan-500 font-bold py-2.5 rounded-xl transition text-white shadow-md shadow-cyan-600/30"
            >
              Entrer le lot en stock (+ CUMP)
            </button>
          </form>
        </div>

        {/* 3. VENTE MULTI-LIGNES */}
        <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-700/80 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2 text-emerald-300">
              <ShoppingCart size={18} /> 3. Enregistrer une vente
            </h2>
            {currentSaleTotal > 0 && (
              <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                Total : {currentSaleTotal.toFixed(2)} €
              </span>
            )}
          </div>

          <form onSubmit={recordMultiSale} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                className="bg-slate-950 border border-slate-700/80 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-400 text-white font-medium"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="Leboncoin">Leboncoin</option>
                <option value="Vinted">Vinted</option>
                <option value="Facebook Marketplace">Facebook</option>
                <option value="Vente Directe">Direct</option>
              </select>
              <input
                type="date"
                className="bg-slate-950 border border-slate-700/80 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-400 text-white font-mono"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {saleLines.map((line, idx) => {
                const selectedProd = products.find((p) => p.id === line.productId);
                const colorHex = selectedProd ? getColorHex(selectedProd.color) : { bg: '#6366f1', border: '#4338ca' };
                const stockQty = selectedProd ? getProductStock(selectedProd.id) : 0;
                const cumpVal = selectedProd ? getProductCUMP(selectedProd) : 0;
                const saleJoybuy = selectedProd ? getJoybuyStatus(selectedProd) : { isJoybuy: false, inStock: false };

                return (
                  <div key={idx} className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                      <select
                        className="w-full bg-slate-900 border border-slate-700/80 p-2 rounded-lg text-xs outline-none focus:border-emerald-400 text-white font-medium"
                        value={line.productId}
                        onChange={(e) => handleLineProductChange(idx, e.target.value)}
                      >
                        <option value="">Sélectionner une bobine...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.material}] {p.brand} - {p.color}
                          </option>
                        ))}
                      </select>
                      {saleLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSaleLine(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                          title="Supprimer la ligne"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {selectedProd && (
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span 
                            style={{
                              display: 'inline-block',
                              width: '14px',
                              height: '14px',
                              minWidth: '14px',
                              minHeight: '14px',
                              borderRadius: '9999px',
                              backgroundColor: colorHex.bg,
                              border: `2px solid ${colorHex.border}`,
                              boxShadow: '0 0 5px rgba(0,0,0,0.6)'
                            }}
                          />
                          <span className="text-slate-200 font-semibold">{selectedProd.color}</span>
                          
                          {saleJoybuy.isJoybuy && (
                            saleJoybuy.inStock ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded">
                                Dispo Joybuy
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded">
                                Rupture Joybuy
                              </span>
                            )
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {stockQty > 0 ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                              <CheckCircle2 size={11} /> {stockQty} en stock
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30">
                              <AlertCircle size={11} /> Rupture
                            </span>
                          )}
                          <span className="text-slate-400 font-mono">CUMP {cumpVal.toFixed(2)}€</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qté"
                        className="bg-slate-900 border border-slate-700/80 p-2 rounded-lg text-xs outline-none focus:border-emerald-400 text-white font-mono"
                        value={line.quantity}
                        onChange={(e) => handleLineQuantityChange(idx, Number(e.target.value))}
                        disabled={!line.productId}
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Prix unit. (€)"
                        className="bg-slate-900 border border-slate-700/80 p-2 rounded-lg text-xs outline-none focus:border-emerald-400 text-white font-mono font-bold text-emerald-400"
                        value={line.unitPrice || ''}
                        onChange={(e) => handleLinePriceChange(idx, Number(e.target.value))}
                        disabled={!line.productId}
                        required
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addEmptySaleLine}
              className="w-full text-xs py-2 border border-dashed border-slate-700 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-400 rounded-xl transition flex items-center justify-center gap-1 font-medium"
            >
              <Plus size={14} /> Ajouter une bobine supplémentaire
            </button>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2.5 rounded-xl transition text-white shadow-md shadow-emerald-600/30"
            >
              Valider la vente du lot
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
