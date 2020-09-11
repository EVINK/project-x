import { Request, NextFunction } from "express"
import { RelationQueryBuilder } from "typeorm"
import { ApiError } from "../errors/api-error"
import { ErrorRusult } from "../error-result-types"

export class IdGenerator {

    private static seedNumber = 32741

    /**
     * 生成混淆的ID
     * NOTE: 此函数并不幂等,对结果要求严格相等的程序不应该调用此函数
     */
    public static genId(id: number):string {
        const base = (id + this.seedNumber).toString(26)
        const s = genRandomString(base.length)
        let idStr = ''
        for (const idx of Object.keys(s)) {
            const i = parseInt(idx)
            idStr += s[i]
            idStr += base[i]
        }
        return idStr
    }

    public static decodeId(idStr: string):number {
        let originalId = ''
        for (const i of Object.keys(idStr)) {
            const idx = parseInt(i)
            if (idx % 2 == 0) continue
            originalId += idStr[idx]
        }
        return parseInt(originalId,26) - this.seedNumber

    }

}

export function genRandomString(length:number):string {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

/**
 * 未对async做任何优化，请勿在async函数中调用
 */
export class ParamsChecker {

    data: { [x: string]: any } = {}

    private static supportedTypes = [
        'str', 'string',
        'int', 'float',
        'date', 'datetime', 'timestamp',
        'bool', 'boolean',
        'list', 'array',
        'dict', 'json',
    ]

    public constructor(req: Request) {
        if (req.params) this.data = Object.assign(this.data, req.params)
        if (req.query) this.data = Object.assign(this.data, req.query)
        if (req.body) this.data = Object.assign(this.data, req.body)
    }

    public checkArgs(data: { [key: string]: string }): {[x:string]: any} | void {

        const newData: { [x: string]: any } = {}

        for (const d of Object.entries(data)) {
            const key = (d[0]).toString()
            let statement = d[1]

            let optional = false
            if (statement.startsWith("?")) {
                optional = true
                statement = statement.substr(1)
            }

            if (!ParamsChecker.supportedTypes.includes(statement)) {
                throw Error(`statement not illeage: ${statement}`)
            }

            const value = this.data[key]
            if (optional && value === undefined) continue

            try {
                if(value === undefined) throw Error

                if (['string', 'str'].includes(statement)) {
                    if (typeof value === 'string') newData[key] = value
                    else throw Error
                    continue
                }
                else if (statement === 'int') {
                    const newVal = parseFloat(value)
                    if (Number.isSafeInteger(newVal)) newData[key] = newVal
                    else throw Error
                    continue
                }
                else if (statement === 'float') {
                    const newVal = parseFloat(value)
                    if (typeof newVal === 'number' && newVal != NaN && Math.floor(newVal) !== newVal)
                        newData[key] = newVal
                    else throw Error
                    continue
                }
                else if (['date', 'datetime', 'timestamp'].includes(statement)) {
                    let newVal = value
                    // Support format: YYYY-MM-DD HH:mm:SS:sss
                    if (typeof value === 'number') newVal = value * 1000
                    const date = new Date(newVal)
                    if (!isNaN(date.getFullYear())) newData[key] = date
                    else throw Error
                    continue
                }
                else if (['bool', 'boolean'].includes(statement)) {
                    let newVal = value
                    if(value === 0 || value === 'false') newVal = false
                    else if(value === 1 || value === 'true') newVal = true

                    if (typeof newVal === 'boolean') newData[key] = newVal
                    else throw Error
                    continue
                }
                else if (['list', 'array'].includes(statement)) {
                    let newVal = value
                    if(typeof value === 'string') newVal = JSON.parse(value)
                    if (Array.isArray(newVal) && newVal.length !== 0) newData[key] = newVal
                    else throw Error
                    continue
                }
                else if (['dict', 'json'].includes(statement)) {
                    let newVal = value
                    if(typeof value === 'string') newVal = JSON.parse(value)
                    const objectConstructor = ({}).constructor
                    if (newVal.constructor === objectConstructor && Object.keys(newVal).length !== 0)
                        newData[key] = newVal
                    else throw Error
                    continue
                }

            } catch {
                const err = new ApiError(new ErrorRusult().ArgsError)
                if (value === undefined) err.errType.errorMsg = `缺少参数${key} :${statement}`
                else err.errType.errorMsg += `:${key}需要${statement}类型，而不是${value}`
                throw err
                // return this.next(err)
            }

        }
        return newData
    }

}
