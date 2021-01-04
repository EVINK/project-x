import * as ws from 'ws'
import { Agent } from '../entity/agent'
import { Base, BaseModelWrapper } from '../entity/base'
import { User } from '../entity/user'
import { NotificationChannelMessage, NotificationMessageType, ResifyData, WS } from '../../typings/global'
import { Errors, ErrorType } from '../error-result-types'
import { BaseError } from '../errors/base-error'
import { Resify } from '../utils/resify'
import { logger } from './log4j'
import { AsyncRedis } from './redis'
import { tokenVerified } from '../utils/auth'
import { RunMode, runMode } from '../../secret'
import { decodeId } from '../utils/helpers'
import { AgentService } from '../services/agent-service'
import { UserService } from '../services/user-service'

export const WebSocketClients: {
    agents: { [x: string]: WebSocketClient },
    users: { [x: string]: WebSocketClient }
} = {
    agents: {}, users: {},
}

function getWebSocketClient (uid: number, isAgent?: boolean): WebSocketClient | void {
    let client = undefined
    if (isAgent)
        client = WebSocketClients.agents[uid]
    else
        client = WebSocketClients.users[uid]
    return client
}

function removeInvalidNotifyMessage (data: NotificationChannelMessage, receiver: NotificationChannelMessage[]) {
    const idx = receiver.indexOf(data)
    if (idx > -1) receiver.splice(idx, 1)
}

export async function handleNotificationEvent (
    data: NotificationChannelMessage, receiver: NotificationChannelMessage[]
): Promise<void> {
    // logger.debug('Handle notification event:', data)
    if (!('uid' in data)) {
        removeInvalidNotifyMessage(data, receiver)
        return logger.error('`uid` not in redis notify-channel message')
    }

    const c = getWebSocketClient(data.uid, data.isAgent)
    // logger.debug('client:', c, WebSocketClients)
    if (!c) {
        if (new Date(data.createdAt!).getTime() + 60000 * 5 < Date.now()) removeInvalidNotifyMessage(data, receiver)
        return
    }
    await c.sendMessage(data.data, data.type)
    removeInvalidNotifyMessage(data, receiver)
}

interface FirstSocketData {
    Authorization: string
}

class WebSocketClient {
    client: WS
    isTryingAuth = false
    user!: User | Agent
    isAgent = false
    // data: {[x: string]: any} = {}
    lastActivatedAt!: number
    deadRetryCount = 0

    private resolve (message: string) {
        message = Buffer.from(message, 'base64').toString('utf-8')
        return JSON.parse(message)
    }

    constructor (ws: ws) {
        this.client = ws as WS
        this.client.on('message', async (message: string) => {
            if (!this.client.uid || !this.user) {
                // first
                try {
                    this.isTryingAuth = true
                    const data = this.resolve(message) as FirstSocketData
                    const g = tokenVerified(data.Authorization)
                    this.isAgent = g.payload.agent
                    this.client.uid = decodeId(g.payload.chaosId)
                    if (this.isAgent) {
                        this.user = await AgentService.getAgent(this.client.uid)
                        WebSocketClients.agents[this.user.id] = this
                    } else {
                        this.user = await UserService.getUser(this.client.uid)
                        WebSocketClients.users[this.user.id] = this
                    }
                    // deleteClient(this.user.id, this.isAgent)
                    await this.sendSuccess()
                } catch (err) {
                    logger.error('An error occurred, but ignored ->', err)
                    this.client.uid = undefined
                    const statusCode = err instanceof BaseError ? err.err.statusCode : 4003
                    const errorMsg = err instanceof BaseError ? err.err.errorMsg : 'Access Denied'
                    await this.close({ statusCode, errorMsg })
                }
            } else {
                // authed alreay
                logger.info(`New message from ${this.isAgent ? '`Agent`' : '`Worker`'}: ${this.user.id}-${this.user.name} -> ${message}`)
                if (message === 'PING') {
                    this.client.send('PONG!')
                } else {
                    try {
                        const data = this.resolve(message)
                    } catch {
                        // ignore
                        logger.error(`WebSocket -> "${ message }" is not a valid JSON string.`)
                    }
                }
            }
            this.lastActivatedAt = Date.now()
            this.deadRetryCount = 0
            // await this.sendSuccess()
        })

        this.client.on('close', () => {
            if (this.client.uid) deleteClient(this.client.uid, this.isAgent)
        })

        const timer: NodeJS.Timeout = setTimeout(async () => {
            if (this.isTryingAuth) return clearTimeout(timer)
            await this.close({ statusCode: 4001, errorMsg: 'Authentication Timeout' })
        }, 5000)
    }

    async sendSuccess (data?: { [x: string]: any } | undefined) {
        data = Resify.dataPreHandle(data)
        await this.send({
            code: Errors.Success.statusCode,
            msg: Errors.Success.errorMsg,
            success: true,
            data,
        })
    }

