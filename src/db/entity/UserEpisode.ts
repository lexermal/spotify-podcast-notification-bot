import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class UserArticle {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    chatId: number;

    @Column()
    episodeId: string;

    @Column({ nullable: true })
    podcastId: number;

    @Column()
    added: number;

}
