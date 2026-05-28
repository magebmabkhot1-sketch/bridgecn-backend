declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
      role: 'USER' | 'ORGANIZER' | 'ADMIN';
    };
  }
}
