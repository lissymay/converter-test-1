import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Настройки текущего пользователя (определяется по cookie user_id)
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Получить настройки текущего пользователя
 *     description: >
 *       Пользователь определяется по httpOnly cookie `user_id`.
 *       Если cookie отсутствует — пользователь создаётся автоматически.
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Настройки пользователя
 *       401:
 *         description: Пользователь не определён
 */
router.get('/', async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'User not identified' });
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', req.userId)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/**
 * @swagger
 * /api/user:
 *   post:
 *     summary: Обновить настройки текущего пользователя
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base_currency:
 *                 type: string
 *                 example: EUR
 *               favorites:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       204:
 *         description: Настройки обновлены
 *       401:
 *         description: Пользователь не определён
 */
router.post('/', async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'User not identified' });
  }

  const { base_currency, favorites } = req.body;

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (base_currency) updateData.base_currency = base_currency;
  if (favorites) updateData.favorites = favorites;

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('user_id', req.userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.sendStatus(204);
});

export default router;
