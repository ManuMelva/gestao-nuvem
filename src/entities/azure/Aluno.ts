import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ALUNO' })
export class Aluno {
  @PrimaryGeneratedColumn()
  ID!: number;
  @Column()
  NOME!: string;
  @Column()
  EMAIL!: string;
  @Column()
  IDADE!: number;
  @Column()
  LINK_IMAGE!: string;
}