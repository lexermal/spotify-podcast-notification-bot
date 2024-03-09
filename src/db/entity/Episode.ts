import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Episode {

    @PrimaryColumn()
    id: string;

    @Column()
    showId: string;

    @Column()
    title: string;

    @Column()
    link: string;

    @Column()
    description: string;

    @Column()
    showName: string;

    @Column()
    pubDate: string;

    @Column()
    duration: number;

    @Column({ nullable: true })
    imageURL: string;
}
