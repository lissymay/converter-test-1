import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createUserIfNotExists } from '../services/users.service';

export async function userMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let userId = req.cookies.user_id;

  if (!userId) {
    userId = uuidv4();
    res.cookie('user_id', userId, { httpOnly: true });
    await createUserIfNotExists(userId);
  }

  req.userId = userId;
  next();
}
