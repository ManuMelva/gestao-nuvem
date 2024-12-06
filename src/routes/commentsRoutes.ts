import { Router, Request, Response } from "express";
import { MongoDBConnection } from "../dataSource";
import { Comments } from "../entities/mongo/Comments";
import { commentsMiddleware } from "../middleware/commentsMiddleware";
import { ObjectId } from "mongodb";

const router = Router();
const commentsRepository = MongoDBConnection.getRepository(Comments);

router.post('/comments', commentsMiddleware, async (req: Request, res: Response) => {
  try {
    req.body.id_aluno = Number(req.body.id_aluno);
    const novoComentario = commentsRepository.create(req.body as Comments);
    const resultado = await commentsRepository.save(novoComentario);
    res.status(201).json(resultado);
  } catch (error) {
    console.error("Erro ao criar comentario:", error);
    res.status(500).send("Erro ao criar comentario");
  }
});

router.get('/comments', async (req: Request, res: Response) => {
  try {
    const comentarios = await commentsRepository.find();

    if(comentarios.length === 0) {
      res.status(404).send("Comentários não encontrados");
      return;
    }

    res.status(200).json(comentarios);
  } catch (error) {
    console.error("Erro ao buscar comentarios:", error);
    res.status(500).send("Erro ao buscar comentarios");
  }
});

router.get('/comments/:id_aluno', async (req: Request, res: Response) => {
  try {
    const alunoId = req.params.id_aluno;

    const comentario = await commentsRepository.find({ where: { id_aluno: parseInt(alunoId) } });
    if (!comentario) {
      res.status(404).send("Comentários não encontrados para o aluno especificado");
      return;
    }

    res.status(200).json(comentario);
  } catch (error) {
    console.error("Erro ao buscar comentario:", error);
    res.status(500).send("Erro ao buscar comentario");
  }
});

router.put('/comments/:id', commentsMiddleware, async (req: Request, res: Response) => {
  try {
    const comentarioId = req.params.id;

    const comentarioToUpdate = await commentsRepository.findOne({ where: { _id: new ObjectId(comentarioId) } });
    if (!comentarioToUpdate) {
      res.status(404).send("Comentário não encontrado");
      return;
    }

    commentsRepository.merge(comentarioToUpdate, req.body as Comments);
    const resultado = await commentsRepository.save(comentarioToUpdate);
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao atualizar comentario:", error);
    res.status(500).send("Erro ao atualizar comentario");
  }
});

router.delete('/comments/:id', async (req: Request, res: Response) => {
  try {
    const comentarioToDelete = await commentsRepository.findOne({ where: { _id: new ObjectId(req.params.id) } });
    
    if (!comentarioToDelete) {
      res.status(404).send("Comentario não encontrado");
      return;
    }

    await commentsRepository.remove(comentarioToDelete);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar comentario:", error);
    res.status(500).send("Erro ao deletar comentario");
  }
});

export default router;