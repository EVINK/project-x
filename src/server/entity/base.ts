import { BaseEntity, Column, PrimaryGeneratedColumn } from 'typeorm'
import { genId } from '../utils/helpers'

export abstract class Base<T> extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number

    @Column({
        type: 'datetime',
        default: ()=> 'CURRENT_TIMESTAMP',
    })
    createdAt!: Date

    public constructor (data?: {[key: string]: any} | T) {
        super()
        if (data) {
            for (const key of Object.keys(data)) {
                (this as any)[key] = (data as any)[key]
            }
        }
    }

    attachData: {[x:string]: any} = {}

    /**
     * Do not modify this.
     * Calling Array.push() in removeKey() instead.
     *
     */
    removedKeys:Array<string> = []

    private resolveAttachData (attachData: any) {
        for (const k of Object.keys(attachData)) {
            const obj = attachData[k]
            if (Array.isArray(obj)) {
                attachData[k] = this.resolveAttachData(obj) as any
            }
            else if (obj instanceof Base) {
                attachData[k] = obj.removeKeys()
            }
        }
        return attachData
    }

    /**
     *
     * * Remove the specific keys from the model.
     * * Transform normal Id to a chaos one.
     */
    public removeKeys (args?: {excludeKeys?: string[], genChaosId?: boolean}): T {
        const attachData = this.resolveAttachData(this.attachData)
        const newData = Object.assign(JSON.parse(JSON.stringify(this)), attachData)
        let removedKeys = JSON.parse(JSON.stringify(this.removedKeys)) as string[]
        if (args && args.excludeKeys) removedKeys = removedKeys.filter(v=>!args.excludeKeys?.includes(v))
        removedKeys.push('removedKeys', 'attachData', 'original', 'deleted')
        for (const key of removedKeys) {
            delete newData[key]
        }

        let genChaosId = true
        if (args && args.genChaosId === false) genChaosId = false

        if (genChaosId) {
            for (const key of Object.keys(newData)) {
                const value = newData[key]
                if (key === 'id' || (key.includes('Id') && Number.isSafeInteger(value) && value !== 0)) {
                    newData[key] = genId(value)
                }
            }
        }

        return newData
    }

    // /**
    //  * @override JSON.stringfy
    //  */
    // public toJSON ():string {}

}

/**
 * Empty wrapper class
 */
export class BaseModelWrapper extends Base<BaseModelWrapper> {

}