import * as _express from 'express'
import * as path from 'path'

export default null
export const app = _express()
export const router = _express.Router()

// 运行环境
type RunMode = 'local' | 'dev' | 'test' | 'prod';
const RunMode: {
    [key: string]: RunMode
} = {
    local: 'local',
    dev: 'dev',
    test: 'test',
    prod: 'prod'
}
export const runMode: RunMode = RunMode.dev

// 基本信息配置
export const base = {
    // 视图层
    viewsDir: "../views",
    // 静态资源
    staticResourceDir: "../views/resource",
    // favicon文件名称
    faviconFileName: "favicon.ico",
    // host
    host: (() => {
        switch (runMode) {
        case RunMode.local:
            return 'http://127.0.0.1'
        case RunMode.dev:
            return 'http://127.0.0.1'
        case RunMode.test:
            return 'http://127.0.0.1'
        case RunMode.prod:
            return 'http://127.0.0.1'
        default:
            return 'http://127.0.0.1'
        }
    })(),
    // 端口
    port: (() => {
        switch (runMode) {

        case RunMode.local:
            return 9001
        case RunMode.dev:
            return 9002
        case RunMode.test:
            return 9003
        case RunMode.prod:
            return 9004
        default:
            return 9000
        }
    })(),
}

