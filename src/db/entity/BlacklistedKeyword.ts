import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class BlacklistedKeyword {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    chatId: number;

    @Column()
    keyword: string;
}
