/**
 * Just a example for demonstration, do not use directly.
*/
import { Resify } from '../utils/resify'
import {router } from '../base/base'
import { Failed, Success } from '../errors/api-error'
import { Errors } from '../error-result-types'
import { AsyncRedis } from '../base/redis'
import { JsonWebTokenGenerator } from '../utils/JWT'
import { logger } from '../base/log4j'
import { User } from '../entity/user'
import { ParamsChecker, PasswordEncryption, genRandomStringBaseOnTime, decodeId } from '../utils/helpers'
import { UserService } from '../services/user-service'
import { AgentService } from '../services/agent-service'
import { ThreadService } from '../services/thread-service'

router.get('/token/refresh', async (req, res) => {
    const headers = req.headers
    // 任意一个旧的AccessToken
    const oldAccessToken = headers['authorization']
    const refreshToken = headers['x-refresh-token']
    if (!oldAccessToken || !refreshToken) throw new Failed(Errors.AccessDenied)
    const generator = JsonWebTokenGenerator.resolve(oldAccessToken)
    let uid
    if (generator.payload.agent)
        uid = await AgentService.getAgentIdByRefreshToken(refreshToken.toString())
    else
        uid = await AsyncRedis.hget(AsyncRedis.REFRESH_TOKEN_TO_UID_HASH, refreshToken.toString())
    // console.log('uid', uid, uid === null) // uid, null, true
    const decodeChaosId = decodeId(generator.payload.chaosId)
    if (parseInt(uid) !== decodeChaosId) {
        logger.debug('AccessToken 和 Refresh Token数据不匹配, uid: decodeId', uid, decodeChaosId)
        throw new Failed(Errors.AccessDenied)
    }
    // 签发新的AccessToken
    const g = JsonWebTokenGenerator.create(generator.payload)
    Resify.success({
        req, res, data: {
            accessToken: g.JWT
        }})
})

// 检查注册状态
router.get('/register/status', async (req, res) => {
    const data = new ParamsChecker(req).checkArgs({
        phone: 'str'
    })
    const phone = data.phone.slice(0,12)
    const token = genRandomStringBaseOnTime(12)
    let isNewUser = false

    const user = await User.findOne({ phone })
    console.log('user', user)

    if (!user) {
        const key = `${AsyncRedis.SEND_VERIFY_CODE}${token}`
        await AsyncRedis.set(key, phone)
        await AsyncRedis.expire(key, 300)
        // throw new ApiError(ErrorResult.genErrorResult(ErrorResult.ResourceNotExists, `: ${phone}`))
        isNewUser = true
    }
    await AsyncRedis.set(token, phone)
    await AsyncRedis.expire(token, 300)
    Resify.success({ req, res, data: {token, isNewUser}})
})

// 发送验证码
router.get('/register/verificationCode', async (req, res) => {
    const data = new ParamsChecker(req).checkArgs({
        token: 'str'
    })
    const key = `${AsyncRedis.SEND_VERIFY_CODE}${data.token}`
    const phone = await AsyncRedis.get(key)
    if (!phone) throw new Failed(Errors.AccessDenied)
    await AsyncRedis.delete(key)
    Resify.success({
        res, req
    })
})

// 新用户注册
router.post('/register', async (req, res) => {
    const data = new ParamsChecker(req).checkArgs({
        token: 'str',
        password: 'str',
        verificationCode: 'str',
    })
    console.log('data', data)

    const phone = await AsyncRedis.get(data.token)
    if (!phone) throw new Failed(Errors.AccessDenied)
    if (data.verificationCode !== '1234') {
        throw new Success(Errors.VerificationCodeError)
    }
    const password = await PasswordEncryption.encrypt(data.password)
    let user = await User.findOne({ phone })
    if (!user) {
        user = new User({
            phone, password
        })
    } else {
        // user.password = password
        throw new Success(Errors.UserAlreadyRegister)
    }
    user = await user.save()
    const d = await UserService.registerUser({ token: data.token, uid: user.id })
    user.attachData.activeIndex = await ThreadService.getActiveIndex({uid: user.id})
    Resify.success({
        req, res, data: {
            user,
            accessToken: d.g.JWT,
            refreshToken: d.refreshToken,
        }
    })
})

// 登录
router.post('/login', async (req, res) => {
    const d = new ParamsChecker(req).checkArgs({
        token: 'str',
        password: 'str',
    })
    const phone = await AsyncRedis.get(d.token)
    if (!phone) throw new Failed(Errors.AccessDenied)
    const user = await User.findOne({ phone })
    if (!user)
        throw new Success(Errors.genErrors(Errors.ResourceNotExists, `: ${phone}`))

    if (!await PasswordEncryption.compare(d.password, user.password))
        throw new Success(Errors.PasswordIncorrect)
    const data = await UserService.registerUser({ token: d.token, uid: user.id })
    user.attachData.activeIndex = await ThreadService.getActiveIndex({uid: user.id})
    Resify.success({
        req, res, data: {
            user,
            accessToken: data.g.JWT,
            refreshToken: data.refreshToken,
        }
    })
})

export const authenticationHandlers = router
