import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm'
import { IdGenerator } from '../server/utils/helpers'

@Entity()
export abstract class Base extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'datetime',
        default: ()=> 'CURRENT_TIMESTAMP',
    })
    createdAt!: Date;

    /**
     * Do not modify next line. Calling Array.push()
     * in removeKey() if you need modify removedKeys.
     *
     */
    removedKeys:Array<string> = []

    /**
     *
     * @param keys
     * Remove the specific keys from the model.
     */
    public removeKey(): Base {
        const newData = JSON.parse(JSON.stringify(this))
        for (const key of this.removedKeys) {
            delete newData[key]
        }
        newData.id = IdGenerator.genId(this.id) as any
        return newData
    }

}