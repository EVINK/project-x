import { Express, NextFunction, Request, Response, Router } from 'express'
import { runMode, RunMode } from '../../secret'
import { AgentService } from '../services/agent-service'
import { UserService } from '../services/user-service'
import { decodeId } from './helpers'
import { JsonWebTokenGenerator } from './JWT'
import { Failed } from '../errors/api-error'
import { Errors } from '../error-result-types'

/**
 * @deprecated
 * @param caller
 * @param router
 *
 * Calling this function in your router file.
 * eg:
 *     export const myHandlers = auth(app, router)
 *     app.use('/', myHandlers)
 */
export function auth (caller: Express, router: Router) {

    return function (...args: [Request, Response, NextFunction]):void {
        // const req = args[0]
        // const headers = req.headers
        // const jwtString = headers['authorization']
        // const g = JsonWebTokenGenerator.verified(jwtString)
        return router.apply(caller, args)
    }

}

/**
 *
 * @param req
 * @param res
 * @param next
 */
export async function Auth (req: Request, res: Response, next: NextFunction): Promise<void> {
    const accessToken = req.headers['authorization']
    const g = tokenVerified(accessToken)
    if (g.payload.agent) throw new Failed(Errors.AccessDenied)
    // const uid = runMode === RunMode.dev && g.JWT==='test'? 1 : decodeId(g.payload.chaosId)
    const uid = decodeId(g.payload.chaosId)
    const user = await UserService.getUser(uid)
    res.locals.chaosId = g.payload.chaosId
    res.locals.uid = user.id
    res.locals.user = user
    res.local = res.locals
    next()
}

export function tokenVerified (accessToken?: string):JsonWebTokenGenerator {
    // let g:JsonWebTokenGenerator
    // if (runMode === RunMode.dev && accessToken === 'test') {
    //     g = JsonWebTokenGenerator.fakeOne()
    // } else if (runMode === RunMode.dev && accessToken === 'test-agent') {
    //     g = JsonWebTokenGenerator.fakeOne(true)
    // } else {
    //     g = JsonWebTokenGenerator.verified(accessToken)
    // }
    const g = JsonWebTokenGenerator.verified(accessToken)
    return g
}