    async sendMessage (data: any, type: NotificationMessageType) {
        // data = Resify.dataPreHandle(data)
        await this.send({
            type,
            data,
        } as unknown as ResifyData)
    }

    send (data: ResifyData, notCallingClose?: boolean): Promise<void> {
        return new Promise((resolve) => {
            if (this.client.readyState !== this.client.OPEN) return
            this.client.send(Buffer.from(JSON.stringify(data), 'utf-8').toString('base64'), async (err) => {
                if (err) {
                    logger.error('WebSocket get error when sending data... but this error was ignored by server.')
                    logger.error(err)
                    if (notCallingClose) resolve()
                    else await this.close({ ...Errors.SocketAboutClosing })
                }
                resolve()
            })
        })
    }

    async close ({ statusCode, errorMsg }: ErrorType) {
        logger.info(`WebSocket connection closed cause ${errorMsg}, code: ${statusCode}`)
        await this.send({ code: statusCode, msg: errorMsg, success: false, data: undefined }, true)
        if (statusCode < 4000 ) statusCode = 4001
        if (this.client.readyState !== this.client.CLOSED) this.client.close(statusCode, errorMsg)
        if (this.client.uid) deleteClient(this.client.uid, this.isAgent)
    }
}

export const notify = async function (args: NotificationChannelMessage): Promise<void> {
    if (!args.isAgent) args.isAgent = false
    args.createdAt = new Date()
    await AsyncRedis.publish(
        AsyncRedis.NOTIFICATION_CHANNEL_NAME, JSON.stringify(args)
    )
}

function deleteClient (uid: number, isAgent: boolean) {
    if (isAgent && uid in WebSocketClients.agents) {
        const c = WebSocketClients.agents[uid.toString()]
        // Cause close() will call deleteClient()
        if (c.client.readyState !== c.client.CLOSED) return c.close({ ...Errors.SocketAboutClosing })
        delete WebSocketClients.agents[uid.toString()]
    }
    else if (isAgent && uid in WebSocketClients.users) {
        const c = WebSocketClients.users[uid.toString()]
        // Cause close() will call deleteClient()
        if (c.client.readyState !== c.client.CLOSED) return c.close({ ...Errors.SocketAboutClosing })
        delete WebSocketClients.users[uid.toString()]
    }
}

function closeAllClients () {
    for (const d of Object.entries(WebSocketClients.agents)) {
        const client = d[1]
        client.close({ statusCode: 4002, errorMsg: 'Connection force closed by server'})
    }
    for (const d of Object.entries(WebSocketClients.users)) {
        const client = d[1]
        client.close({ statusCode: 4002, errorMsg: 'Connection force closed by server'})
    }
}

export function initWebSocketListener (server: ws.Server): void {

    AsyncRedis.subscribeNotifyChannel(AsyncRedis.NOTIFICATION_CHANNEL_NAME)

    server.on('connection', (ws) => {
        logger.info('New ws client connecting...')
        logger.info('Now have client count(worker):', Object.keys(WebSocketClients.users).length)
        logger.info('Now have client count(agent):', Object.keys(WebSocketClients.agents).length)
        new WebSocketClient(ws)
    })

    server.on('error', (err) => {
        closeAllClients()
        logger.error('WebSocket Error', err)
    })

    server.on('close', () => {
        closeAllClients()
        logger.info('\n================ WebSocket Server Closed ================\n')
    })

}

async function clientHeartBeatCheck () {
    // logger.info('--------  begin to scan WebSocket clients heartbeat status  --------')
    const now = Date.now()
    for (const id of Object.keys(WebSocketClients.agents)) {
        const c = WebSocketClients.agents[id]
        if (c.deadRetryCount > 2) {
            c.close({ ...Errors.SocketAboutClosing })
            continue
        }
        if (now - c.lastActivatedAt >= 120 * 1000) {
            c.client.send('Are you dead?')
            c.deadRetryCount += 1
        }
    }
    for (const id of Object.keys(WebSocketClients.users)) {
        const c = WebSocketClients.users[id]
        if (c.deadRetryCount > 2) {
            c.close({ ...Errors.SocketAboutClosing })
            continue
        }
        if (now - c.lastActivatedAt >= 120 * 1000) {
            c.client.send('Are you dead?')
            c.deadRetryCount += 1
        }
    }
    // 检查通知队列
    let noties = AsyncRedis.channels[AsyncRedis.NOTIFICATION_CHANNEL_NAME]
    noties = noties ? noties : []
    noties = noties.filter(v=>v)
    const promises = []
    for (const n of noties) {
        if (!n) {
            logger.error('notify is null...skip', n)
            continue
        }
        promises.push(handleNotificationEvent(n, noties))
    }
    await Promise.all(promises)
}

setInterval(clientHeartBeatCheck, 1000*60)
