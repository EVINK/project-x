import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import {Base} from './base'

export enum Gender {
  Male='male',
  Female='female',
  Other='other'
}

@Entity()
export class User extends Base {

    @Column({length: 20, default: ''})
    name!: string

    @Column({
        type: 'enum',
        enum: Gender,
        default: 'male',
    })
    gender!: Gender

    @Column({
        nullable: true,
        length: 512,
    })
    avatar?: string
}