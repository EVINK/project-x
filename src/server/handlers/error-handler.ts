import { app } from '../base/base'
import { logger, recordError } from '../base/log4j'
import { ApiError } from '../errors/api-error'
import { ErrorRusult } from '../error-result-types'
import { Request, Response } from 'express'
import { Resify } from '../utils/resify'

export const errorHandler = () => {

    // 404 Catcher
    app.use(function (req: Request, res: Response, next: Function) {
        res.statusCode = ErrorRusult.NotFound.statusCode
        next(new ApiError(ErrorRusult.NotFound))
    })

    app.use(recordError)

    // Error handler
    app.use(function (err: any, req: Request, res: Response, next: Function) {

        if (err instanceof ApiError)
            return Resify.error({ req, res, et: err.errType})

        // set locals, only providing error in development
        res.locals.message = err.message
        res.locals.error = req.app.get('env') === 'development' ? err : {}

        // render the error page
        res.status(err.status || 500)
        return Resify.error({req, res})
    })
}