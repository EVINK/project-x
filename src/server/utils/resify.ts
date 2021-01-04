import { Request, Response } from 'express'
import { Errors, ErrorType } from '../error-result-types'
import { logger } from '../base/log4j'
import { ResifyData } from '../../typings/global'
import { Base } from '../entity/base'
import { request, response } from '../base/base'
import { genId } from './helpers'

export class Resify {

    private static removeObjectKeys<T> (obj: any): Base<T> | Base<T>[] | undefined {
        if (Array.isArray(obj)) {
            const newArray = []
            for (const d of obj) {
                const v = this.removeObjectKeys(d)
                if (v) newArray.push(v as Base<T>)
                else newArray.push(d)
            }
            return newArray
        }
        else if (obj instanceof Base) {
            return obj.removeKeys()
        }
    }

    static dataPreHandle (data?: { [x: string]: any }): { [x: string]: any } | undefined{
        if (data) {
            for (const key of Object.keys(data)) {
                let obj = data[key]

                if (key === 'id' || key.includes('Id')) {
                    if (Array.isArray(obj)) {
                        const newVal = []
                        for (const d of obj) {
                            newVal.push(genId(d))
                        }
                        obj = newVal
                    } else {
                        obj = genId(obj)
                    }
                    data[key] = obj
                    continue
                }

                const value = this.removeObjectKeys(obj)
                if (value) data[key] = value
            }
        }
        return data
    }

    private static resify (req:Request, res: Response, resData: ResifyData ): void
    {
        if (!res || !req)
            throw Error('500 Program try to resify data, but [res: Response] is missing. Abort')
        resData.data = this.dataPreHandle(resData.data)
        res.json(resData)
        const logString = `${req.method} ${req.originalUrl} - cost ${Date.now() - res.arrivedTime}ms - ${res.get('Content-Length')} bytes - resData: ${JSON.stringify(resData)}`
        if (resData.success)
            logger.info(logString)
        else
            logger.error(logString)
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public static success (args?: { req?:Request, res?: Response, et?: ErrorType, data?: {} }): void
    {
        // eslint-disable-next-line prefer-const
        let { req, res, et, data } = { ...args }
        if (!req) req = request
        if (!res) res = response
        if (!et)
            et = Errors.Success

        const resData:ResifyData = {
            code: et.statusCode,
            msg: et.errorMsg,
            success: true,
            data: data
        }
        this.resify(req, res, resData)
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public static error (args?: { req?:Request, res?: Response, et?: ErrorType, data?: {} }): void
    {
        // eslint-disable-next-line prefer-const
        let { req, res, et, data } = { ...args }
        if (!req) req = request
        if (!res) res = response
        if (!et)
            et = Errors.InternalError

        const resData:ResifyData = {
            code: et.statusCode,
            msg: et.errorMsg,
            success: false,
            data: data
        }
        this.resify(req, res, resData)
    }

    public static redirect ({ req, res, url }: { req?: Request, res?: Response, url: string }): void {
        if (!req) req = request
        if (!res) res = response
        res.redirect(302, url)
        const logString = `${req.method} ${req.originalUrl} - cost ${Date.now() - res.arrivedTime}ms - 302 redirect ${url}`
        logger.info(logString)
    }

}
