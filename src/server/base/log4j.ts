import * as log4js from 'log4js'
import { app, runMode } from './base'
import { Request, Response } from 'express'
import { ApiError } from '../errors/api-error'
import { ErrorRusult } from '../error-result-types'

// 枚举：日志级别
enum Level {
    all = 'ALL',
    mark = 'MARK',
    trace = 'TRACE',
    debug = 'DEBUG',
    info = 'INFO',
    warn = 'WARN',
    error = 'ERROR',
    fatal = 'FATAL',
    off = 'OFF',
}

// 枚举：日志附加器的索引
enum appenderKeys {
    consoleAppender = 'consoleAppender',
    categoryFilterAppender = 'categoryFilterAppender',
    fileAppender = 'fileAppender',
    logLevelFilterAppender = 'logLevelFilterAppender',
    debugConsoleAppender = 'debugConsoleAppender',
}

const layouts = {
    // [2018-08-03T15:52:18.316] [FATAL] dev - Hello, World
    default: {
        name: 'default',
        type: 'pattern',
        // pattern: '%[[%p%] %d{yyyy/MM/dd hh:mm:ss:SSS}] %m'
        pattern: '%[[%p%] %d{yyyy/MM/dd hh:mm:ss}] %m'
    } as log4js.CustomLayout,
    // detail
    detail: {
        name: 'detail',
        type: 'pattern',
        pattern: '[%d] %[[%p]%] %c - %m'
    } as log4js.CustomLayout,
    // debug(normal console)
    debug: {
        name: 'debug',
        type: 'pattern',
        pattern: '** %m **'
    } as log4js.CustomLayout,
}

/**
 *  更多的Appender参照 type log4js.Appender
 */

// Appender: 日志输出至控制台
const consoleAppender: log4js.ConsoleAppender = {
    type: 'console',
    layout: layouts.default
}

// Appender: debug日志输出至控制台
const debugConsoleAppender: log4js.ConsoleAppender = {
    type: 'console',
    layout: layouts.debug
}

// Appender: 种类过滤
const categoryFilterAppender: any /** (log4js.CategoryFilterAppender)*/ = {
    type: 'categoryFilter',
    exclude: 'dev',
    appender: appenderKeys.debugConsoleAppender,
}

// Appender: 日志输出到文件
const fileAppender: log4js.FileAppender = {
    type: 'file',
    // filename: "./logs/server.log",
    filename: `./logs/${new Date().toISOString().replace('T', ' ').substr(0, 19).replace(' ', '').replace(/-/g,'').replace(/:/g, '')}.log`,
    layout: layouts.default,
}
// Appender: 日志级别过滤
const logLevelFilterAppender: log4js.LogLevelFilterAppender = {
    type: 'logLevelFilter',
    appender: appenderKeys.fileAppender,
    level: Level.debug,
    maxLevel: Level.fatal
}

// 日志配置
const config: log4js.Configuration = {
    // 启用的Appenders
    appenders: {
        debugConsoleAppender: debugConsoleAppender,
        categoryFilterAppender: categoryFilterAppender,
        consoleAppender: consoleAppender,
        fileAppender: fileAppender,
        logLevelFilterAppender: logLevelFilterAppender,
    },
    categories: {
        // 日志类型: 从 base.js 导入的 runMode 应该属于下面的索引之一
        default: {
            appenders: [
                appenderKeys.logLevelFilterAppender
            ],
            level: Level.info
        },
        local: {
            appenders: [
                appenderKeys.consoleAppender
            ],
            level: Level.debug
        },
        dev: {
            // TODO: 考虑配置过滤和自动错误 print error trace
            appenders: [
                appenderKeys.consoleAppender,
                appenderKeys.logLevelFilterAppender,
            ],
            level: Level.debug
        },
        test: {
            appenders: [
                appenderKeys.logLevelFilterAppender
            ],
            level: Level.debug
        },
        prod: {
            appenders: [
                appenderKeys.logLevelFilterAppender
            ],
            level: Level.debug
        }
    },
    pm2: true,
    // pm2InstanceVar: 'INSTANCE_ID',
}

log4js.configure(config)

export const logger = log4js.getLogger(runMode)
// eslint-disable-next-line @typescript-eslint/ban-types
export function requestPathRecorder(req: Request, res: Response, next: Function):void {
    // logger.info(`${req.method} ${req.path} - HTTP/${req.httpVersion} - ${req.headers['user-agent']}`)
    logger.info(`HTTP ${req.httpVersion} ${req.method} ${req.originalUrl}`)
    res.arrivedTime = Date.now()
    next()
}
// eslint-disable-next-line @typescript-eslint/ban-types
export function recordError(err: Error, req: Request, res: Response, next: Function): void {
    if (err instanceof ApiError && err.errType === ErrorRusult.NotFound) return next(err)
    if (err) {
        logger.error('\x1b[31m%s\x1b[40m', err.stack)
        return next(err)
    }
}

/**
 * @override
 */
const _error = logger.error.bind(logger)
logger.error = (...err: Array<string | Error>) => {
    if (err[0] instanceof Error) {
        return _error('\x1b[31m%s\x1b[40m', (err[0] as Error).stack)
    }
    return _error(...err)
}
