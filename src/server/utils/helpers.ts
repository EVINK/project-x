/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as bcrypt from 'bcrypt'
import { Request } from 'express'
import { AES_IV, AES_KEY, RunMode, runMode, UserSeedNumber } from '../../secret'
import { Errors } from '../error-result-types'
import { Failed } from '../errors/api-error'
import crypto = require('crypto')
import { request } from '../base/base'
import { logger } from '../base/log4j'

const seedNumber = UserSeedNumber

export function genId (id: number): string {
    const num = id + seedNumber
    const base = num.toString(26)
    let idStr = ''
    const hex = num.toString(16)
    for (let i = 0; i < hex.length; i++) {
        idStr += `${hex[i]}${base[i]?base[i]:(i + 10).toString(36).toUpperCase()}`
    }
    return idStr
}

export function decodeId (idStr: string): number {
    if (Number.isSafeInteger(idStr)) return idStr as unknown as number
    let originalId = ''
    for (const i of Object.keys(idStr)) {
        const idx = parseInt(i)
        if (idx % 2 == 0) originalId += idStr[idx]
    }
    return parseInt(originalId, 16) - seedNumber
}

export function genRandomString (length:number):string {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

export function genRandomStringBaseOnTime (length: number): string {
    const now = new Date()
    return `${now.getDate().toString(36)}${(now.getMonth()+1).toString(36)}${now.getMilliseconds().toString(36)}${now.getHours().toString(16)}.${genRandomString(length)}.${now.getFullYear().toString(16)}${now.getSeconds().toString(26)}${now.getMinutes().toString(26)}`
}

export function aesEncrypt (data:string):string {
    const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, AES_IV)
    let cryptos = cipher.update(data, 'utf8', 'hex')
    cryptos += cipher.final('hex')
    return cryptos
}

export function aesDecrypt (encrypted: string):string {
    const decipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, AES_IV)
    // @ts-ignore
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    // @ts-ignore
    decrypted += decipher.final('utf8')
    return decrypted
}

export class ParamsChecker {

    original: { [x: string]: any } = {}

    public constructor (req: Request) {
        if (req.params) this.original = Object.assign(this.original, req.params)
        if (req.query) this.original = Object.assign(this.original, req.query)
        if (req.body) this.original = Object.assign(this.original, req.body)
    }

    private _checkArg (key: string, statement: string) {
        let optional = false
        if (statement.startsWith('?')) {
            optional = true
            statement = statement.substr(1)
        }

        // // Duplicated logic
        // if (!ParamsChecker.supportedTypes.includes(statement)) {
        //     throw Error(`statement not illeage: ${statement}`)
        // }

        const value = this.original[key]

        if (optional && ((value === undefined) || value === '')) return

        if (value === undefined) throw Error

        if (['string', 'str'].includes(statement)) {
            if (typeof value === 'string' && value) return value
            else throw Error
        }
        else if (statement === 'int') {
            const newVal = parseFloat(value)
            if (Number.isSafeInteger(newVal)) {
                if (key === 'offset' && newVal < 0) {
                    throw Error('`offset` cannot be negative!')
                }
                if (key === 'limit' && newVal <= 0) {
                    throw Error('`limit` cannot be negative or zero!')
                }
                return newVal
            }
            else throw Error
        }
        else if (statement === 'float') {
            const newVal = parseFloat(value)
            if (typeof newVal === 'number' && !Number.isNaN(newVal) && Math.floor(newVal) !== newVal)
                return newVal
            else throw Error
        }
        else if (['date', 'datetime', 'timestamp'].includes(statement)) {
            let newVal = value
            // Support format: YYYY-MM-DD HH:mm:SS:sss
            if (typeof value === 'number') newVal = value * 1000
            const date = new Date(newVal)
            if (!isNaN(date.getFullYear())) return date
            else throw Error
        }
        else if (['bool', 'boolean'].includes(statement)) {
            let newVal = value
            if (value === 0 || value === 'false') newVal = false
            else if (value === 1 || value === 'true') newVal = true

            if (typeof newVal === 'boolean') return newVal
            else throw Error
        }
        else if (['list', 'array'].includes(statement)) {
            let newVal = value
            if (typeof value === 'string') newVal = JSON.parse(value)
            if (Array.isArray(newVal)) {
                if (newVal.length <= 0) {
                    if (optional) return null
                    else throw Error
                }
                return newVal
            }
            else throw Error
        }
        else if (['dict', 'json'].includes(statement)) {
            let newVal = value
            if (typeof value === 'string') newVal = JSON.parse(value)
            const objectConstructor = ({}).constructor
            if (newVal.constructor === objectConstructor && Object.keys(newVal).length !== 0)
                return newVal
            else throw Error
        } else if (statement === 'gender') {
            const genders = ['male', 'female', 'other']
            if (!genders.includes(value)) throw Error
            return value
        } else if (statement.startsWith('list:')) {
            statement = statement.slice(5).trim()
            if (!statement.split(',').includes(value)) throw Error
            return value
        }

        throw new Failed(Errors.ArgsError, `statement illegal: ${statement}`)
    }

