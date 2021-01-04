/**
 * Just a example for demonstration, do not use directly.
*/
import { ChineseEthnic as ChineseEthnic, User, WorkerProfileCard } from '../entity/user'
import { logger } from '../base/log4j'
import { AsyncRedis } from '../base/redis'
import { Errors } from '../error-result-types'
import { Failed, Success } from '../errors/api-error'
import { PasswordEncryption, genId } from '../utils/helpers'
import { JsonWebTokenGenerator } from '../utils/JWT'

/**
* If not specific, this service is served for `Worker`
*/
export class UserService {

    private static UID_TO_USER_HASH = 'uid:user:hash'

    public static async genRefreshToken (chaosUid: string, userId: number): Promise<string> {
        // /**
        //  * NOTE:
        //  * Q: 在此处使用 throw 抛出错误可以正常执行,而在一个 async Promise-executor 中使用
        //  * throw 却会得到 unhandled promise 的错误。这个错误会导致node程序崩溃, 但是，为啥呢？
        //  *
        //  * A: throw使Promise解析器抛错，但此时的 Promise-executor 返回的也是一个 Promise对象
        //  * (因为async函数)，所以我们在async Promise内部的抛错没有被它自身catch，于是node就抛出
        //  * unhandled promise异常。而大多数时候，Promise-executor 并不返回一个 Promise 对象，
        //  * 所以在 Promise 内部抛错可以正常被调用者正常捕获(catch).
        //  */
        // // if (1) throw (new Failed(Errors.ResourceNotExists))
        // return new Promise(async (resolve, reject) => {
        //     const uid = userId.toString()
        //     try {
        //         // 移除旧RefreshToken
        //         const oldToken = await AsyncRedis.hget(AsyncRedis.UID_TO_REFRESH_TOKEN_HASH, uid)
        //         await AsyncRedis.hdel(AsyncRedis.REFRESH_TOKEN_TO_UID_HASH, oldToken)
        //         // 覆盖
        //         const refreshToken = await PasswordEncryption.encrypt(chaosUid)
        //         await AsyncRedis.hset(AsyncRedis.UID_TO_REFRESH_TOKEN_HASH, uid, refreshToken)
        //         await AsyncRedis.hset(AsyncRedis.REFRESH_TOKEN_TO_UID_HASH, refreshToken, uid)
        //         resolve(refreshToken)
        //     } catch (e) {
        //         // throw e
        //         return reject(e)
        //     }
        // })
        const uid = userId.toString()
        // 移除旧RefreshToken
        const oldToken = await AsyncRedis.hget(AsyncRedis.UID_TO_REFRESH_TOKEN_HASH, uid)
        await AsyncRedis.hdel(AsyncRedis.REFRESH_TOKEN_TO_UID_HASH, oldToken)
        // 覆盖
        const refreshToken = await PasswordEncryption.encrypt(chaosUid)
        await AsyncRedis.hset(AsyncRedis.UID_TO_REFRESH_TOKEN_HASH, uid, refreshToken)
        await AsyncRedis.hset(AsyncRedis.REFRESH_TOKEN_TO_UID_HASH, refreshToken, uid)
        return refreshToken
    }

    /**
     * 登记用户
     */
    static async registerUser ({token, uid}: { token: string, uid: number }):
    Promise<{ refreshToken: string, g: JsonWebTokenGenerator }>
    {
        const g = JsonWebTokenGenerator.create({
            chaosId: genId(uid),
        })
        const refreshToken = await this.genRefreshToken(g.payload.chaosId, uid)
        await AsyncRedis.delete(token)
        return {refreshToken, g}
    }

    /**
     * Get user cache
     */
    static async getUser (userId: number): Promise<User> {
        const uid = userId.toString()
        const user = await AsyncRedis.hget(this.UID_TO_USER_HASH, uid.toString())
        if (!user) {
            const user = await User.findOne({ id: userId})
            if (!user) {
                logger.debug('403, access denied, uid:', uid)
                throw new Failed(Errors.genErrors(
                    Errors.AccessDenied, ':try to access as an non-exists user'
                ))
            }
            await AsyncRedis.hset(this.UID_TO_USER_HASH, uid.toString(),
                JSON.stringify(user.removeKeys({ excludeKeys: ['wxOpenid'], genChaosId: false })))
            return user
        }
        return new User(JSON.parse(user))
    }

    static async updateUserCache (user: User): Promise<void> {
        await AsyncRedis.hdel(this.UID_TO_USER_HASH, user.id.toString())
    }

    static async getWorkerProfileCard (uid:number): Promise<WorkerProfileCard> {
        const profileCard = await WorkerProfileCard.findOne({userId: uid})
        if (!profileCard) throw new Success(Errors.ResourceNotExists)
        for (const ethnic of ChineseEthnic) {
            if (ethnic.id === profileCard.ethnic) profileCard.attachData.ethnicName = ethnic.name
        }
        return profileCard
    }

}