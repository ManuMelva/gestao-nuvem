import { Request, Response, NextFunction } from "express";

export const alunoMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { NOME, EMAIL, IDADE } = req.body;

  if (!NOME || typeof NOME !== 'string') {
    res.status(400).json({ error: "O campo 'NOME' é obrigatório e deve ser uma string." });
    return;
  }

  if (!EMAIL || typeof EMAIL !== 'string') {
    res.status(400).json({ error: "O campo 'EMAIL' é obrigatório e deve ser uma string." });
    return;
  }

  if (!IDADE) {
    res.status(400).json({ error: "O campo 'IDADE' é obrigatório e deve ser um number." });
    return;
  }

  next();
};