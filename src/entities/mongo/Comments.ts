import { Entity, ObjectIdColumn, Column } from "typeorm";
import { ObjectId } from "mongodb";

@Entity({ name: 'comments' })
export class Comments {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column()
  id_aluno!: number;

  @Column()
  comentario!: string;
}

export default Comments;