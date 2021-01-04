import * as redis from 'redis'
import { logger } from './log4j'
import { REDIS_SECRET } from '../../secret'
import { NotificationChannelMessage } from '../../typings/global'
import { handleNotificationEvent } from './wb'

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

const client = redis.createClient(
    REDIS_SECRET.port, REDIS_SECRET.host, { db: REDIS_SECRET.db }
)

client.on('ready', (err: Error) => {
    if (err) {
        logger.error(err)
        return
    }
    logger.info('Redis is on ready stage')
})

/**
 * Wrapper redis client into async
 */
export class AsyncRedis {

    static channels: { [channelName: string]: NotificationChannelMessage[] } = {}

    public static set (key: string, value: string): Promise<'OK'> {
        return new Promise((resolve, reject) => {
            client.set(key, value, (err, value: 'OK') => {
                if (err) return reject(err)
                resolve(value)
            })
        })
    }
    public static get (key: string): Promise<string> {
        return new Promise((resolve, reject) => {
            client.get(key, (err, value: string) => {
                if (err) return reject(err)
                resolve(value)
            })
        })
    }

    public static hget (key: string, field: string): Promise<string> {
        return new Promise((resolve, reject) => {
            client.hget(key, field, (err, value: string) => {
                if (err) return reject(err)
                resolve(value)
            })
        })
    }

    public static hgetall (key: string): Promise<{ [key: string]: string }> {
        return new Promise((resolve, reject) => {
            client.hgetall(key, (err, value: { [key: string]: string }) => {
                if (err) return reject(err)
                resolve(value)
            })
        })
    }

    public static hset (key: string, field: string, value: string): Promise<number> {
        return new Promise((resolve, reject) => {
            client.hset(key, field, value, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            })
        })
    }

    public static hincrby (key: string, field: string, incriment: number): Promise<number> {
        return new Promise((resolve, reject) => {
            client.hincrby(key, field, incriment, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            })
        })
    }

    public static expire (key: string, seconds: number): Promise<number> {
        return new Promise((resolve, reject) => {
            client.expire(key, seconds, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            })
        })
    }

    public static delete (key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            client.del(key, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            })
        })
    }

    public static hdel (key: string, field: string): Promise<number> {
        return new Promise((resolve, reject) => {
            client.hdel(key, field, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            })
        })
    }

    public static hsetnx (key: string, field: string, value: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            client.hsetnx(key, field, value, (err, reply: number) => {
                if (err) return reject(err)
                resolve(reply === 1)
            })
        })
    }
    public static hlen (key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            client.hlen(key, (err, value: number) => {
                if (err) return reject(err)
                resolve(value)
            })
        })
    }

    public static lrange (key: string, start: number, end: number): Promise<string[]> {
        return new Promise((resolve, reject) => {
            client.lrange(key, start, end, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static lpush (key: string, values: string[]):Promise<number> {
        return new Promise((resolve, reject) => {
            client.lpush(key, ...values, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static lpop (key: string): Promise<string> {
        return new Promise((resolve, reject) => {
            client.lpop(key, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static lset (key: string, index: number, value: string): Promise<'OK'> {
        return new Promise((resolve, reject) => {
            client.lset(key, index, value, (err, status) => {
                if (err) return reject(err)
                resolve(status)
            })
        })
    }

    public static llen (key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            client.llen(key, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static rpush (key: string, values: string[]): Promise<number> {
        return new Promise((resolve, reject) => {
            client.rpush(key, values, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static rpop (key: string): Promise<string> {
        return new Promise((resolve, reject) => {
            client.rpop(key, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static zadd (key: string, score: string, members: string):Promise<number> {
        return new Promise((resolve, reject) => {
            client.zadd(key, score, members, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static zrevrange (key: string, start: number, stop: number): Promise<string[]> {
        return new Promise((resolve, reject) => {
            client.zrevrange(key, start, stop, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static zrank (key: string, member: string):Promise<number|undefined> {
        return new Promise((resolve, reject) => {
            client.zrank(key, member, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static zrem (key: string, member: string): Promise<number> {
        return new Promise((resolve, reject) => {
            client.zrem(key, member, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    public static zcount (key: string, start?: number|string, stop?: number|string):Promise<number> {
        return new Promise((resolve, reject) => {
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

    static subscribeNotifyChannel (channel: string):void {
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

    static publish (channel: string, message: string): Promise<number> {
        return new Promise((resolve, reject) => {
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
