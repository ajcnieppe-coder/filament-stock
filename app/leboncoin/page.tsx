'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Sparkles, Tag, Package, Copy, Check, ExternalLink 
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
}

interface SaleItem {
  id: string;
  product_id?: string;
  quantity: number;
}

export default function LeboncoinPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState<string>('');
  const [price, setPrice] = useState<string>('10');

  const [copiedTitle, setCopiedTitle] = useState<boolean>(false);
  const [copiedBody, setCopiedBody] = useState<boolean>(false);

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
      const { data: purchaseItems } = await supabase.from('purchase_items').select('id, product_id, quantity');

      if (prodData) {
        setProducts(prodData);
        if (prodData.length > 0) {
          setProductId(prodData[0].id);
          setPrice(prodData[0].default_sell_price ? String(prodData[0].default_sell_price) : '10');
        }
      }
      if (purchaseItems) setPurchases(purchaseItems);
      if (items) setSales(items);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function getProductPurchased(pId: string) {
    return purchases
      .filter((p) => p.product_id === pId)
      .reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  }

  function getProductSold(pId: string) {
    return sales
      .filter((s) => s.product_id === pId)
      .reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  }

  function getProductStock(pId: string) {
    return getProductPurchased(pId) - getProductSold(pId);
  }

  const selectedProduct = products.find((p) => p.id === productId);

  const generateTitle = () => {
    if (!selectedProduct) return 'Bobine Filament 3D';
    return `Bobine Filament 3D ${selectedProduct.material} ${selectedProduct.brand} - ${selectedProduct.color}`.replace(/\s+/g, ' ').trim();
  };

  const generateDescription = () => {
    if (!selectedProduct) return '';

    return `Vends bobine ${selectedProduct.brand} ${selectedProduct.material} ${selectedProduct.color} compatible pour toutes les imprimantes 3D (Anycubic, Bambu Lab, Creality etc).

🔹 CARACTÉRISTIQUES :
• Marque : ${selectedProduct.brand}
• Type de filament : ${selectedProduct.material} (Diamètre standard 1.75mm)
• Couleur : ${selectedProduct.color}
• État : Neuf sous blister

Possibilité de faire des lots différents et panacher les couleurs si besoin. J'ai du PLA et du PETG sur mon compte.
Toutes les bobines sur mon compte sont à 10€ l'unité, même en lot.

Envoi rapide via Mondial Relay avec l'achat protégé sur Leboncoin ou remise en main propre chez moi à Nieppe.

Pour toute question, n'hésitez pas !`;
  };

  const handleCopyTitle = async () => {
    await navigator.clipboard.writeText(generateTitle());
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyBody = async () => {
    await navigator.clipboard.writeText(generateDescription());
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 text-sm animate-pulse">Chargement du générateur d'annonces...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="text-amber-400" size={20} /> Générateur d'Annonces Leboncoin & Vinted
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Sélectionne une référence de ton stock pour générer la description prête à copier.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulaire des paramètres */}
        <div className="lg:col-span-5 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              1. Sélectionner la bobine
            </label>
            <select
              value={productId}
              onChange={(e) => {
                const newId = e.target.value;
                setProductId(newId);
                const targetP = products.find((p) => p.id === newId);
                if (targetP && targetP.default_sell_price) {
                  setPrice(String(targetP.default_sell_price));
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

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Prix de vente conseillé (€)
            </label>
            <input
              type="number"
              step="0.5"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 text-white font-mono"
            />
          </div>
        </div>

        {/* Textes générés avec copie rapide */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={14} className="text-indigo-400" /> Titre de l'annonce
              </span>
              <button
                type="button"
                onClick={handleCopyTitle}
                className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition cursor-pointer"
              >
                {copiedTitle ? <Check size={13} /> : <Copy size={13} />}
                {copiedTitle ? 'Titre copié !' : 'Copier le titre'}
              </button>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-bold text-sm text-white">
              {generateTitle()}
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} className="text-indigo-400" /> Texte de l'annonce
              </span>
              <button
                type="button"
                onClick={handleCopyBody}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {copiedBody ? <Check size={14} /> : <Copy size={14} />}
                {copiedBody ? 'Texte copié !' : 'Copier la description'}
              </button>
            </div>

            <textarea
              readOnly
              rows={13}
              value={generateDescription()}
              className="w-full p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-200 font-mono resize-none focus:outline-none"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-medium">
                Prix conseillé : <strong className="text-emerald-400 font-mono text-sm">{price} €</strong>
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
  );
}