import { Request, Response } from 'express'
import { ErrorResultType, ErrorRusult } from '../error-result-types'
import e = require('express')
import { logger } from '../base/log4j'
import { ResifyData } from '../../typings/global'
import { Base } from '../../entity/base'

export class Resify {

    private static resify(req:Request, res: Response, resData: ResifyData ): void
    {
        if (!res)
            throw Error('500 Program try to resify data, but [res: Response] is missing. Abort')
        const now = Date.now()

        const logString = `${req.method} ${req.path} - cost ${now - res.arrivedTime}ms - resData: ${JSON.stringify(resData)}`
        if (resData.success)
            logger.info(logString)
        else
            logger.error(logString)

        if (resData.data) {
            for (const key of Object.keys(resData.data)) {
                const obj = resData.data[key]
                if (obj instanceof Base) resData.data[key] = obj.removeKeys()
            }
        }

        res.json(resData)
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public static success({ req, res, et, data }: { req:Request, res: Response, et?: ErrorResultType, data?: {} }): void
    {
        if (!et)
            et = ErrorRusult.Success

        const resData:ResifyData = {
            code: et.statusCode,
            msg: et.errorMsg,
            success: true,
            data: data
        }
        this.resify(req, res, resData)
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public static error({ req, res, et, data }: { req:Request, res: Response, et?: ErrorResultType, data?: {} }): void
    {
        if (!et)
            et = ErrorRusult.InternelError

        const resData:ResifyData = {
            code: et.statusCode,
            msg: et.errorMsg,
            success: false,
            data: data
        }
        this.resify(req, res, resData)
    }

}
