import axios from 'axios';
import { supabase } from '../config/supabase';

export async function getRate(base: string, target: string) {
  // 1. Проверяем кэш в БД
  const { data } = await supabase
    .from('rates_cache')
    .select('*')
    .eq('base_currency', base)
    .eq('target_currency', target)
    .maybeSingle();

  if (
    data &&
    Date.now() - new Date(data.updated_at).getTime() <
      24 * 60 * 60 * 1000
  ) {
    return data.rate;
  }

  // 2. Запрашиваем внешний API
  try {
    const res = await axios.get(
      `${process.env.CURRENCY_API_URL}/latest`,
      { params: { base, symbols: target } }
    );

    if (!res.data || !res.data.rates || !res.data.rates[target]) {
      console.error('Invalid rate API response:', res.data);
      throw new Error('Rate not found');
    }

    const rate = res.data.rates[target];

    // 3. Сохраняем в кэш
    await supabase.from('rates_cache').upsert({
      base_currency: base,
      target_currency: target,
      rate,
      updated_at: new Date().toISOString()
    });

    return rate;
  } catch (err) {
    console.error('Failed to fetch rate:', err);
    throw err;
  }
}
