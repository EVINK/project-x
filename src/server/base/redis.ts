import * as redis from 'redis'
import { logger } from './log4j'
import { ApiError } from '../errors/api-error'
import { ErrorRusult } from '../error-result-types'
import { NextFunction } from 'express'

const
    port = 6379,
    host = '127.0.0.1',
    opts = {},
    // passwrod = '',
    client = redis.createClient(port, host, opts)

// client.auth(passwrod, (err) => {
//     if (err) {
//         logger.error('Redis Fatal -> ' + err)
//         throw new ApiError(ErrorRusult.InternelError)
//     }
//     logger.info(`Redis connected!`)
// })

client.on(`ready`, (err: Error) => {
    if (err) {
        logger.error(err)
        return
    }
    logger.info(`Redis is on ready stage`)
})

export class RedisClient {
    next: NextFunction

    public constructor(next: NextFunction) { this.next = next }

    public async set(key: string, value:string) : Promise<"OK">{
        return new Promise((resolve) => {
            client.set(key,value, (err, value: "OK") => {
                if (err) return this.next(err)
                resolve(value)
            })
        })
    }
    public async get(key: string) : Promise<string>{
        return new Promise((resolve) => {
            client.get(key, (err, value: string) => {
                if (err) return this.next(err)
                resolve(value)
            })
        })
    }
}

