/**
 * Just a example for demonstration, do not use directly.
*/
import { Auth } from '../utils/auth'
import { Resify } from '../utils/resify'
import { router } from '../base/base'
import { ParamsChecker, PasswordEncryption } from '../utils/helpers'
import { ChineseEthnic, EducationalBackground, User } from '../entity/user'
import { Failed, Success } from '../errors/api-error'
import { Errors } from '../error-result-types'
import { UserService } from '../services/user-service'

router.get('/user', Auth, async (req, res) => {
    const args = new ParamsChecker(req).checkArgs({
        userId: '?str'
    })
    let user: User
    if ('userId' in args) {
        user = await UserService.getUser(1)
        user.removedKeys.push('phone')
    } else user = res.local.user as unknown as User
    Resify.success({ req, res, data: { user } })
})

router.get('/user/password/verificationCode', Auth, (req, res) => {
    // TODO:
    Resify.success({ req, res })
})

router.post('/user/password/reset', Auth, async (req, res) => {
    const args = new ParamsChecker(req).checkArgs({
        password: 'str',
        verificationCode: 'str',
    })
    if (args.verificationCode !== '1234')
        throw new Success(Errors.VerificationCodeError)
    // const user = await User.findOne({ id: res.locals.uid })
    // if (!user) throw new Success(ErrorResult.genErrorResult(
    //     ErrorResult.ResourceNotExists, `:${res.locals.chaosId}`
    // ))
    // user.password = await PasswordEncryption.encrypt(args.password)
    const user = new User({
        id: res.locals.uid,
        password: await PasswordEncryption.encrypt(args.password)
    })
    await user.save()
    await UserService.updateUserCache(user)
    Resify.success({ req, res })
})

export const userHandlers = router