/* =============================================

                    程序入口

 =============================================== */

import * as fs from 'fs'

import * as http from 'http'

import * as cluster from 'cluster'
import * as domain from 'domain'

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

// 集群模式
if (cluster.isMaster) {
    cluster.fork()
    cluster.fork()

    cluster.on('disconnect', function (worker) {
        console.error('disconnect!')
        cluster.fork()
    })
} else {
    const server = http.createServer(function (req, res) {
        const d = domain.create()
        d.on('error', function (er) {
            //something unexpected occurred
            console.error('error', er.stack)
            try {
                //make sure we close down within 30 seconds
                const killtimer = setTimeout(function () {
                    process.exit(1)
                }, 30000)
                // But don't keep the process open just for that!
                killtimer.unref()
                //stop taking new requests.
                server.close()
                //Let the master know we're dead.  This will trigger a
                //'disconnect' in the cluster master, and then it will fork
                //a new worker.
                cluster.worker.disconnect()

                //send an error to the request that triggered the problem
                res.statusCode = 500
                res.setHeader('content-type', 'text/plain')
                res.end('Oops, there was a problem!\n')
            } catch (er2) {
                //oh well, not much we can do at this point.
                console.error('Error sending 500!', (er2 as Error).stack)
            }
        })
        //Because req and res were created before this domain existed,
        //we need to explicitly add them.
        // d.add(req)
        // d.add(res)
        //Now run the handler function in the domain.
        // d.run(function () {
        //You'd put your fancy application logic here.
        // handleRequest(req, res)
        // })
    })

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
    app.use(function (req, res, next) {
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

    app.set('runMode', process.env.NODE_ENV)

    if (process.env.PORT) {
        app.set('port', process.env.PORT)
    } else {
        app.set('port', base.port)
    }

    const host = base.host
    const port = app.get('port')

    function init() {
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
            // const easyMonitor = require('easy-monitor')
            // easyMonitor('main')
        }
    }

    fs.readFile('./signature', 'utf8', function (err, data) {
        if (err) return
        logger.info(data)
        init()
    })

    // 未来的Node版本中将取消这个API
    // 使用Cluster/Domain取代
    process.on('unhandledRejection', function (err, promise) {
        promise.catch((e) => logger.error('System has catched an unhandled rejection:', e))
    })

}

