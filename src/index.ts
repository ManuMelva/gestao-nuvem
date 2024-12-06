import "reflect-metadata";
import { MSSQLConnection, MongoDBConnection } from './dataSource';
import express from "express";
import cors from "cors";
import ProfessorRoutes from "./routes/professorRoutes";
import AlunoRoutes from "./routes/alunoRoutes";
import CommentsRoutes from "./routes/commentsRoutes";

const app = express();

Promise.all([MSSQLConnection.initialize(), MongoDBConnection.initialize()])
  .then(() => {
    console.log("Conexões com os bancos de dados estabelecidas com sucesso");

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));

    app.use('/api', ProfessorRoutes);
    app.use('/api', AlunoRoutes);
    app.use('/api', CommentsRoutes);

    app.listen(4000, () => {
      console.log('Servidor executando na porta 4000');
    });
  })
  .catch((error) => {
    console.error("Erro na conexão:", error);
    process.exit(1);
  });

export { app };