    public checkArgs<T extends { [x: string]: any }> (data: T): T {

        const newData = {} as any

        for (const d of Object.entries(data)) {
            const key = (d[0]).toString()
            const statement = d[1]
            try {
                let value = this._checkArg(key, statement)
                // TODO
                // logger.debug(key, value)
                if (value === undefined || value === null || value === '') continue
                if (key === 'id' || key.includes('Id')) {
                    if (statement.includes('int') || statement.includes('str')) value = decodeId(value)
                    else if (Array.isArray(value)) {
                        const newVal = []
                        for (const d of value) {
                            newVal.push(decodeId(d))
                        }
                        value = newVal
                    }
                }
                // logger.debug('id', key, value)
                newData[key] = value
            } catch (e) {
                if (e instanceof Failed) throw e
                const value = this.original[key]
                const err = new Failed(new Errors().ArgsError)
                // console.error('key:', key, 'value:', value, typeof value)
                if (value === undefined) err.err.errorMsg = `缺少参数'${key}' :${statement}`
                else err.err.errorMsg += `:${key}需要${statement}类型，而不是'${value}'`
                throw err
            }
        }
        // Object.freeze(this.original)
        // newData.original = this.original
        if (runMode === RunMode.dev) logger.debug('params', newData)
        return newData
    }

    /**
     * @deprecated A serious bug found
     * @param data
     */
    static checkArgs<T> (data: T): T | {[x:string]: any} {
        return new ParamsChecker(request).checkArgs(data as any)
    }

}

export class PasswordEncryption {

    static async encrypt (password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)
        return hash
    }

    static compare (plainPassword: string, hash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            bcrypt.compare(plainPassword, hash, function (err, isPasswordMatch) {
                if (err) return reject(err)
                resolve(isPasswordMatch)
            })
        })

    }
}

// const str = genRandomStringBaseOnTime(12)
// console.log('str', str)
// (async function () {
//     const plainPassword = 'test-passwd-15978'
//     const hash = await PasswordEncryption.encrypt(plainPassword)
//     console.log('hash', hash)
//     console.log('is Password legal?',
//         await PasswordEncryption.compare(plainPassword, hash), //true
//         await PasswordEncryption.compare(plainPassword,
//             '$2b$10$PkEQK/evdEB8hQJTmJ1QLupbKtwkiXe0WHv/vkfvusqMJ0p/NLWDy'), // true
//         await PasswordEncryption.compare(plainPassword,
//             '$2b$10$FDcME5UMujZekq0ZhIFN0uizMBWXRS.ctmTZQTkERXeoDcjvDYcSC'), // true
//         await PasswordEncryption.compare(plainPassword,
//             '$2b$10$FDcME5UMujZekq0ZhIFN0uizMBWXRS.ctmTZQTkERXeoDcjvDYcSb'), // false
//     )
// })()

import * as net from 'net'

export function createIntermediateServer (connectionListener: ((socket: net.Socket) => void) | undefined): Promise < net.Server > {
    return new Promise((resolve, reject) => {
        const server = net.createServer(connectionListener)
        server.once('error', reject)
        server.listen(0, () => {
            resolve(server)
        })
    })
}
