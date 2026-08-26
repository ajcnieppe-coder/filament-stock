'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { 
  Package, ShoppingCart, TrendingUp, AlertTriangle, Plus, 
  ArrowDownLeft, Lock, KeyRound, Trash2, CheckCircle2, AlertCircle
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

interface SaleLine {
  productId: string;
  quantity: number;
  unitPrice: number;
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

export default function ActionsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [supplierLinks, setSupplierLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('');
  const [defaultSellPrice, setDefaultSellPrice] = useState(10);

  const [restockProduct, setRestockProduct] = useState('');
  const [restockQty, setRestockQty] = useState(1);
  const [restockCost, setRestockCost] = useState(0);
  const [supplier, setSupplier] = useState('Joybuy');
  const [purchaseDate, setPurchaseDate] = useState(todayStr);

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

  // Vérifie si la référence est spécifiquement issue/liée à Joybuy
  function isJoybuyProduct(product: Product) {
    const hasJoybuyLink = supplierLinks.some(l => 
      l.supplier_name.toLowerCase().includes('joybuy') && 
      (l.product_id === product.id || (product.brand.toLowerCase() === 'anycubic' && product.material.toUpperCase() === 'PETG'))
    );
    if (hasJoybuyLink) return true;

    const prodPurchases = purchases.filter((p) => p.product_id === product.id);
    if (prodPurchases.length > 0) {
      const lastSup = prodPurchases[prodPurchases.length - 1].order?.supplier?.toLowerCase() || '';
      return lastSup.includes('joybuy');
    }

    return product.brand.toLowerCase() === 'anycubic' && product.material.toUpperCase() === 'PETG';
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

  async function recordRestock(e: React.FormEvent) {
    e.preventDefault();
    if (!restockProduct) return;

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

    const { error: itemErr } = await supabase.from('purchase_items').insert([
      {
        purchase_order_id: order.id,
        product_id: restockProduct,
        quantity: Number(restockQty),
        unit_cost: Number(restockCost),
        created_at: formattedDate
      },
    ]);

    if (itemErr) {
      alert('Erreur Achat (Item) : ' + itemErr.message);
      return;
    }

    alert('Achat enregistré avec succès !');
    setRestockQty(1);
    setRestockCost(0);
    fetchData();
  }

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
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
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
                  className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 rounded-xl text-white text-sm outline-none focus:border-indigo-500 transition"
                  autoFocus
                />
                <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              </div>
              {authError && <p className="text-rose-400 text-xs mt-2 font-medium">{authError}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
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
  const currentSaleTotal = saleLines
    .filter((l) => l.productId)
    .reduce((sum, l) => sum + (Number(l.quantity || 0) * Number(l.unitPrice || 0)), 0);

  const selectedRestockProd = products.find((p) => p.id === restockProduct);
  const selectedRestockStyle = selectedRestockProd ? getColorStyle(selectedRestockProd.color) : null;
  const selectedRestockStock = selectedRestockProd ? getProductStock(selectedRestockProd.id) : 0;
  const selectedRestockCump = selectedRestockProd ? getProductCUMP(selectedRestockProd) : 0;
  const isJoybuyRestock = selectedRestockProd ? isJoybuyProduct(selectedRestockProd) : false;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 text-slate-400 mb-1 text-sm"><Package size={18} className="text-indigo-400" /> Bobines en stock</div>
          <div className="text-2xl font-bold text-white">{totalSpools} unités</div>
        </div>
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 text-slate-400 mb-1 text-sm"><TrendingUp size={18} className="text-emerald-400" /> Valeur de revient du stock</div>
          <div className="text-2xl font-bold text-emerald-400">{totalStockValue.toFixed(2)} €</div>
        </div>
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 text-slate-400 mb-1 text-sm"><AlertTriangle size={18} className="text-amber-400" /> Alertes stock bas</div>
          <div className="text-2xl font-bold text-amber-400">{products.filter((p) => getProductStock(p.id) <= p.min_stock_alert).length} référence(s)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. CRÉATION PRODUIT */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
          <h2 className="text-base font-bold flex items-center gap-2 text-indigo-300"><Plus size={18} /> 1. Créer une référence</h2>
          <form onSubmit={addProduct} className="space-y-3">
            <input
              type="text"
              placeholder="Marque / Format (ex: Anycubic, Cailab 200G)"
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 text-white"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 text-white"
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
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 text-white"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
              />
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="Prix de vente conseillé (€)"
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 text-white"
              value={defaultSellPrice || ''}
              onChange={(e) => setDefaultSellPrice(Number(e.target.value))}
            />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-2.5 rounded-xl transition text-white">
              Créer l'article
            </button>
          </form>
        </div>

        {/* 2. ACHAT */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
          <h2 className="text-base font-bold flex items-center gap-2 text-cyan-300"><ArrowDownLeft size={18} /> 2. Enregistrer un achat</h2>
          <form onSubmit={recordRestock} className="space-y-3">
            <select
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
              value={restockProduct}
              onChange={(e) => {
                const pId = e.target.value;
                setRestockProduct(pId);
                const targetP = products.find(p => p.id === pId);
                if (targetP && isJoybuyProduct(targetP)) {
                  setSupplier('Joybuy');
                }
              }}
              required
            >
              <option value="">Sélectionner la bobine reçue...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.material}] {p.brand} - {p.color}
                </option>
              ))}
            </select>

            {/* BADGE D'INFO PRODUIT SÉLECTIONNÉ */}
            {selectedRestockProd && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: selectedRestockStyle?.dot, borderColor: selectedRestockStyle?.border }}
                    />
                    <span className="font-semibold text-white">
                      {selectedRestockProd.material} {selectedRestockProd.color}
                    </span>
                  </div>

                  {/* BADGE UNIQUEMENT POUR JOYBUY */}
                  {isJoybuyRestock && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      🟡 Joybuy
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-400 border-t border-slate-900 pt-1.5 text-[11px]">
                  <span>Stock actuel : <strong className="text-cyan-400 font-mono">{selectedRestockStock}</strong></span>
                  <span>CUMP actuel : <strong className="text-slate-300 font-mono">{selectedRestockCump.toFixed(2)} €</strong></span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1"
                placeholder="Quantité"
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Coût unit. (€)"
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white font-mono"
                value={restockCost || ''}
                onChange={(e) => setRestockCost(Number(e.target.value))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
              <select
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                <option value="Joybuy">Joybuy</option>
                <option value="AliExpress">AliExpress</option>
                <option value="Amazon">Amazon</option>
                <option value="Direct / Autre">Autre</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 font-semibold py-2.5 rounded-xl transition text-white shadow-lg shadow-cyan-600/20">
              Entrer en stock (+ CUMP)
            </button>
          </form>
        </div>

        {/* 3. VENTE */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2 text-emerald-300">
              <ShoppingCart size={18} /> 3. Enregistrer une vente
            </h2>
            {currentSaleTotal > 0 && (
              <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Total : {currentSaleTotal.toFixed(2)} €
              </span>
            )}
          </div>

          <form onSubmit={recordMultiSale} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 text-white"
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
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 text-white"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {saleLines.map((line, idx) => {
                const selectedProd = products.find((p) => p.id === line.productId);
                const cStyle = selectedProd ? getColorStyle(selectedProd.color) : null;
                const stockQty = selectedProd ? getProductStock(selectedProd.id) : 0;
                const cumpVal = selectedProd ? getProductCUMP(selectedProd) : 0;
                const isJoybuy = selectedProd ? isJoybuyProduct(selectedProd) : false;

                return (
                  <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/90 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                      <select
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs outline-none focus:border-emerald-500 text-white"
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
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                          title="Supprimer la ligne"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {selectedProd && (
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800/80 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full border shadow-sm flex-shrink-0"
                            style={{ backgroundColor: cStyle?.dot, borderColor: cStyle?.border }}
                          />
                          <span className="text-slate-300 font-medium">{selectedProd.color}</span>
                          {isJoybuy && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                              Joybuy
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {stockQty > 0 ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                              <CheckCircle2 size={11} /> {stockQty} en stock
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                              <AlertCircle size={11} /> Rupture
                            </span>
                          )}
                          <span className="text-slate-500 font-mono">CUMP {cumpVal.toFixed(2)}€</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qté"
                        className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs outline-none focus:border-emerald-500 text-white"
                        value={line.quantity}
                        onChange={(e) => handleLineQuantityChange(idx, Number(e.target.value))}
                        disabled={!line.productId}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Prix unit. (€)"
                        className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs outline-none focus:border-emerald-500 text-white font-mono"
                        value={line.unitPrice || ''}
                        onChange={(e) => handleLinePriceChange(idx, Number(e.target.value))}
                        disabled={!line.productId}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addEmptySaleLine}
              className="w-full text-xs py-1.5 border border-dashed border-slate-700 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 rounded-xl transition flex items-center justify-center gap-1"
            >
              <Plus size={14} /> Ajouter une bobine supplémentaire
            </button>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold py-2.5 rounded-xl transition text-white shadow-lg shadow-emerald-600/20"
            >
              Valider la vente du lot
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}