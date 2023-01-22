export const RunMode: any = {
    dev: 'dev',
    local: 'local',
    test: 'test',
    prod: 'prod'
}

export const runMode = process.env.NODE_ENV || RunMode.dev
if (!RunMode[runMode]) {
    console.error('\n ❌ App runs with', runMode, 'mode is not acceptable')
    throw new Error('❌ Runs Mode must be one of the followings: dev, local, test, prod')
}

console.log('App runs with ::', runMode, 'mode')

export const APNs = {
    APNsAuthKeyId: '',
    AppleDeveloperId: '',
    BundleId: '',

}

export const QINIU_SERCRET = {
    bucket: '',
    accessKey: '',
    secretKey: '',
    domain: '',
}

export const MYSQL_SECRET = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'db-test',
    // For Cache
    redis: {
        port: 6379,
        name: 'db-test-cache',
        host: '127.0.0.1',
        db: 15,
    }
}

export const REDIS_SECRET = {
    port: 6379,
    host: '127.0.0.1',
    db: 0,
}

export const AES_IV = ''
export const AES_KEY = ''
export const UserSeedNumber = 10086

export const JWT_SECRET = 'signedbyevink'

export const sshRemoteHost = '0.0.0.0'
export const sshRemotePort = 22
export const sshUsername = 'root'
export const sshPassword = 'root'
export let sshPrivateKey: string | Buffer = ''

import { readFileSync } from 'fs'
if (runMode === RunMode.dev) {
    sshPrivateKey = readFileSync('/path/to/your/private_key')
}