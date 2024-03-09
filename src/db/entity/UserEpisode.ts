import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class UserEpisode {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    chatId: number;

    @Column()
    episodeId: string;

    @Column()
    podcastId: string;

    @Column()
    added: number;

}
