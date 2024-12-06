import { DataSource } from "typeorm";
import 'dotenv/config';

export const MSSQLConnection = new DataSource({
  type: "mssql",
  host: process.env.MSSQL_HOST,
  port: parseInt(process.env.MSSQL_PORT || "1433"),
  username: process.env.MSSQL_USERNAME,
  password: process.env.MSSQL_PASSWORD,
  database: process.env.MSSQL_DATABASE,
  options: {
    encrypt: true,
  },
  entities: [__dirname + "/entities/azure/*.ts"],
  synchronize: true,
});

export const MongoDBConnection = new DataSource({
  type: "mongodb",
  url: process.env.MONGODB_URI,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  database: process.env.MONGODB_DATABASE,
  entities: [__dirname + "/entities/mongo/*.ts"],
  synchronize: true,
});