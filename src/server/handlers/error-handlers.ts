import { app } from '../base/base'
import { logger, recordError } from '../base/log4j'
import { Failed, Success } from '../errors/api-error'
import { Errors, ErrorType } from '../error-result-types'
import { NextFunction, Request, Response } from 'express'
import { Resify } from '../utils/resify'

export const errorHandler = () => {

    // 404 Catcher
    app.use(function (req: Request, res: Response, next: NextFunction) {
        res.statusCode = Errors.NotFound.statusCode
        next(new Failed(Errors.NotFound))
    })

    app.use(recordError)

    // Error handler
    app.use(function (err: any, req: Request, res: Response, next: NextFunction) {

        if (err instanceof Success)
            return Resify.success({ req, res, et: err.err })
        if (err instanceof Failed)
            return Resify.error({ req, res, et: err.err })

        // // set locals, only providing error in development
        // res.locals.message = err.message
        // res.locals.error = req.app.get('env') === 'development' ? err : {}

        // render the error page
        res.status(err.status || 500)
        return Resify.error({req, res})
    })
}
