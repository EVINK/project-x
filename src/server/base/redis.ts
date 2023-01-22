import * as redis from 'redis'
import { logger } from './log4j'
import { REDIS_SECRET, RunMode, runMode, sshRemoteHost } from '../../secret'
import { NotificationChannelMessage } from '../../typings/global'
import { handleNotificationEvent } from './wb'
import createSSHTunnel from './ssh-tunnel'
import { Client } from 'ssh2'
import * as net from 'net'
import { createIntermediateServer } from '../utils/helpers'

/**
 * @deprecated Bug found
 * @param channelName
 */
function genNotifyMessageProxy (channelName: string): NotificationChannelMessage[] {
    AsyncRedis.channels[channelName] = []
    AsyncRedis.channels[channelName] = new Proxy(AsyncRedis.channels[channelName], {
        set: function (target, property: any, value, receiver) {
            target[property] = value
            if (property === 'length') return true
            handleNotificationEvent(value, receiver)
            return true
        }
    }) as NotificationChannelMessage[]
    return AsyncRedis.channels[channelName]
}

/**
 * Wrapper redis client into async
 */
export class AsyncRedis {

    static channels: { [channelName: string]: NotificationChannelMessage[] } = {}

    private static async getClient (): Promise<redis.RedisClient> {

        if (this._client) {
            return this._client
        }

        const __getClient = (
            resolve: (value: redis.RedisClient) => void,
            reject: (err?: Error) => void,
            configs?: { [key: string]: any }
        ) => {
            if (!configs) configs = {
                port: REDIS_SECRET.port,
                host: REDIS_SECRET.host,
                options: { db: REDIS_SECRET.db }
            }
            logger.debug('Redis Configs:', configs)
            const client = redis.createClient(
                configs.port, configs.host, configs.options
            )
            client.on('ready', (err: Error) => {
                if (err) {
                    logger.error(err)
                    return reject(err)
                }
                logger.info('Redis is on ready stage')
                this._client = client
                return resolve(client)
            })
        }

        if (runMode === RunMode.dev){
            const conn: Client = await createSSHTunnel()
            const server = await createIntermediateServer(socket => {
                conn.forwardOut(
                    socket.remoteAddress as string,
                    socket.remotePort as number,
                    REDIS_SECRET.host,
                    REDIS_SECRET.port,
                    (error, stream) => {
                        if (error) {
                            this._client = undefined
                            socket.end()
                            return
                        }

                        socket.pipe(stream).pipe(socket)

                    }
                )
            })
            if (!server) throw new Error('Failed to create intermedia server')
            return new Promise((resolve, reject) => __getClient(resolve, reject, {
                host: (server.address() as net.AddressInfo).address,
                port: (server.address() as net.AddressInfo).port,
                options: { db: REDIS_SECRET.db }
            }))

        } else {
            return new Promise(
                (resolve, reject) => __getClient(resolve, reject)
            )
        }
    }

    private static _client?: redis.RedisClient = undefined
    private static client = AsyncRedis.getClient()
    private static _wrapper<T, F> (cb: (
        client: redis.RedisClient,
        resolve: (value: T) => void,
        reject: (reason?: F) => void
    ) => void): Promise<T|F> {
        return new Promise((resolve, reject) => {
            this.client.then(client => cb(client, resolve, reject))
        })
    }

