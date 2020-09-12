/* =============================================

                    程序入口

 =============================================== */
import * as ws from 'ws'
import * as http from 'http'
import * as _express from 'express'
import * as log4js from 'log4js'
import * as path from 'path'
import * as favicon from 'serve-favicon'
import * as cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser'
import {
    app,
    base,
    router,
    runMode, // 导入app设定的基本信息
} from './server/base/base'
import { errorHandler } from './server/handlers/error-handler'
import { TestHandler } from './server/handlers/test-handler'
import { pushServerHandler } from './server/handlers/push-server-handler'
import { mainPageRounter } from './server/handlers/main-page-handler'
import { logger, requestPathRecorder } from './server/base/log4j'

import * as ejs  from 'ejs'
import { initWebSocketListener } from './server/base/wb'

import "./server/base/mysql"

import * as fs from 'fs'

fs.readFile('./signature', 'utf8', function (err, data) {
    if(err) console.error(err)
    console.log(data)
    init()
})

// 设置视图层的渲染引擎
app.set('views', path.join(__dirname, base.viewsDir))
app.set('view engine', 'ejs')  // 使用ejs
// eslint-disable-next-line
app.engine('.ejs', (ejs as any).__express)

// 设置网站的favicon
app.use(favicon(path.join(__dirname, base.staticResourceDir, base.faviconFileName)))
app.use(_express.static(path.join(__dirname, base.staticResourceDir)))
// 设置静态资源文件目录
app.use(_express.static(path.join(__dirname, base.staticResourceDir)))

// 跨域
// app.use(function(req, res, next){
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//     next();
// })

// 用以获取POST请求中的body参数的过滤器
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(requestPathRecorder)

app.use('/api', TestHandler)  // api 直接跳
app.use('/push', pushServerHandler)
// app.use('/', router)

// 错误处理
errorHandler()

if (process.env.PORT) {
    app.set('port', process.env.PORT)
}else {
    app.set('port', base.port)
}

const host = base.host
const port = app.get('port')

function init() {
    const server = http.createServer()
    // websocket
    const socketServer = ws.Server
    const wss = new socketServer({ server: server, path: "/chat" })
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
}

