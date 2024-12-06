import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'PROFESSOR' })
export class Professor {
  @PrimaryGeneratedColumn()
  ID!: number;
  @Column()
  NOME!: string;
  @Column()
  CARGO!: string;
  @Column()
  EMAIL!: string;
  @Column()
  PASSWORD!: string;
  @Column()
  LINK_IMAGE!: string;
}