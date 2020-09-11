import * as mongodb from 'mongodb'
import { logger } from './log4j'

export const mongo = mongodb,
    MongoClient = mongo.MongoClient,
    URL = `mongodb://localhost:27017/evink?maxPoolSize=20`,
    dbName = 'evink'

let _database: mongodb.Db

/**
 * 初始化MongoDB的数据库连接
 *
 * @useage:
 *  mongoClient.then((client)=> {
        client.close(true, () => {
            logger.info('连接已关闭');
        });
    });
 *
 * TODO: 维护连接的稳定性
 * TODO: 考虑建立连接池，或者断开自动重连的机制
 *
 */
export const mongoClient = (async function () {
    let client: mongodb.MongoClient
    try {
        client = await MongoClient.connect(URL, { useNewUrlParser: true })
        _database = client.db(dbName)
    } catch (err) {
        return logger.error(err)
    }
    // 关闭连接
    // if (client) {
    //     client.close();
    // }
    logger.info('MongoDB has Connected!')
    return client
})()

/**
 * export 是一个同步操作，而数据库连接是一个异步IO，须借由一个回调进行异步操作。
 * export const db = _database;
 * @returns Promise
 */
export function dbExecutor() {
    return new Promise((resolve) => {
        return resolve(_database)
    })
}


