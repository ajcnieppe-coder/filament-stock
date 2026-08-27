'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Sparkles, Tag, Package, Copy, Check, ExternalLink, Plus, Trash2, Layers, Box
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

interface BundleLine {
  productId: string;
  quantity: number;
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

export default function LeboncoinPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<'single' | 'bundle'>('bundle');
  const [bundleLines, setBundleLines] = useState<BundleLine[]>([
    { productId: '', quantity: 1 }
  ]);
  const [unitPrice, setUnitPrice] = useState<number>(10);
  const [customTotalPrice, setCustomTotalPrice] = useState<string>('');

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
          setBundleLines([{ productId: prodData[0].id, quantity: 1 }]);
          setUnitPrice(prodData[0].default_sell_price || 10);
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

  // Gestion des lignes du lot
  function handleProductChange(index: number, newProductId: string) {
    const next = [...bundleLines];
    next[index] = { ...next[index], productId: newProductId };
    if (newProductId && index === next.length - 1 && mode === 'bundle') {
      next.push({ productId: '', quantity: 1 });
    }
    setBundleLines(next);
  }

  function handleQuantityChange(index: number, qty: number) {
    const next = [...bundleLines];
    next[index].quantity = qty;
    setBundleLines(next);
  }

  function removeLine(index: number) {
    if (bundleLines.length === 1) {
      setBundleLines([{ productId: '', quantity: 1 }]);
      return;
    }
    setBundleLines(bundleLines.filter((_, i) => i !== index));
  }

  function addEmptyLine() {
    setBundleLines([...bundleLines, { productId: '', quantity: 1 }]);
  }

  // Bobines sélectionnées valides
  const selectedItems = bundleLines
    .filter((l) => l.productId)
    .map((l) => ({
      product: products.find((p) => p.id === l.productId)!,
      quantity: l.quantity,
    }))
    .filter((item) => item.product !== undefined);

  const totalQuantity = selectedItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const calculatedPrice = customTotalPrice !== '' ? Number(customTotalPrice) : totalQuantity * unitPrice;

  // Génération du titre
  const generateTitle = () => {
    if (selectedItems.length === 0) return 'Bobine Filament 3D';

    if (mode === 'single' || selectedItems.length === 1) {
      const item = selectedItems[0];
      const countStr = item.quantity > 1 ? `Lot ${item.quantity} Bobines` : 'Bobine';
      return `${countStr} Filament 3D ${item.product.material} ${item.product.brand} - ${item.product.color}`.trim();
    }

    // Extraction des marques et matériaux uniques
    const materials = Array.from(new Set(selectedItems.map((i) => i.product.material))).join(' / ');
    const brands = Array.from(new Set(selectedItems.map((i) => i.product.brand))).join(', ');
    const colors = selectedItems.map((i) => (i.quantity > 1 ? `${i.product.color} x${i.quantity}` : i.product.color)).join(', ');

    return `Lot ${totalQuantity} Bobines Filament 3D ${materials} ${brands} - ${colors}`.slice(0, 80);
  };

