import './Config';
import { Handler, Request, Response, NextFunction } from 'express';
import { Dictionary } from 'express-serve-static-core';

/**
 * NodeJS middleware.
 */
const middleware: Handler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  return next();
};

export default middleware;
