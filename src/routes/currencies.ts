import { Router } from 'express';
import { getCurrencies } from '../services/currencies.service';

const router = Router();

/**
 * @swagger
 * /api/currencies:
 *   get:
 *     summary: Возвращает список валют ISO4217
 *     responses:
 *       200:
 *         description: Массив валют
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/', async (_, res) => {
  try {
    const currenciesList = await getCurrencies();
    res.json(currenciesList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось получить список валют' });
  }
});

export default router;
