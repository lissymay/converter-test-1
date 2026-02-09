import { Router } from 'express';
import axios from 'axios';
import { getCurrencies } from '../services/currencies.service';
import { supabase } from '../config/supabase';

const router = Router();

// Кэш в памяти для 5 минут на повторные запросы одного пользователя
const memoryCache: Record<string, any> = {};

// Функция для получения курса с проверкой Supabase
const fetchRate = async (base: string, target: string) => {
  const cacheKey = `${base}_${target}`;

  // Проверяем кэш Supabase (24 часа)
  const { data, error } = await supabase
    .from('rates_cache')
    .select('*')
    .eq('base_currency', base)
    .eq('target_currency', target)
    .single();

  if (!error && data) {
    const diff = Date.now() - new Date(data.updated_at).getTime();
    if (diff < 24 * 60 * 60 * 1000) {
      return data.rate;
    }
  }

  // Если нет данных в Supabase или устарели, делаем запрос к API
  const res = await axios.get(`${process.env.CURRENCY_API_URL}/latest`, {
    params: { base, symbols: target },
  });

  const rate = res.data.rates[target];

  // Сохраняем в Supabase (upsert)
  await supabase.from('rates_cache').upsert({
    base_currency: base,
    target_currency: target,
    rate,
    updated_at: new Date().toISOString(),
  });

  return rate;
};

/**
 * @swagger
 * /api/rates:
 *   get:
 *     summary: Возвращает курсы валют
 *     parameters:
 *       - in: query
 *         name: base
 *         schema:
 *           type: string
 *         description: Базовая валюта (по умолчанию USD)
 *       - in: query
 *         name: targets
 *         schema:
 *           type: string
 *         description: Список валют через запятую
 *     responses:
 *       200:
 *         description: Объект с курсами валют
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 base:
 *                   type: string
 *                 rates:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 */
router.get('/', async (req, res) => {
  try {
    const base = (req.query.base as string) || 'USD';
    const targetsQuery = (req.query.targets as string) || '';
    let targets: string[];

    if (targetsQuery) {
      targets = targetsQuery.split(',');
    } else {
      targets = await getCurrencies();
    }

    // Проверка кэша на уровне запроса пользователя (5 минут)
    const memoryKey = `${base}:${targets.join(',')}`;
    if (memoryCache[memoryKey]) {
      return res.json(memoryCache[memoryKey]);
    }

    const rates: Record<string, number> = {};
    for (const t of targets) {
      if (t === base) {
        rates[t] = 1;
      } else {
        rates[t] = await fetchRate(base, t);
      }
    }

    const response = { base, rates };
    memoryCache[memoryKey] = response;

    // Кэш 5 минут
    setTimeout(() => delete memoryCache[memoryKey], 5 * 60 * 1000);

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось получить курсы валют' });
  }
});

export default router;
