import { logger } from '../base/log4j'
import { AsyncRedis } from '../base/redis'
import { Errors } from '../error-result-types'
import { Failed } from '../errors/api-error'
import { JsonWebTokenGenerator } from '../utils/JWT'
import { genId, PasswordEncryption } from '../utils/helpers'

export class AgentService {

    private static AGENT_ID_TO_AGENT_HASH = 'agentId:agent:hash'
    private static REFRESH_TOKEN_TO_AID_HASH = 'refresh_token:aid:hash'
    private static AID_TO_REFRESH_TOKEN_HASH = 'aid:refresh_token:hash'

    static getAgentIdByRefreshToken(token: string): Promise<string> {
        return AsyncRedis.hget(this.REFRESH_TOKEN_TO_AID_HASH, token)
    }

    public static async genRefreshToken(chaosUid: string, aid: number | string): Promise<string> {
        // return new Promise(async (resolve, reject) => {
        //     aid = aid.toString()
        //     try {
        //         // 移除旧RefreshToken
        //         const oldToken = await AsyncRedis.hget(this.AID_TO_REFRESH_TOKEN_HASH, aid)
        //         await AsyncRedis.hdel(this.REFRESH_TOKEN_TO_AID_HASH, oldToken)
        //         // 覆盖
        //         const refreshToken = await PasswordEncryption.encrypt(chaosUid)
        //         await AsyncRedis.hset(this.AID_TO_REFRESH_TOKEN_HASH, aid, refreshToken)
        //         await AsyncRedis.hset(this.REFRESH_TOKEN_TO_AID_HASH, refreshToken, aid)
        //         resolve(refreshToken)
        //     } catch (e) {
        //         return reject(e)
        //     }

        // })
        aid = aid.toString()
        // 移除旧RefreshToken
        const oldToken = await AsyncRedis.hget(this.AID_TO_REFRESH_TOKEN_HASH, aid)
        await AsyncRedis.hdel(this.REFRESH_TOKEN_TO_AID_HASH, oldToken)
        // 覆盖
        const refreshToken = await PasswordEncryption.encrypt(chaosUid)
        await AsyncRedis.hset(this.AID_TO_REFRESH_TOKEN_HASH, aid, refreshToken)
        await AsyncRedis.hset(this.REFRESH_TOKEN_TO_AID_HASH, refreshToken, aid)
        return refreshToken
    }

    static async registerAgent({ token, aid }: { token: string, aid: number }): Promise<{ refreshToken: string, g: JsonWebTokenGenerator }> {
        const g = JsonWebTokenGenerator.create({
            chaosId: genId(aid),
            agent: true
        })
        const refreshToken = await this.genRefreshToken(g.payload.chaosId, aid)
        await AsyncRedis.delete(token)
        return { refreshToken, g }
    }

}