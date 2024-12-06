import { Router, Request, Response } from "express";
import multer from 'multer';
import { MSSQLConnection } from "../dataSource";
import { BlobServiceClient } from '@azure/storage-blob';
import { Aluno } from "../entities/azure/Aluno";
import 'dotenv/config';
import { alunoMiddleware } from "../middleware/alunoMiddleware";

const router = Router();
const alunoRepository = MSSQLConnection.getRepository(Aluno);
const upload = multer({ storage: multer.memoryStorage() });
const accountName = process.env.ACCOUNT_NAME;
const sasToken = process.env.SAS_TOKEN;
const containerName = process.env.CONTAINER_NAME;

const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net/?${sasToken}`);
if (!containerName) {
  throw new Error("Azure container name is not defined in environment variables");
}
const containerClient = blobServiceClient.getContainerClient(containerName);

const uploadImageToAzure = async (file: Express.Multer.File): Promise<string> => {
  const blobName = `${Date.now()}_${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(file.buffer, file.size);
  return blockBlobClient.url;
};

const checkIfBlobExists = async (imageURL: string): Promise<boolean> => {
  const url = new URL(imageURL);
  const blobName = url.pathname.split('/').pop();

  if (!blobName) {
    return false;
  }

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const blobExists = await blockBlobClient.exists();

  return blobExists;
}

async function deleteAzureBlob(imageURL: string) {
  const url = new URL(imageURL);
  const blobName = url.pathname.split('/').pop();

  if (blobName) {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  }
}

router.post('/aluno', upload.single('LINK_IMAGE'), alunoMiddleware, async (req: Request, res: Response) => {
  try {
    const { NOME, EMAIL, IDADE } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).send("Imagem não enviada");
      return;
    }

    const imageUrl = await uploadImageToAzure(file);

    const aluno = new Aluno();
    aluno.NOME = NOME;
    aluno.EMAIL = EMAIL;
    aluno.IDADE = IDADE;
    aluno.LINK_IMAGE = imageUrl;

    const novoAluno = alunoRepository.create(aluno);
    const resultado = await alunoRepository.save(novoAluno);
    res.status(201).json(resultado);
  } catch (error) {
    console.error("Erro ao criar aluno:", error);
    res.status(500).send("Erro ao criar aluno");
  }
});

router.get('/aluno', async (req: Request, res: Response) => {
  try {
    const alunos = await alunoRepository.find();
    res.status(200).json(alunos);
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    res.status(500).send("Erro ao buscar alunos");
  }
});

router.get('/aluno/:id', async (req: Request, res: Response) => {
  try {
    const alunoId = req.params.id;
    const aluno = await alunoRepository.findOne({ where: { ID: parseInt(alunoId) } });

    if (!aluno) {
      res.status(404).send("Aluno não encontrado");
      return;
    }

    res.status(200).json(aluno);
  } catch (error) {
    console.error("Erro ao buscar aluno:", error);
    res.status(500).send("Erro ao buscar aluno");
  }
});

router.put('/aluno/:id', upload.single('LINK_IMAGE'), alunoMiddleware, async (req: Request, res: Response) => {
  try {
    let { NOME, EMAIL, IDADE, LINK_IMAGE } = req.body;
    const alunoId = req.params.id;
    const file = req.file;

    if (!file) {
      if (!checkIfBlobExists(LINK_IMAGE)) {
        res.status(400).send("Imagem não enviada");
        return;
      }
    }
    else {
      const imageUrl = await uploadImageToAzure(file);
      LINK_IMAGE = imageUrl;
    }

    const alunoToUpdate = await alunoRepository.findOne({ where: { ID: parseInt(alunoId) } });
    if (!alunoToUpdate) {
      res.status(404).send("Aluno não encontrado");
      return;
    }

    if (alunoToUpdate.LINK_IMAGE !== LINK_IMAGE) {
      await deleteAzureBlob(alunoToUpdate.LINK_IMAGE);
    }

    const aluno = new Aluno();
    aluno.NOME = NOME;
    aluno.EMAIL = EMAIL;
    aluno.IDADE = IDADE;
    aluno.LINK_IMAGE = LINK_IMAGE;

    alunoRepository.merge(alunoToUpdate, aluno);
    const resultado = await alunoRepository.save(alunoToUpdate);
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao atualizar aluno:", error);
    res.status(500).send("Erro ao atualizar aluno");
  }
});

router.delete('/aluno/:id', async (req: Request, res: Response) => {
  try {
    const alunoId = req.params.id;
    const alunoToDelete = await alunoRepository.findOne({ where: { ID: parseInt(alunoId) } });
    
    if (!alunoToDelete) {
      res.status(404).send("Aluno não encontrado");
      return;
    }

    await deleteAzureBlob(alunoToDelete.LINK_IMAGE);

    await alunoRepository.remove(alunoToDelete);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar aluno:", error);
    res.status(500).send("Erro ao deletar aluno");
  }
});

export default router;