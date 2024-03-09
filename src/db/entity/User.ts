import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    chatId: number;

    @Column()
    userName: string;

    @Column()
    lastUpdated: number;
}
