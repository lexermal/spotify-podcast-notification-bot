import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Podcast {

    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    chatId: number;

    @Column()
    name: string;

    static init(chatId: number, showId: string, name: string) {
        const podcast = new Podcast();
        podcast.id = showId;
        podcast.name = name;
        podcast.chatId = chatId;

        return podcast;
    }
}

