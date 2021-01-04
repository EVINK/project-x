import * as ws from 'ws'
import { Base } from '../server/entity/base'

export interface ResifyData {
    code: number,
    msg: string,
    success: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
}

declare class WS extends ws {
    uid?: number;
}

export type NotificationMessageType = 'message' | 'thread' | 'system' | 'message-feedback'
export interface NotificationChannelMessage {
    uid: number,
    isAgent?: boolean,
    type: NotificationMessageType,
    data: {[x: string]: any},
    createdAt?: Date
}