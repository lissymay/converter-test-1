import express, { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import crypto from 'crypto';

import currencies from './routes/currencies';
import rates from './routes/rates';
import user from './routes/user';

import { supabase } from './config/supabase';

const app = express();

// =====================
// Парсинг JSON и cookie
// =====================
app.use(express.json());

// =====================
// Swagger
// =====================
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Currency Converter API',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =====================
// User middleware (cookie + DB)
// =====================
app.use(async (req: Request, res: Response, next: NextFunction) => {
  let userId = req.cookies?.user_id;

  if (!userId) {
    userId = crypto.randomUUID();

    res.cookie('user_id', userId, {
      httpOnly: true,
      sameSite: 'lax',
    });

    // создаём пользователя в БД
    const { error } = await supabase.from('users').insert({
      user_id: userId,
      base_currency: 'USD',
      favorites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error creating user:', error.message);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }

  // прокидываем userId дальше
  (req as any).userId = userId;
  next();
});

// =====================
// Роуты
// =====================
app.use('/api/currencies', currencies);
app.use('/api/rates', rates);
app.use('/api/user', user);

// =====================
// Запуск сервера
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
});

export default app;
