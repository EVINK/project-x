import * as _express from 'express'
import { NextFunction, Request, Response } from 'express'
import { RunMode, runMode } from '../../secret'
import './log4j'
import './async-router-wrapper'
import { logger } from './log4j'
// import 'express-async-errors'

export default null
export const app = _express()
export const router = _express.Router()

app.disable('x-powered-by')

// 基本信息配置
export const base = {
    // 视图层
    viewsDir: '../views',
    // 静态资源
    staticResourceDir: '../views/resource',
    // favicon文件名称
    faviconFileName: 'favicon.ico',
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

/**
 * @deprecated Sometimes it will course
 * @error `Cannot set headers after they are sent to the client`
 */
export let request: Request
/**
 * @deprecated Sometimes it will course
 * @error `Cannot set headers after they are sent to the client`
 */
export let response: Response

export const requestInterceptor = (req: Request, res: Response, next:NextFunction):void => {
    request = req
    response = res
    next()
}

export function requestPathRecorder (req: Request, res: Response, next: NextFunction):void {
    // logger.info(`${req.method} ${req.path} - HTTP/${req.httpVersion} - ${req.headers['user-agent']}`)
    logger.info(`HTTP ${req.httpVersion} ${req.method} ${req.originalUrl}`)
    res.arrivedTime = Date.now()
    next()
}