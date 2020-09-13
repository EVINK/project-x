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

    public constructor(data?: {[x:string]: any}) {
        super()
        if (data) {
            for (const key of Object.keys(data)) {
                (this as any)[key] = data[key]
            }
        }
    }

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
    public removeKeys(): Base {
        const newData = JSON.parse(JSON.stringify(this))
        this.removedKeys.push('removedKeys')
        for (const key of this.removedKeys) {
            delete newData[key]
        }
        newData.id = IdGenerator.genId(this.id) as any
        return newData
    }

}
