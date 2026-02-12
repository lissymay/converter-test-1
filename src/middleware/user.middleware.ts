import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import { createUserIfNotExists } from '../services/users.service';

export async function userMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let userId = req.header('x-user-id');

  // если клиент не передал user_id → создаём нового
  if (!userId) {
    userId = uuid();
    await createUserIfNotExists(userId);

    // возвращаем клиенту новый user_id
    res.setHeader('x-user-id', userId);
  } else {
    // если передал — убеждаемся что юзер существует
    await createUserIfNotExists(userId);
  }

  req.userId = userId;
  next();
}
