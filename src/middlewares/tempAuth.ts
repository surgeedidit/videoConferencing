import { Request, Response, NextFunction } from 'express';



export const tempAuthBypass = (req: Request, res: Response, next: NextFunction) => {
  // For CREATE ROOM - use host ID
  if (req.method === 'POST' && req.path === '/rooms') {
    (req as any).user = {
      _id: '507f1f77bcf86cd799439011', 
      email: 'host@example.com'
    };
  } 
  // For JOIN ROOM - use participant ID
  else if (req.method === 'POST' && req.path === '/rooms/join') {
    (req as any).user = {
      _id: '507f1f77bcf86cd799439012', 
      email: 'participant@example.com'
    };
  }

  else {
    (req as any).user = {
      _id: '507f1f77bcf86cd799439011',
      email: 'host@example.com'
    };
  }
  
  next();
};