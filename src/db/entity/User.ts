import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    chatId: number;

    @Column()
    refreshToken: string;

    @Column()
    lastUpdated: number;

    static from(chatId: number, refreshToken: string, lastUpdated: number) {
        const user = new User();
        user.chatId = chatId;
        user.refreshToken = refreshToken;
        user.lastUpdated = lastUpdated;
        return user;
    }
}
