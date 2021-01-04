import * as crypto from 'crypto'
import { JWT_SECRET, RunMode, runMode } from '../../secret'
import { logger } from '../base/log4j'
import { Errors } from '../error-result-types'
import { Failed, Success } from '../errors/api-error'
import { genId } from './helpers'

interface Payload {
    chaosId: string,
    expiredAt: number | string,
    agent: boolean
}

export class JsonWebTokenGenerator {

    header: string
    payload: Payload = {} as any
    payloadStr = ''
    JWT = ''
    signature = ''

    private constructor (payload: Payload) {
        const header = {
            typ: 'JWT',
            alg: 'HS256',
        }
        this.header = JsonWebTokenGenerator.base64Encode(header)
        this.payload = payload
    }

    private static base64Encode (data: {[x:string]: any}) {
        return Buffer.from(JSON.stringify(data), 'utf-8').toString('base64')
    }

    private static sign (payload: string, header: string) {
        const hmac = crypto.createHmac('sha256', JWT_SECRET)
        hmac.update(payload + header)
        return hmac.digest('hex')
    }

    static create ({chaosId, agent}: {chaosId: string, agent?: boolean}, expiresIn?: number):JsonWebTokenGenerator {
        if (!expiresIn) expiresIn = 3600 * 4
        const now = Date.now()
        const payload = {
            chaosId,
            expiredAt: now + expiresIn * 1000,
            agent: agent?true:false
        }
        const generator = new JsonWebTokenGenerator(payload)
        generator.payloadStr = JsonWebTokenGenerator.base64Encode(payload)
        generator.signature = JsonWebTokenGenerator.sign(generator.payloadStr, generator.header)
        generator.JWT = `Bearer ${generator.header}.${generator.payloadStr}.${generator.signature}`
        return generator
    }

    static resolve (jwtString?: string | string[]): JsonWebTokenGenerator {
        if (!jwtString) throw new Success(Errors.JWTVerifiedFailed)
        jwtString = jwtString.toString()
        // remove Bearer
        jwtString = jwtString.slice(7)
        const jwt = jwtString.split('.')
        if (jwt.length !== 3) throw new Success(Errors.JWTVerifiedFailed)
        const generator = new JsonWebTokenGenerator(JSON.parse(Buffer.from(jwt[1], 'base64').toString('utf-8')))
        generator.JWT = jwtString
        generator.payloadStr = jwt[1]
        generator.signature = jwt[2]
        return generator
    }

    static verified (jwtString?: string | string[]): JsonWebTokenGenerator {
        const generator = JsonWebTokenGenerator.resolve(jwtString)
        const signature = JsonWebTokenGenerator.sign(generator.payloadStr, generator.header)
        if (signature !== generator.signature) {
            logger.debug('this time sign: original sign', signature, generator.signature)
            throw new Success(Errors.JWTVerifiedFailed)
        }

        const now = Date.now()
        if (!generator.payload['expiredAt'] || now >= generator.payload['expiredAt']) {
            logger.debug('now: expired_at', now, generator.payload)
            throw new Success(Errors.JWTExpired)
        }
        return generator
    }

    static fakeOne (agent?: boolean): JsonWebTokenGenerator {
        if (runMode !== RunMode.dev) throw new Failed(Errors.InternalError)
        const payload = {
            chaosId: genId(1),
            expiredAt: 180000,
            agent: agent ? true : false,
            testOnly: true
        }
        const generator = new JsonWebTokenGenerator(payload)
        generator.JWT = 'test'
        return generator
    }

}

// const jwt = JsonWebTokenGenerator.create({chaosId: '71fmeb68'})
// console.log(jwt.JWT)
// const jwtString = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjaGFvc0lkIjoiNzFmbWViNjgiLCJleHBpcmVkQXQiOjE2MDA3NjY0NDg0NzQsImFnZW50IjpmYWxzZX0=.f6f94f5a37d4d8172595ae999f49689652d89120d776d3b61226216aae868cd4'
// const g = JsonWebTokenGenerator.verified(jwtString)
// console.log(g)
