/**
 * Just a example for demonstration, do not use directly.
*/
import { Column, Entity, Index } from 'typeorm'
import { Base } from './base'

@Entity()
export class WorkerDevice extends Base<WorkerDevice> {
    @Index()
    @Column({default: 0})
    userId!: number

    @Column({length: 20})
    platform!: string

    @Column({
        default: '',
        length: 256
    })
    modelOrUa!: string

    @Column({ length: 128 })
    deviceToken!: string
}