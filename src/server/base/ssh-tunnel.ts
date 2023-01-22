import { Client } from 'ssh2'
import { sshPassword, sshPrivateKey, sshRemoteHost, sshRemotePort, sshUsername } from '../../secret'
import { logger } from './log4j'

let SSH_TUNNEL_SERVER: undefined | Client = undefined

export default function createSSHTunnel (): Promise<Client> {

    return new Promise((resolve, reject) => {
        if (SSH_TUNNEL_SERVER) return resolve(SSH_TUNNEL_SERVER)
        const conn = new Client()
        conn.once('ready', () => {
            logger.debug('SSH Tunnel :: Ready')
            SSH_TUNNEL_SERVER = conn
            return resolve(SSH_TUNNEL_SERVER)
        }).connect({
            host: sshRemoteHost,
            port: sshRemotePort,
            username: sshUsername,
            password: sshPassword,
            privateKey: sshPrivateKey
        })
    })
}
