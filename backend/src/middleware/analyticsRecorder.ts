import { Request, Response, NextFunction } from 'express';
import { recordEvent } from '../utils/analytics';

export function analyticsRecorder(req: Request, _res: Response, next: NextFunction) {
  recordEvent(req);
  next();
}
