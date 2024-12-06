import { Router, Request, Response } from "express";
import multer from 'multer';
import { MSSQLConnection } from "../dataSource";
import { BlobServiceClient } from '@azure/storage-blob';
import { Professor } from "../entities/azure/Professor";
import 'dotenv/config';
import { professorMiddleware } from "../middleware/professorMiddleware";

const router = Router();
const professorRepository = MSSQLConnection.getRepository(Professor);
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
  const newBlockBlobClient = containerClient.getBlockBlobClient(blobName);
  await newBlockBlobClient.upload(file.buffer, file.size);
  return newBlockBlobClient.url;
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

router.post('/professor', upload.single('LINK_IMAGE'), professorMiddleware, async (req: Request, res: Response) => {
  try {
    const { NOME, CARGO, EMAIL, PASSWORD } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).send("Imagem não enviada");
      return;
    }

    const imageUrl = await uploadImageToAzure(file);

    const professor = new Professor();
    professor.NOME = NOME;
    professor.CARGO = CARGO;
    professor.EMAIL = EMAIL;
    professor.PASSWORD = PASSWORD;
    professor.LINK_IMAGE = imageUrl;

    const novoProfessor = professorRepository.create(professor);
    const resultado = await professorRepository.save(novoProfessor);
    res.status(201).json(resultado);
  } catch (error) {
    console.error("Erro ao criar professor:", error);
    res.status(500).send("Erro ao criar professor");
  }
});

router.get('/professor', async (req: Request, res: Response) => {
  try {
    const professores = await professorRepository.find();
    res.json(professores);
  } catch (error) {
    console.error("Erro ao buscar professores:", error);
    res.status(500).send("Erro ao buscar professores");
  }
});

router.get('/professor/:id', async (req: Request, res: Response) => {
  try {
    const professorId = req.params.id;
    const professor = await professorRepository.findOne({ where: { ID: parseInt(professorId) } });
    if (!professor) {
      res.status(404).send("Professor não encontrado");
      return;
    }
    res.json(professor);
  } catch (error) {
    console.error("Erro ao buscar professor:", error);
    res.status(500).send("Erro ao buscar professor");
  }
});

router.put('/professor/:id', upload.single('LINK_IMAGE'), professorMiddleware, async (req: Request, res: Response) => {
  try {
    let { NOME, CARGO, EMAIL, PASSWORD, LINK_IMAGE } = req.body;
    const professorId = req.params.id;
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

    const professorToUpdate = await professorRepository.findOne({ where: { ID: parseInt(professorId) } });
    if (!professorToUpdate) {
      res.status(404).send("Professor não encontrado");
      return;
    }

    if (professorToUpdate.LINK_IMAGE !== LINK_IMAGE)
      await deleteAzureBlob(professorToUpdate.LINK_IMAGE);

    const professor = new Professor();
    professor.NOME = NOME;
    professor.CARGO = CARGO;
    professor.EMAIL = EMAIL;
    professor.PASSWORD = PASSWORD;
    professor.LINK_IMAGE = LINK_IMAGE;

    professorRepository.merge(professorToUpdate, professor);
    const resultado = await professorRepository.save(professorToUpdate);
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao atualizar professor:", error);
    res.status(500).send("Erro ao atualizar professor");
  }
});

router.delete('/professor/:id', async (req: Request, res: Response) => {
  try {
    const professorId = req.params.id;
    const professorToDelete = await professorRepository.findOne({ where: { ID: parseInt(professorId) } });

    if (!professorToDelete) {
      res.status(404).send("Professor não encontrado");
      return;
    }

    await deleteAzureBlob(professorToDelete.LINK_IMAGE);

    await professorRepository.remove(professorToDelete);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar professor:", error);
    res.status(500).send("Erro ao deletar professor");
  }
});

export default router;