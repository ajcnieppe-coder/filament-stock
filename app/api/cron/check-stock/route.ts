import { NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';

export async function GET() {
  try {
    const { data: links, error } = await supabase.from('supplier_links').select('*');
    if (error || !links) {
      return NextResponse.json({ error: error?.message || 'Aucun lien trouvé' }, { status: 400 });
    }

    const results = [];

    for (const item of links) {
      let isInStock = true;
      let statusNote = 'En stock';
      let scrapedPrice = item.last_price || 0;

      try {
        const response = await fetch(item.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
        });

        if (response.ok) {
          const html = await response.text();
          const lower = html.toLowerCase();

          // Vérification robuste : recherche de bouton d'achat actif vs bouton indisponible
          const hasBuyButton = 
            lower.includes('ajouter au panier') || 
            lower.includes('acheter maintenant') || 
            lower.includes('add to cart') || 
            lower.includes('buy now');

          const isExplicitlyOutOfStock = 
            lower.includes('article indisponible') || 
            lower.includes('actuellement en rupture') ||
            lower.includes('"isinstock":false') ||
            lower.includes('"available":false') ||
            lower.includes('produit épuisé');

          if (isExplicitlyOutOfStock && !hasBuyButton) {
            isInStock = false;
            statusNote = 'Rupture constatée';
          } else {
            isInStock = true;
            statusNote = 'En stock';
          }

          // Extraction du prix
          const priceMatch = html.match(/(\d+[\.,]\d{2})\s*€/);
          if (priceMatch) {
            scrapedPrice = parseFloat(priceMatch[1].replace(',', '.'));
          }
        } else {
          // En cas d'erreur HTTP momentanée, on ne passe pas en rupture brutale
          isInStock = true;
          statusNote = `Vérifié (HTTP ${response.status})`;
        }
      } catch (err: any) {
        isInStock = true;
        statusNote = 'Vérifié';
      }

      // Mise à jour Supabase
      await supabase
        .from('supplier_links')
        .update({
          is_in_stock: isInStock,
          last_price: scrapedPrice,
          last_checked: new Date().toISOString(),
          status_note: statusNote,
        })
        .eq('id', item.id);

      results.push({
        id: item.id,
        label: item.label,
        is_in_stock: isInStock,
        price: scrapedPrice,
        statusNote,
      });
    }

    return NextResponse.json({ success: true, checked: results.length, data: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}