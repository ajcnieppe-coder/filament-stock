'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { 
  Package, ShoppingCart, TrendingUp, AlertTriangle, Plus, 
  ArrowDownLeft, LayoutDashboard, Boxes, BarChart3, DollarSign, Wallet, ArrowDownRight,
  Lock, KeyRound, LogOut, Trash2, Edit2, History, X, Check, PieChart, Percent, Tag,
  Sparkles, Copy, ExternalLink
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'history' | 'stats' | 'leboncoin'>('dashboard');
  const [historySubTab, setHistorySubTab] = useState<'purchases' | 'sales'>('purchases');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
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

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Référence
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('');
  const [defaultSellPrice, setDefaultSellPrice] = useState(0);

  // 2. Achat
  const [restockProduct, setRestockProduct] = useState('');
  const [restockQty, setRestockQty] = useState(1);
  const [restockCost, setRestockCost] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(todayStr);

  // 3. Vente Multi-lignes
  const [platform, setPlatform] = useState('Leboncoin');
  const [saleDate, setSaleDate] = useState(todayStr);
  const [saleLines, setSaleLines] = useState<SaleLine[]>([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);

  // 4. Générateur Leboncoin
  const [lbcProductId, setLbcProductId] = useState<string>('');
  const [lbcPrice, setLbcPrice] = useState<string>('15');
  const [lbcCondition, setLbcCondition] = useState<string>('Neuf sous blister');
  const [lbcShipping, setLbcShipping] = useState<boolean>(true);
  const [lbcPickup, setLbcPickup] = useState<boolean>(true);
  const [lbcCity, setLbcCity] = useState<string>('Nieppe (59850)');
  const [lbcNotes, setLbcNotes] = useState<string>("Stocké au sec sous sachet déshydratant.");
  const [copiedLbcTitle, setCopiedLbcTitle] = useState<boolean>(false);
  const [copiedLbcBody, setCopiedLbcBody] = useState<boolean>(false);

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

  function handleLogout() {
    localStorage.removeItem('filament_app_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
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

      const { data: items } = await supabase
        .from('sales_items')
        .select('*');

      const { data: orders } = await supabase
        .from('sales_orders')
        .select('*');

      const { data: purchaseItems } = await supabase
        .from('purchase_items')
        .select('*');

      const { data: purchaseOrders } = await supabase
        .from('purchase_orders')
        .select('*');

      if (prodData) {
        setProducts(prodData);
        if (prodData.length > 0 && !lbcProductId) {
          setLbcProductId(prodData[0].id);
          setLbcPrice(prodData[0].default_sell_price ? String(prodData[0].default_sell_price) : '15');
        }
      }

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
              created_at: ord?.created_at || item.created_at
            }
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

  // Calculs automatiques
  function getProductPurchased(productId: string) {
    return purchases
      .filter((p) => p.product_id === productId)
      .reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  }

  function getProductSold(productId: string) {
    return sales
      .filter((s) => (s.product_id || s.product?.id) === productId)
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

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('products').insert([
      { brand, material, color, stock_quantity: 0, avg_buy_price: 0, default_sell_price: Number(defaultSellPrice) },
    ]);
    if (error) {
      alert("Erreur création produit : " + error.message);
    } else {
      setBrand('');
      setColor('');
      setDefaultSellPrice(0);
      fetchData();
    }
  }

  async function recordRestock(e: React.FormEvent) {
    e.preventDefault();
    if (!restockProduct) return;

    const formattedDate = new Date(purchaseDate + "T12:00:00Z").toISOString();

    const { data: order, error: orderErr } = await supabase
      .from('purchase_orders')
      .insert([{ supplier: supplier || 'Fournisseur direct', created_at: formattedDate }])
      .select()
      .single();

    if (orderErr || !order) {
      alert("Erreur Achat (Order) : " + orderErr?.message);
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
      alert("Erreur Achat (Item) : " + itemErr.message);
      return;
    }

    alert("Achat enregistré avec succès !");
    setRestockQty(1);
    setRestockCost(0);
    setSupplier('');
    fetchData();
  }

  function handleLineProductChange(index: number, newProductId: string) {
    const nextLines = [...saleLines];
    const targetProd = products.find((p) => p.id === newProductId);

    nextLines[index] = {
      ...nextLines[index],
      productId: newProductId,
      unitPrice: targetProd ? targetProd.default_sell_price : nextLines[index].unitPrice,
    };

    if (newProductId && index === nextLines.length - 1) {
      nextLines.push({ productId: '', quantity: 1, unitPrice: 0 });
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
      setSaleLines([{ productId: '', quantity: 1, unitPrice: 0 }]);
      return;
    }
    setSaleLines(saleLines.filter((_, i) => i !== index));
  }

  function addEmptySaleLine() {
    setSaleLines([...saleLines, { productId: '', quantity: 1, unitPrice: 0 }]);
  }

  async function recordMultiSale(e: React.FormEvent) {
    e.preventDefault();

    const validLines = saleLines.filter((l) => l.productId && l.productId !== '');
    if (validLines.length === 0) {
      alert("Veuillez sélectionner au moins une bobine vendue !");
      return;
    }

    const formattedDate = new Date(saleDate + "T12:00:00Z").toISOString();

    const { data: order, error: orderErr } = await supabase
      .from('sales_orders')
      .insert([{ platform, created_at: formattedDate }])
      .select()
      .single();

    if (orderErr || !order) {
      alert("Erreur Vente (Order) : " + orderErr?.message);
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
      alert("Erreur Vente (Items) : " + itemsErr.message);
      return;
    }

    alert(`${validLines.length} bobine(s) enregistrée(s) avec succès !`);
    setSaleLines([{ productId: '', quantity: 1, unitPrice: 0 }]);
    fetchData();
  }

  // Actions d'édition
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

    const formattedDate = new Date(editPurchaseDate + "T12:00:00Z").toISOString();

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
    if (!confirm("Voulez-vous vraiment supprimer cet achat ? Le stock sera automatiquement recalculé.")) return;
    const { error } = await supabase.from('purchase_items').delete().eq('id', id);
    if (error) alert("Erreur suppression : " + error.message);
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

    const formattedDate = new Date(editSaleDate + "T12:00:00Z").toISOString();

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
      alert("Erreur lors de la modification de la vente : " + error.message);
    } else {
      setEditingSale(null);
      fetchData();
    }
  }

  async function deleteSale(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer cette vente ? Le stock sera automatiquement recalculé.")) return;
    const { error } = await supabase.from('sales_items').delete().eq('id', id);
    if (error) alert("Erreur suppression : " + error.message);
    else fetchData();
  }

  // Fonctions de génération Leboncoin
  const selectedLbcProduct = products.find((p) => p.id === lbcProductId);

  const generateLbcTitle = () => {
    if (!selectedLbcProduct) return 'Bobine Filament 3D';
    return `Bobine Filament 3D ${selectedLbcProduct.material} ${selectedLbcProduct.brand} - ${selectedLbcProduct.color}`.replace(/\s+/g, ' ').trim();
  };

  const generateLbcDescription = () => {
    if (!selectedLbcProduct) return '';
    const currentStock = getProductStock(selectedLbcProduct.id);

    return `Bonjour,

Je vends cette bobine de filament pour imprimante 3D :

🔹 CARACTÉRISTIQUES :
• Marque : ${selectedLbcProduct.brand}
• Type de filament : ${selectedLbcProduct.material} (Diamètre standard 1.75mm)
• Couleur : ${selectedLbcProduct.color}
• État : ${lbcCondition}
• Stock disponible : ${currentStock} unité(s)

💡 INFOS COMPLÉMENTAIRES :
• ${lbcNotes}
• Excellente adhérence au plateau et rendu très propre.
• Compatible avec toutes les imprimantes 3D FDM (Anycubic, Bambu Lab, Creality, Elegoo, Sovol, etc.).

📦 LIVRAISON & REMISE :
${lbcPickup ? `• Remise en main propre possible sur ${lbcCity}.` : ''}
${lbcShipping ? '• Envoi soigné et rapide possible via Leboncoin (Mondial Relay, Colissimo, Shop2Shop).' : ''}

N'hésitez pas à me contacter si vous souhaitez grouper avec d'autres bobines pour réduire les frais de port !`;
  };

  const handleCopyLbcTitle = async () => {
    await navigator.clipboard.writeText(generateLbcTitle());
    setCopiedLbcTitle(true);
    setTimeout(() => setCopiedLbcTitle(false), 2000);
  };

  const handleCopyLbcBody = async () => {
    await navigator.clipboard.writeText(generateLbcDescription());
    setCopiedLbcBody(true);
    setTimeout(() => setCopiedLbcBody(false), 2000);
  };

  // Écran de verrouillage
  if (!isAuthenticated && appPassword) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
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

  // Totaux calculés automatiquement
  const totalStockValue = products.reduce((acc, p) => acc + (getProductStock(p.id) * getProductCUMP(p)), 0);
  const totalSpools = products.reduce((acc, p) => acc + getProductStock(p.id), 0);
  const categories = Array.from(new Set(products.map((p) => p.material)));

  const totalStockValueSellingPrice = products.reduce((acc, p) => {
    const stock = getProductStock(p.id);
    return acc + (stock > 0 ? stock * Number(p.default_sell_price || 0) : 0);
  }, 0);

  // Ventes & Trésorerie
  const totalRevenue = sales.reduce((acc, s) => acc + s.quantity * s.unit_sell_price, 0);
  const totalCostSold = sales.reduce((acc, s) => acc + s.quantity * s.unit_cost_snapshot, 0);
  const totalProfit = totalRevenue - totalCostSold;
  const totalSpoolsSold = sales.reduce((acc, s) => acc + s.quantity, 0);
  
  const avgMarginPerSpool = totalSpoolsSold > 0 ? (totalProfit / totalSpoolsSold) : 0;
  const globalMarginPercent = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  const totalSpentPurchases = purchases.reduce((acc, p) => acc + (p.quantity * p.unit_cost), 0);
  const totalSpoolsPurchased = purchases.reduce((acc, p) => acc + p.quantity, 0);
  const netCashFlow = totalRevenue - totalSpentPurchases;

  // Camembert 1 : Recettes par Matériau (PLA vs PETG vs autres)
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

  // Camembert 2 : Couleurs VENDUES en PLA
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

  // Camembert 3 : Couleurs VENDUES en PETG
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

  // Recettes par date
  const salesByDate: { [key: string]: number } = {};
  sales.forEach((s) => {
    const d = (s.order?.created_at || s.created_at).split('T')[0];
    salesByDate[d] = (salesByDate[d] || 0) + (s.quantity * s.unit_sell_price);
  });
  const dateEntries = Object.entries(salesByDate).sort(([a], [b]) => a.localeCompare(b));
  const maxDayRevenue = Math.max(...Object.values(salesByDate), 1);

  const currentSaleTotal = saleLines
    .filter((l) => l.productId)
    .reduce((sum, l) => sum + (Number(l.quantity || 0) * Number(l.unitPrice || 0)), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Package className="text-indigo-400 w-7 h-7" /> Gestion Stock Filament 3D
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap bg-slate-900 p-1.5 rounded-xl border border-slate-800 gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard size={16} /> Actions & Achats
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'stock' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Boxes size={16} /> État des stocks
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <History size={16} /> Journaux
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 size={16} /> Statistiques
              </button>
              <button
                onClick={() => setActiveTab('leboncoin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'leboncoin' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={16} className="text-amber-400" /> Annonces Leboncoin
              </button>
            </div>
            {appPassword && (
              <button
                onClick={handleLogout}
                title="Verrouiller la session"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl text-slate-400 hover:text-rose-400 transition"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>

        {/* ================= ONGLET 1 : ACTIONS ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3 text-slate-400 mb-1 text-sm"><Package size={18} className="text-indigo-400" /> Bobines en stock</div>
                <div className="text-2xl font-bold text-white">{totalSpools} unités</div>
              </div>
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3 text-slate-400 mb-1 text-sm"><TrendingUp size={18} className="text-emerald-400" /> Valeur de revient du stock</div>
                <div className="text-2xl font-bold text-emerald-400">{totalStockValue.toFixed(2)} €</div>
              </div>
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3 text-slate-400 mb-1 text-sm"><AlertTriangle size={18} className="text-amber-400" /> Alertes stock bas</div>
                <div className="text-2xl font-bold text-amber-400">{products.filter((p) => getProductStock(p.id) <= p.min_stock_alert).length} référence(s)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Créer Référence */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
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

              {/* 2. Enregistrer un Achat */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2 text-cyan-300"><ArrowDownLeft size={18} /> 2. Enregistrer un achat</h2>
                <form onSubmit={recordRestock} className="space-y-3">
                  <select
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
                    value={restockProduct}
                    onChange={(e) => setRestockProduct(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner la bobine reçue...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.material}] {p.brand} - {p.color} (Actuel: {getProductStock(p.id)})
                      </option>
                    ))}
                  </select>
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
                      className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
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
                    <input
                      type="text"
                      placeholder="Fournisseur (optionnel)"
                      className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-cyan-500 text-white"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 font-semibold py-2.5 rounded-xl transition text-white">
                    Entrer en stock (+ CUMP)
                  </button>
                </form>
              </div>

              {/* 3. Enregistrer une Vente Multi-bobines */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-2 text-emerald-300">
                    <ShoppingCart size={18} /> 3. Enregistrer une vente
                  </h2>
                  {currentSaleTotal > 0 && (
                    <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
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

                      return (
                        <div key={idx} className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/90 space-y-2">
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
                                  [{p.material}] {p.brand} - {p.color} (Stock: {getProductStock(p.id)})
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
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 pl-4">
                              <span 
                                className="w-2.5 h-2.5 rounded-full border shadow-sm flex-shrink-0"
                                style={{ backgroundColor: cStyle?.dot, borderColor: cStyle?.border }}
                              />
                              <span>Stock dispo : <strong className="text-slate-200">{getProductStock(selectedProd.id)}</strong></span>
                              <span className="ml-auto font-mono text-slate-500">CUMP : {getProductCUMP(selectedProd).toFixed(2)} €</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 pl-4">
                            <input
                              type="number"
                              min="1"
                              placeholder="Qté"
                              className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs outline-none focus:border-emerald-500 text-white"
                              value={line.quantity}
                              onChange={(e) => handleLineQuantityChange(idx, Number(e.target.value))}
                              disabled={!line.productId}
                            />
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Prix unit. (€)"
                              className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs outline-none focus:border-emerald-500 text-white font-mono"
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
        )}

        {/* ================= ONGLET 2 : ÉTAT DES STOCKS ================= */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
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
        )}

        {/* ================= ONGLET 3 : JOURNAUX ACHATS & VENTES ================= */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit gap-1">
              <button
                onClick={() => setHistorySubTab('purchases')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  historySubTab === 'purchases' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft size={16} /> Journal des Achats ({purchases.length})
              </button>
              <button
                onClick={() => setHistorySubTab('sales')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
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
                        const totalCost = (p.quantity * p.unit_cost);

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
          </div>
        )}

        {/* ================= ONGLET 4 : STATISTIQUES ================= */}
        {activeTab === 'stats' && (
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

            {/* 3. GRAPHIQUES CAMEMBERTS SUR LES VENTES */}
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
        )}

        {/* ================= ONGLET 5 : ANNONCES LEBONCOIN ================= */}
        {activeTab === 'leboncoin' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="text-amber-400" size={20} /> Générateur d'Annonces Leboncoin & Vinted
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Sélectionne une référence de ton stock pour générer instantanément un titre percutant et une description prête à copier.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Paramètres de l'annonce */}
              <div className="lg:col-span-5 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    1. Sélectionner la bobine
                  </label>
                  <select
                    value={lbcProductId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setLbcProductId(newId);
                      const targetP = products.find((p) => p.id === newId);
                      if (targetP && targetP.default_sell_price) {
                        setLbcPrice(String(targetP.default_sell_price));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.material}] {p.brand} - {p.color} (Stock: {getProductStock(p.id)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Prix de vente (€)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={lbcPrice}
                      onChange={(e) => setLbcPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      État
                    </label>
                    <select
                      value={lbcCondition}
                      onChange={(e) => setLbcCondition(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 text-white"
                    >
                      <option value="Neuf sous blister">Neuf sous blister</option>
                      <option value="Entamé / Très bon état">Entamé / TBE</option>
                      <option value="Ouvert pour test">Ouvert pour test</option>
                      <option value="Fin de bobine">Fin de bobine</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Ville pour remise en main propre
                  </label>
                  <input
                    type="text"
                    value={lbcCity}
                    onChange={(e) => setLbcCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Note / Précision stockage
                  </label>
                  <input
                    type="text"
                    value={lbcNotes}
                    onChange={(e) => setLbcNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 text-white"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={lbcPickup}
                      onChange={(e) => setLbcPickup(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    Remise en main propre
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={lbcShipping}
                      onChange={(e) => setLbcShipping(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    Envoi possible
                  </label>
                </div>
              </div>

              {/* Rendu Textes Générés */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag size={14} className="text-indigo-400" /> Titre de l'annonce
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLbcTitle}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition cursor-pointer"
                    >
                      {copiedLbcTitle ? <Check size={13} /> : <Copy size={13} />}
                      {copiedLbcTitle ? 'Titre copié !' : 'Copier le titre'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-bold text-sm text-white">
                    {generateLbcTitle()}
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={14} className="text-indigo-400" /> Texte de l'annonce
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLbcBody}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      {copiedLbcBody ? <Check size={14} /> : <Copy size={14} />}
                      {copiedLbcBody ? 'Texte copié !' : 'Copier la description'}
                    </button>
                  </div>

                  <textarea
                    readOnly
                    rows={13}
                    value={generateLbcDescription()}
                    className="w-full p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-200 font-mono resize-none focus:outline-none"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400 font-medium">
                      Prix conseillé : <strong className="text-emerald-400 font-mono text-sm">{lbcPrice} €</strong>
                    </span>
                    <a
                      href="https://www.leboncoin.fr/deposer-une-annonce"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition"
                    >
                      Ouvrir Leboncoin <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

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