  // Génération de la description
  const generateDescription = () => {
    if (selectedItems.length === 0) return '';

    if (mode === 'single' || (selectedItems.length === 1 && selectedItems[0].quantity === 1)) {
      const p = selectedItems[0].product;
      return `Vends bobine ${p.brand} ${p.material} ${p.color} compatible pour toutes les imprimantes 3D (Anycubic, Bambu Lab, Creality etc).

🔹 CARACTÉRISTIQUES :
• Marque : ${p.brand}
• Type de filament : ${p.material} (Diamètre standard 1.75mm)
• Couleur : ${p.color}
• Poids : 1 kg
• État : Neuf sous blister

Possibilité de faire des lots différents et panacher les couleurs si besoin. J'ai du PLA et du PETG sur mon compte.
Toutes les bobines sur mon compte sont à ${unitPrice}€ l'unité, même en lot.

Envoi rapide via Mondial Relay avec l'achat protégé sur Leboncoin ou remise en main propre chez moi à Nieppe.

Pour toute question, n'hésitez pas !`;
    }

    // Description pour un lot panaché
    const linesDescription = selectedItems
      .map((i) => `• ${i.quantity}x ${i.product.material} ${i.product.brand} - Couleur : ${i.product.color} (1 kg)`)
      .join('\n');

    return `Vends lot de ${totalQuantity} bobines de filament 3D compatibles avec toutes les imprimantes 3D (Anycubic, Bambu Lab, Creality, Elegoo, etc.).

📦 COMPOSITION DU LOT (${totalQuantity} kg au total) :
${linesDescription}

🔹 CARACTÉRISTIQUES :
• Diamètre standard 1.75mm
• État : Entièrement neuf sous blister avec sachet déshydratant
• Prix du lot complet : ${calculatedPrice} € (soit ${unitPrice}€ / bobine)

Possibilité de modifier ou panacher avec d'autres couleurs / matériaux (PLA, PETG) sur simple demande avant expédition.

Envoi rapide et soigné via Mondial Relay avec le paiement sécurisé Leboncoin ou remise en main propre chez moi à Nieppe.

Pour toute question, n'hésitez pas à m'envoyer un message !`;
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
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="text-amber-400" size={20} /> Générateur d'Annonces Leboncoin & Vinted
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Génère des annonces optimisées à l'unité ou pour des lots multi-couleurs prêtes à copier-coller.
          </p>
        </div>

        {/* Boutons de sélection du mode */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setMode('single');
              if (bundleLines.length > 1) setBundleLines([bundleLines[0]]);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'single' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box size={14} /> Unité
          </button>
          <button
            type="button"
            onClick={() => setMode('bundle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'bundle' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} /> Lot Panaché
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulaire des paramètres */}
        <div className="lg:col-span-5 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              {mode === 'bundle' ? '1. Composer le lot de bobines' : '1. Sélectionner la bobine'}
            </label>
            {mode === 'bundle' && totalQuantity > 0 && (
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 font-bold">
                {totalQuantity} bobine(s) au total
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {bundleLines.map((line, idx) => {
              const prod = products.find((p) => p.id === line.productId);
              const colorHex = prod ? getColorHex(prod.color) : null;
              const stock = prod ? getProductStock(prod.id) : 0;

              return (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800/90 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                    <select
                      value={line.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs outline-none focus:border-indigo-500 text-white font-medium"
                    >
                      <option value="">Sélectionner une bobine...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.material}] {p.brand} - {p.color}
                        </option>
                      ))}
                    </select>
                    {mode === 'bundle' && bundleLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        title="Supprimer la ligne"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {prod && (
                    <div className="flex items-center justify-between gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            minWidth: '12px',
                            minHeight: '12px',
                            borderRadius: '9999px',
                            backgroundColor: colorHex?.bg,
                            border: `1.5px solid ${colorHex?.border}`,
                          }}
                        />
                        <span className="text-slate-200 font-semibold">{prod.material} {prod.color}</span>
                      </div>
                      <span className="text-slate-400">Stock : <strong className="text-cyan-400 font-mono">{stock}</strong></span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Quantité de cette couleur :</label>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                      disabled={!line.productId}
                      className="w-20 bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs outline-none focus:border-indigo-500 text-white font-mono text-center"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {mode === 'bundle' && (
            <button
              type="button"
              onClick={addEmptyLine}
              className="w-full text-xs py-2 border border-dashed border-slate-700 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 rounded-xl transition flex items-center justify-center gap-1"
            >
              <Plus size={14} /> Ajouter une couleur / bobine au lot
            </button>
          )}

          {/* Configuration des prix */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Prix unit. conseillé (€)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={unitPrice}
                  onChange={(e) => {
                    setUnitPrice(Number(e.target.value));
                    setCustomTotalPrice('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-sm outline-none focus:border-indigo-500 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Total Forfait Lot (€)
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder={String(totalQuantity * unitPrice)}
                  value={customTotalPrice}
                  onChange={(e) => setCustomTotalPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-sm outline-none focus:border-indigo-500 text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Textes générés avec copie rapide */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={14} className="text-indigo-400" /> Titre de l'annonce ({generateTitle().length}/80 car.)
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
              rows={14}
              value={generateDescription()}
              className="w-full p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-200 font-mono resize-none focus:outline-none"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-medium">
                Prix total de l'annonce : <strong className="text-emerald-400 font-mono text-sm">{calculatedPrice} €</strong>
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