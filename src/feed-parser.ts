import { request } from 'undici';
import * as cheerio from 'cheerio';

export interface Deal {
  id: string; // unique per deal
  title: string;
  link: string;
  price?: string;
  originalPrice?: string;
  merchant?: string;
  merchantUrl?: string;
  timestamp?: number;
  score?: number; // deal score/rating
  temperature?: 'hot' | 'warm' | 'cold';
  commentCount?: number;
  savings?: string; // calculated savings amount
  savingsPercentage?: number; // percentage saved
}

export async function fetchDeals(searchTerm: string): Promise<Deal[]> {
  const url = `https://www.hotukdeals.com/search?q=${encodeURIComponent(searchTerm)}`;
  const res = await request(url, {
    method: 'GET',
    headers: {
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    }
  });

  if (res.statusCode !== 200) {
    throw new Error(`Failed to fetch search page for '${searchTerm}', status: ${res.statusCode}`);
  }

  const body = await res.body.text();
  const $ = cheerio.load(body);
  const deals: Deal[] = [];

  // Find all deal articles
  $('article.thread').each((_, el) => {
    const linkEl = $(el).find('a.thread-link');
    const link = linkEl.attr('href');
    const title = linkEl.text().trim();

    if (!link || !title) {
      return;
    }

    // Extract ID from the thread ID attribute
    const threadId = $(el).attr('id')?.replace('thread_', '');
    const id = threadId || link;

    let price: string | undefined;
    let originalPrice: string | undefined;
    let merchant: string | undefined;
    let merchantUrl: string | undefined;
    let score: number | undefined;
    let temperature: 'hot' | 'warm' | 'cold' | undefined;
    let commentCount: number | undefined;
    let savings: string | undefined;
    let savingsPercentage: number | undefined;

    // Try to extract price and merchant from Vue.js data (both vue2 and vue3)
    try {
      let vueDataEl = $(el).find('[data-vue2]').first();
      let vueDataStr = vueDataEl.attr('data-vue2');
      
      // Fallback to vue3 if vue2 not found
      if (!vueDataStr) {
        vueDataEl = $(el).find('[data-vue3]').first();
        vueDataStr = vueDataEl.attr('data-vue3');
      }

      if (vueDataStr) {
        // Decode HTML entities for vue3 format
        const decodedData = vueDataStr.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const vueData = JSON.parse(decodedData);
        const thread = vueData.props?.thread;

        if (thread) {
          // Price information
          if (thread.price) {
            price = `£${parseFloat(thread.price).toFixed(2)}`;
          }
          if (thread.nextBestPrice && thread.nextBestPrice > 0) {
            originalPrice = `£${parseFloat(thread.nextBestPrice).toFixed(2)}`;
          }
          
          // Merchant information
          if (thread.merchant?.merchantName) {
            merchant = thread.merchant.merchantName;
          }
          if (thread.merchant?.link) {
            merchantUrl = thread.merchant.link;
          }
          
          // Deal metadata
          if (typeof thread.temperature === 'number') {
            score = thread.temperature;
            // Determine temperature based on score
            temperature = thread.temperature >= 100 ? 'hot' : thread.temperature >= 50 ? 'warm' : 'cold';
          }
          
          if (thread.commentCount) {
            commentCount = thread.commentCount;
          }
          
          // Calculate savings if we have both prices
          if (thread.price && thread.nextBestPrice) {
            const currentPrice = parseFloat(thread.price);
            const originalPriceVal = parseFloat(thread.nextBestPrice);
            if (originalPriceVal > currentPrice) {
              const savingsAmount = originalPriceVal - currentPrice;
              savings = `£${savingsAmount.toFixed(2)}`;
              savingsPercentage = Math.round((savingsAmount / originalPriceVal) * 100);
            }
          }
        }
      }
    } catch (error) {
      // Silently continue if Vue data parsing fails
    }

    // Fallback: Try to extract price from text content if not found in Vue data
    if (!price) {
      // Look for price in the deal title or nearby text
      const priceText = $(el).find('.thread-price, .price, [class*="price"]').text().trim();
      if (priceText) {
        price = priceText;
      } else {
        // Try to find price pattern in the title (£X.XX, £X, $X.XX, etc.)
        const titleText = title;
        const priceMatch = titleText.match(/[£$€][\d,]+(?:\.\d{2})?|\b\d+(?:\.\d{2})?\s*(?:£|GBP|pounds?)\b/i);
        if (priceMatch) {
          price = priceMatch[0];
        } else {
          // Look for price patterns like "£X off", "X% off", "save £X", "from £X"
          const priceOfferMatch = titleText.match(/(?:from|save|off|was)\s*[£$€][\d,]+(?:\.\d{2})?|[£$€][\d,]+(?:\.\d{2})?\s*(?:off|discount)/i);
          if (priceOfferMatch) {
            price = priceOfferMatch[0];
          }
        }
      }
    }

    // Fallback: Try to extract merchant from text if not found in Vue data
    if (!merchant) {
      const merchantText = $(el).find('.thread-merchant, .merchant, [class*="merchant"]').text().trim();
      if (merchantText) {
        merchant = merchantText;
      }
    }

    deals.push({
      id,
      title,
      link: link.startsWith('http') ? link : `https://www.hotukdeals.com${link}`,
      price,
      originalPrice,
      merchant,
      merchantUrl,
      timestamp: Date.now(),
      score,
      temperature,
      commentCount,
      savings,
      savingsPercentage
    });
  });

  return deals;
}
