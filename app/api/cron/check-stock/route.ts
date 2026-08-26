import { NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';

export async function GET() {
  try {
    const { data: links, error } = await supabase.from('supplier_links').select('*');
    if (error || !links) {
      return NextResponse.json({ error: error?.message || 'No links found' }, { status: 400 });
    }

    const results = [];

    for (const item of links) {
      let isInStock = true;
      let statusNote = 'En stock';
      let scrapedPrice = item.last_price;

      try {
        const response = await fetch(item.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          cache: 'no-store'
        });

        if (response.ok) {
          const html = await response.text();
          const lowerHtml = html.toLowerCase();

          // Détection rupture classique (Rupture de stock / Out of stock / Sold out)
          if (
            lowerHtml.includes('rupture de stock') ||
            lowerHtml.includes('épuisé') ||
            lowerHtml.includes('out of stock') ||
            lowerHtml.includes('actuellement indisponible')
          ) {
            isInStock = false;
            statusNote = 'Rupture constatée';
          } else {
            isInStock = true;
            statusNote = 'Disponible';
          }

          // Extraction du prix si présent
          const priceMatch = html.match(/(\d+[\.,]\d{2})\s*€/);
          if (priceMatch) {
            scrapedPrice = parseFloat(priceMatch[1].replace(',', '.'));
          }
        } else {
          statusNote = `Erreur HTTP ${response.status}`;
        }
      } catch (err: any) {
        statusNote = 'Erreur connexion fournisseur';
      }

      // Mise à jour dans Supabase
      await supabase
        .from('supplier_links')
        .update({
          is_in_stock: isInStock,
          last_price: scrapedPrice,
          last_checked: new Date().toISOString(),
          status_note: statusNote,
        })
        .eq('id', item.id);

      results.push({ id: item.id, label: item.label, is_in_stock: isInStock, price: scrapedPrice, statusNote });
    }

    return NextResponse.json({ success: true, checked: results.length, data: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}