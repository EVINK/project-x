import { createConnection, getConnection, QueryRunner, Connection } from 'typeorm'
import { logger } from './log4j'
import { NextFunction } from 'express'

createConnection({
    name: 'default',
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'gong-le-duo',
    entities: ['../../entity/*.ts'],
    logging: true,
    logger: 'advanced-console',
    /* This option will auto sync db schema
       with entities when application launched
     */
    synchronize: true,
    extra: {
        // Connection pools amount
        connectionLimit:  100,
    },
    cache: {
        type: 'redis',
        options: {
            host: 'localhost',
            port: 6379,
            username: '',
            // password:'',
            db: 10,
        },
        duration: 30000, // 30 seconds
    },
}).then((conn) => {
    logger.info('Connection pool to mysql has established')
}).catch((err)=>{throw err})

/**
 * 为async/await设计，请在async函数中调用
 */
export class MysqlClient {
    public connection: Connection
    public session: QueryRunner
    private isQueryRunnerReleased = false
    private next:NextFunction

    public constructor(next: NextFunction) {
        // get a connection and create a new query runner
        this.connection = getConnection()
        this.session = this.connection.createQueryRunner()
        this.next = next
    }

    public query(sql: string) {
        return new Promise(async (resolve) => {
            try {
                if(this.isQueryRunnerReleased) return this.next(Error("db session is closed"))
                // establish real database connection using our new query runner
                await this.session.connect()
                // await this.session.startTransaction()
                const data = await this.session.query(sql)
                // throw Error('test error')
                resolve(data)
            } catch (err) {
                /*/错误发生在 resolve 之前，调用方无法获得
                 * 等待的对象，同时Promise内也没有抛出异常
                 * 或者reject。所以不会存在调用方比Next
                 * 更快Response。
                 */
                this.next(err)
                // reject(err)
                // throw err
            } finally {
                await this.release()
            }

        })
    }

    public update(sql: string) {
        return new Promise(async (resolve) => {
            try {
                if (this.isQueryRunnerReleased) return this.next(Error("db session is closed"))
                if(!this.session.isTransactionActive) await this.session.startTransaction()
                const data = await this.session.query(sql)
                resolve(data)
            } catch (err) {
                this.next(err)
            } finally {
                // await this.release()
            }

        })
    }

    public commit() {
        return new Promise(async (resolve) => {
            try {
                if(this.isQueryRunnerReleased) return this.next(Error("db session is closed"))
                await this.session.commitTransaction()
                resolve()
            } catch (err) {
                await this.rollback()
                this.next(err)
            } finally {
                await this.release()
            }
        })

    }

    public rollback() {
        return new Promise(async (resolve) => {
            try {
                if(this.isQueryRunnerReleased) return this.next(Error("db session is closed"))
                await this.session.rollbackTransaction()
                resolve()
            } catch (err) {
                this.next(err)
            } finally {
                await this.release()
            }
        })

    }

    public release() {
        return new Promise(async (resolve) => {
            if(this.isQueryRunnerReleased) return
            this.isQueryRunnerReleased = true
            try {
                await this.session.release()
                // console.log('isQueryRunnerReleased', this.isQueryRunnerReleased)
                resolve()
            } catch (err) {
                this.isQueryRunnerReleased = false
                logger.error(err)
                resolve()
            }
        })
    }
}
