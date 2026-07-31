import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[ERROR]', err.message, err.stack);

  const response: ApiResponse = {
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  };

  res.status(500).json(response);
};

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: 'Route not found' });
};
