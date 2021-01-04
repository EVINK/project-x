import * as sourceMapSupport from 'source-map-support'
import * as log4js from 'log4js'
import { Request, Response } from 'express'
import { Success } from '../errors/api-error'
import { Errors } from '../error-result-types'
import { runMode } from '../../secret'
import { Log4jsConfig } from './log4j-config'

// enable source map support
sourceMapSupport.install()
log4js.configure(Log4jsConfig)
export const logger = log4js.getLogger(runMode)
// eslint-disable-next-line @typescript-eslint/ban-types
export function recordError (err: Error, req: Request, res: Response, next: Function): void {
    if (err instanceof Success && err.err === Errors.NotFound) return next(err)
    if (err) {
        logger.error('\x1b[31m%s\x1b[40m', err.stack)
        return next(err)
    }
}

/**
 * @override
 */
const _error = logger.error.bind(logger)
logger.error = (message, ...err: Array<string | Error>) => {
    if (err[0] instanceof Error) {
        return _error('\x1b[31m%s\x1b[40m', (err[0] as Error).stack)
    }
    return _error(message, ...err)
}
