import { Request, Response, NextFunction } from "express";

export const professorMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { NOME, CARGO, EMAIL, PASSWORD } = req.body;

  if (!NOME || typeof NOME !== 'string') {
    res.status(400).json({ error: "O campo 'NOME' é obrigatório e deve ser uma string." });
    return;
  }

  if (!CARGO || typeof CARGO !== 'string') {
    res.status(400).json({ error: "O campo 'CARGO' é obrigatório e deve ser uma string." });
    return;
  }

  if (!EMAIL || typeof EMAIL !== 'string') {
    res.status(400).json({ error: "O campo 'EMAIL' é obrigatório e deve ser uma string." });
    return;
  }

  if (!PASSWORD || typeof PASSWORD !== 'string') {
    res.status(400).json({ error: "O campo 'PASSWORD' é obrigatório e deve ser uma string." });
    return;
  }

  next();
};