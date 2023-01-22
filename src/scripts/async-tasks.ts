/**
 * Just a example for demonstration, do not use directly.
*/
import * as sourceMapSupport from 'source-map-support'
import * as log4js from 'log4js'
import { Log4jsConfig, LogLayouts } from '../server/base/log4j-config'
import { AsyncRedis } from '../server/base/redis'
import { User } from '../server/entity/user'
import { logger } from '../server/base/log4j'

const logConfig = JSON.parse(JSON.stringify(Log4jsConfig))
// Appender: 日志输出到文件
const fileAppender: log4js.FileAppender = {
    type: 'file',
    // filename: "./logs/server.log",
    filename: `./logs/tasks/async-tasks-${new Date().toISOString().replace('T', ' ').substr(0, 10)}.log`,
    layout: LogLayouts.default,
}
logConfig.appenders.fileAppender = fileAppender
sourceMapSupport.install()
log4js.configure(logConfig)

async function getTask () {
    const promises = []
    while (true) {
        // eslint-disable-next-line no-await-in-loop
        let data: any = await AsyncRedis.lpop(AsyncRedis.ASYNC_TASKS_LIST)
        if (!data) break
        try {
            data = JSON.parse(data) as {task: string, params: any}
            promises.push(handleTask(data.task, data.params))
        } finally { break }
    }
    try {
        await Promise.all(promises)
    } catch (err) {
        logger.error('Error occurred during handle promises...')
        logger.error(err)
        // ignore
    }
}

async function handleTask (task:string, params: any) {
    switch (task) {
        case 'test':
            logger.info('test')
            const user = await User.findOne({ id: 1 })
            logger.info('user', user)
            break
    }
}

setInterval(getTask, 1000)
