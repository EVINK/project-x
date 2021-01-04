/* =============================================

                    程序入口

 =============================================== */

import * as fs from 'fs'
fs.readFile('./signature', 'utf8', function (err, data) {
    if (err) return
    logger.info(data)
    init()
})

import * as http from 'http'
import * as express from 'express'
import * as path from 'path'
import * as compression from 'compression'
import * as favicon from 'serve-favicon'
import * as cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser'
import { logger } from './server/base/log4j'

import * as ws from 'ws'
import { initWebSocketListener } from './server/base/wb'

import './server/base/mysql'

import * as ejs from 'ejs'
import { app, base, requestPathRecorder } from './server/base/base'
import { APIHandlers as APIHandler } from './server/handlers'
import { errorHandler } from './server/handlers/error-handlers'
import { RunMode, runMode } from './secret'

// 设置视图层的渲染引擎
app.set('views', path.join(__dirname, base.viewsDir))
app.set('view engine', 'ejs')  // 使用ejs
// eslint-disable-next-line
app.engine('.ejs', (ejs as any).__express)

// compress
app.use(compression())

// 设置网站的favicon
app.use(favicon(path.join(__dirname, base.staticResourceDir, base.faviconFileName)))
app.use(express.static(path.join(__dirname, base.staticResourceDir)))
// 设置静态资源文件目录
app.use(express.static(path.join(__dirname, base.staticResourceDir)))

// 跨域
app.use(function (req, res, next){
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization,X-Refresh-Token')
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE')
    next()
})

// 用以获取POST请求中的body参数的过滤器
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(requestPathRecorder)

APIHandler()
errorHandler()

if (process.env.PORT) {
    app.set('port', process.env.PORT)
} else {
    app.set('port', base.port)
}

const host = base.host
const port = app.get('port')

function init () {
    const server = http.createServer()
    // websocket
    const socketServer = ws.Server
    const wss = new socketServer({ server: server, path: '/notification' })
    initWebSocketListener(wss)
    // express
    server.on('request', app)
    server.listen(port, () => {
        console.log('\n========================================================\n')
        console.log('\x1B[32m%s\x1B[39m \x1B[33m%s\x1b[0m', `[${runMode}]`,
            `Server is running at ${host}:${port}`)
        console.log('\n========================================================\n')
        logger.info(`Server is running at ${host}:${port}`)
    })
    if (runMode === RunMode.dev) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const easyMonitor = require('easy-monitor')
        easyMonitor('main')
    }
}

process.on('unhandledRejection', function (err, promise) {
    promise.catch((e)=> logger.error('System has catched an unhandled rejection:', e))
})