    public static set (key: string, value: string): Promise<'OK'> {
        return new Promise((resolve, reject) => {
            (async () =>
                (await this.client).set(key, value, (err, value: 'OK') => {
                    if (err) return reject(err)
                    resolve(value)
                }))()
        })

    }
    public static get (key: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.then(client => {
                client.get(key, (err, value: string) => {
                    if (err) return reject(err)
                    resolve(value)
                })
            })

        })
    }

    public static hget (key: string, field: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.then((client) =>
                client.hget(key, field, (err, value: string) => {
                    if (err) return reject(err)
                    resolve(value)
                }))
        })
    }

    public static hgetall (key: string): Promise<{ [key: string]: string }> {
        return new Promise((resolve, reject) => {
            this.client.then((client)=>
                client.hgetall(key, (err, value: { [key: string]: string }) => {
                    if (err) return reject(err)
                    resolve(value)
                }))
        })
    }

    public static hset (key: string, field: string, value: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.then(client => client.hset(key, field, value, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            }))
        })
    }

    public static hincrby (key: string, field: string, incriment: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.then(client => client.hincrby(key, field, incriment, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            }))
        })
    }

    public static expire (key: string, seconds: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.then(client => client.expire(key, seconds, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            }))
        })
    }

    public static delete (key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.then(client => client.del(key, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            }))
        })
    }

    public static hdel (key: string, field: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.then(client => client.hdel(key, field, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            }))
        })
    }

    public static hsetnx (key: string, field: string, value: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.client.then(client => client.hsetnx(key, field, value, (err, reply: number) => {
                if (err) return reject(err)
                resolve(reply === 1)
            }))
        })
    }
    public static hlen (key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.then(client => client.hlen(key, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            }))
        })
    }

    public static lrange (key: string, start: number, end: number): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.client.then(client => client.lrange(key, start, end, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            }))
        })
    }

    public static lpush (key: string, values: string[]): Promise<number|Error> {
        return this._wrapper((client, resolve, reject) => {
            client.lpush(key, ...values, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })

    }

    public static lpop (key: string): Promise<string|Error> {
        return this._wrapper((client, resolve, reject) => {
            client.lpop(key, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static lset (key: string, index: number, value: string): Promise<'OK'| Error> {
        return this._wrapper((client, resolve, reject) => {
            client.lset(key, index, value, (err, status) => {
                if (err) return reject(err)
                resolve(status)
            })
        })
    }

    public static llen (key: string): Promise<number|Error> {
        return this._wrapper((client, resolve, reject) => {
            client.llen(key, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static rpush (key: string, values: string[]): Promise<number|Error> {
        return this._wrapper((client, resolve, reject) => {
            client.rpush(key, values, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static rpop (key: string): Promise<string|Error> {
        return this._wrapper((client,resolve, reject) => {
            client.rpop(key, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static zadd (key: string, score: string, members: string):Promise<number|Error> {
        return this._wrapper((client, resolve, reject) => {
            client.zadd(key, score, members, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static zrevrange (key: string, start: number, stop: number): Promise<string[]|Error> {
        return this._wrapper((client, resolve, reject) => {
            client.zrevrange(key, start, stop, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static zrank (key: string, member: string):Promise<number|undefined|Error> {
        return this._wrapper((client, resolve, reject) => {
            client.zrank(key, member, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static zrem (key: string, member: string): Promise<number|Error> {
        return this._wrapper((client, resolve, reject) => {
            client.zrem(key, member, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static zcount (key: string, start?: number|string, stop?: number|string):Promise<number|Error> {
        return this._wrapper((client, resolve, reject) => {
            if (!start || !stop) {
                start = '-inf'
                stop = '+inf'
            }
            client.zcount(key, start, stop, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    static subscribeNotifyChannel (channel: string): void {
        if (runMode===RunMode.dev ) return
        const client = redis.createClient(
            REDIS_SECRET.port, REDIS_SECRET.host, { db: REDIS_SECRET.db }
        )

        client.on('ready', (err: Error) => {
            if (err) {
                return logger.error(err)
            }
            client.subscribe(channel, (err) => {
                if (err) return logger.error(err)
            })
        })

        client.on('message', (channel: string, message: string) => {
            let c = AsyncRedis.channels[channel]
            if (!c) {
                switch (channel) {
                    case AsyncRedis.NOTIFICATION_CHANNEL_NAME:
                        // c = genNotifyMessageProxy(channel)
                        c = AsyncRedis.channels[channel] = []
                        break
                    default:
                        logger.error('Received message from a unknown channel:', channel)
                        logger.error('Abort.')
                        return
                }
            }
            if (message) {
                try {
                    message = JSON.parse(message)
                } catch (err) {
                    logger.error(err)
                    return
                }
                c.push(message as unknown as NotificationChannelMessage)
                handleNotificationEvent(message as unknown as NotificationChannelMessage, c)
            }
        })
    }

    static publish (channel: string, message: string): Promise<number|Error> {
        return this._wrapper((client,resolve, reject) => {
            client.publish(channel, message, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    static genKey (staticKey: string, dynamicKey: string): string {
        return staticKey.replace('%s', dynamicKey)
    }
    static NOTIFICATION_CHANNEL_NAME = 'notify:channel'
    static REFRESH_TOKEN_TO_UID_HASH = 'refresh_token:uid:hash'
    static SEND_VERIFY_CODE = 'verify_code:'
    static UID_TO_REFRESH_TOKEN_HASH = 'uid:refresh_token:hash'

    static ASYNC_TASKS_LIST = 'ASYNC_TASKS'

    static async newTask (
        task: 'pushThreadToMyFollowers' | 'test',
        params?: unknown
    ): Promise<void> {
        if (!params) params = {}
        await AsyncRedis.rpush(this.ASYNC_TASKS_LIST, [JSON.stringify({task,params})])
    }

}
