/**
 * Just a example for demonstration, do not use directly.
*/
import { RunMode, runMode } from '../../secret'
import { app, requestInterceptor } from '../base/base'
import { authenticationHandlers } from './authentication-handlers'
import { commonHandlers } from './common-handlers'
import { TestHandler } from './test-handlers'
import { userHandlers } from './user-handlers'

export function APIHandlers (): void {
    app.use(requestInterceptor)
    if (runMode === RunMode.dev)
        app.use('/test', TestHandler)
    app.use('/', authenticationHandlers)
    app.use('/', commonHandlers)
    app.use('/', userHandlers)
}