import 'reflect-metadata'
import { Connection, QueryRunner, createConnection, getConnection } from 'typeorm'
import { MYSQL_SECRET } from '../../secret'
import { logger } from './log4j'

createConnection({
    name: 'default',
    type: 'mysql',
    host: MYSQL_SECRET.host,
    port: MYSQL_SECRET.port,
    username: MYSQL_SECRET.user,
    password: MYSQL_SECRET.password,
    database: MYSQL_SECRET.database,
    charset: 'utf8mb4',
    // entities: [__dirname + '/../entity/*.ts'],
    entities: [__dirname.slice(0, -11) + 'server/entity/*.js'],
    logging: true,
    logger: 'debug',
    // logger: 'advanced-console', // will log ervery detail
    /* This option will auto sync db schema
       with entities when application launched
     */
    synchronize: true,
    extra: {
        // Connection pools amount
        connectionLimit: 100,
    },
    cache: {
        type: 'redis',
        options: {
            host: MYSQL_SECRET.redis.host,
            port: MYSQL_SECRET.redis.port,
            username: MYSQL_SECRET.redis.name,
            // password: MYSQL_SECRET.redis.password,
            db: MYSQL_SECRET.redis.db,
        },
        duration: 60000, // 60 seconds
    },
}).then((conn) => {
    logger.info('Connection pool to mysql has established')
}).catch((err)=>{throw err})

export class MysqlClient {
    public connection: Connection
    public session: QueryRunner
    private isQueryRunnerReleased = false

    public constructor () {
        // get a connection and create a new query runner
        this.connection = getConnection()
        this.session = this.connection.createQueryRunner()
    }

    public async query (sql: string): Promise<void> {
        try {
            if (this.isQueryRunnerReleased) throw Error('db session is closed')
            // establish real database connection using our new query runner
            await this.session.connect()
            // await this.session.startTransaction()
            const data = await this.session.query(sql)
            // throw Error('test error')
            return data
        } catch (err) {
            throw err
        } finally {
            await this.release()
        }

    }

    public async update (sql?: string): Promise<void> {
        try {
            if (this.isQueryRunnerReleased) throw Error('db session is closed')
            if (!this.session.isTransactionActive) await this.session.startTransaction()
            if (sql) {
                const data = await this.session.query(sql)
                return data
            }
        } catch (err) {
            this.rollback()
            throw err
        }
    }

    public async commit (): Promise<void> {
        try {
            if (this.isQueryRunnerReleased) throw Error('db session is closed')
            await this.session.commitTransaction()
        } catch (err) {
            await this.rollback()
            throw err
        } finally {
            await this.release()
        }

    }

    public async rollback (): Promise<void> {
        try {
            if (this.isQueryRunnerReleased) throw Error('db session is closed')
            await this.session.rollbackTransaction()
        } catch (err) {
            throw err
        } finally {
            await this.release()
        }
    }

    public async release (): Promise<void> {
        if (this.isQueryRunnerReleased) return
        this.isQueryRunnerReleased = true
        try {
            if (!this.session.isReleased)
                await this.session.release()
            // console.log('isQueryRunnerReleased', this.isQueryRunnerReleased)
        } catch (err) {
            this.isQueryRunnerReleased = false
            logger.error(err)
            throw err
        }
    }
}
