import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm'

@Entity()
export abstract class Base extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'datetime',
        default: ()=> 'CURRENT_TIMESTAMP',
    })
    createdAt!: Date;

}