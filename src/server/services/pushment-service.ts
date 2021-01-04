import * as crypto from 'crypto'
import * as fs from 'fs'
import { APNs, RunMode, runMode } from '../../secret'
import { AsyncRedis } from '../base/redis'
import { API } from './request'

type APNsPayload = {
    iss: string,
    iat: number
}

interface PushAlert {
    title: string,
    subtile: string,
    body: string,
}

class APNsService {
    private static APNsAuthToken = 'APNs:push:token'

    static host = {
        sandbox: 'api.sandbox.push.apple.com',
        product: 'api.push.apple.com',
    }

    private static base64Encode (data: {[x:string]: any}) {
        return Buffer.from(JSON.stringify(data), 'utf-8').toString('base64')
    }

    private static fromBase64 (base64:string) {
        return base64
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
    }

    private static getPrivateKey ():Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile('./APNs_Auth_Key.p8', 'utf8', (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }

    private static async generateAuthToken () {
        const header = {
            alg: 'ES256',
            kid: APNs.APNsAuthKeyId,
        }
        const payload: APNsPayload = {
            iss: APNs.AppleDeveloperId,
            iat: Math.floor(Date.now() / 1000)
        }

        const privateKey = await this.getPrivateKey()

        const signer = crypto.createSign('RSA-SHA256')
        const headerPayload = `${this.base64Encode(header)}.${this.base64Encode(payload)}`
        let sig = (
            signer.update(headerPayload),
            signer.sign(privateKey, 'base64')
        )
        sig = this.fromBase64(sig)
        return `${headerPayload}.${sig}`
    }

    private static tokenInvalid (token: string): boolean {
        if (!token) return true
        const _token = token.split('.')
        if (_token.length !== 3) return true
        try {
            const payload: APNsPayload = JSON.parse(Buffer.from(_token[1], 'base64').toString('utf-8'))
            const now = Math.floor(Date.now() / 1000)
            if (now > payload.iat + 1800) return true
        } catch { return true }
        return false
    }

    static async getAuthToken () {
        let token = await AsyncRedis.get(this.APNsAuthToken)
        if (this.tokenInvalid(token)) {
            token = await this.generateAuthToken()
            await AsyncRedis.set(this.APNsAuthToken, token)
        }
        return token
    }
}

export class AppPush {

    static async iosPush (args: { deviceToken: string, alert: PushAlert }): Promise<void> {
        const { deviceToken, alert } = { ...args }
        const host = runMode === RunMode.dev? APNsService.host.sandbox : APNsService.host.product
        await API.post({
            host, path: `/3/device/${deviceToken}`,http2: true,
            debug: true
        }).addHeader({
            authorization: `bearer ${await APNsService.getAuthToken()}`,
            'apns-push-type': 'alert', // 'alert' | 'background'
            'apns-topic': APNs.BundleId,
        }).addBody({
            aps: {alert},
        }).send()
    }

}

// AppPush.iosPush({
//     deviceToken: '53b7a7d17402e24828db1667d92d3fc9ca881605f5ba8817077257bd3fbb90b6',
//     alert: {
//         title: '推送测试',
//         subtile: '',
//         body: '这是详细的推送消息',
//     }
// })