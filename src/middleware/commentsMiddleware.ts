import { Request, Response, NextFunction } from "express";

export const commentsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { comentario, id_professor, id_aluno } = req.body;

  if (!comentario || typeof comentario !== 'string') {
    res.status(400).json({ error: "O campo 'comentario' é obrigatório e deve ser uma string." });
    return;
  }

  if (!id_aluno) {
    res.status(400).json({ error: "O campo 'id_aluno' é obrigatório." });
    return;
  }

  next();
};