// routes/user.ts
import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { v4 as uuid, validate as uuidValidate } from 'uuid';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Настройки текущего пользователя
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Получить настройки текущего пользователя
 *     description: >
 *       Пользователь определяется по заголовку HTTP x-user-id.
 *       Если заголовок отсутствует — сервер создаёт нового пользователя
 *       и возвращает x-user-id в заголовке ответа.
 *       Если заголовок есть, но пользователь не найден — возвращается 404.
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: string
 *         required: false
 *         description: UUID пользователя
 *     responses:
 *       200:
 *         description: Настройки пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                 base_currency:
 *                   type: string
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: string
 *                 created_at:
 *                   type: string
 *                 updated_at:
 *                   type: string
 *       400:
 *         description: Некорректный x-user-id
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.header('x-user-id');
    let user;

    // Если передан x-user-id, проверяем валидность
    if (userId && !uuidValidate(userId)) {
      return res.status(400).json({ error: 'Invalid x-user-id' });
    }

    if (!userId) {
      // Нет заголовка → создаём нового пользователя
      const newUserId = uuid();
      const { data, error } = await supabase
        .from('users')
        .insert({
          user_id: newUserId,
          base_currency: 'USD',
          favorites: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      user = data;

      // Возвращаем новый user_id в заголовке ответа
      res.setHeader('x-user-id', data.user_id);
    } else {
      // Заголовок есть → ищем пользователя
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'User not found' });
      }

      user = data;
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/user:
 *   post:
 *     summary: Обновить настройки текущего пользователя
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: string
 *         required: true
 *         description: UUID пользователя
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
 *       400:
 *         description: Некорректный x-user-id
 *       401:
 *         description: Пользователь не определён
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'User not identified' });

    if (!uuidValidate(userId)) {
      return res.status(400).json({ error: 'Invalid x-user-id' });
    }

    // Проверяем, существует ли пользователь
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { base_currency, favorites } = req.body;
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (base_currency) updateData.base_currency = base_currency;
    if (favorites) updateData.favorites = favorites;

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) return res.status(500).json({ error: updateError.message });

    res.sendStatus(204);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
