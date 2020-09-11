import { Express, Router, Request, Response, NextFunction } from 'express'
import { logger} from "../base/log4j"

export function auth(caller: Express, router: Router) {

    return function (...args: [Request, Response, NextFunction]):void {
        const req = args[1]
        // logger.info(req);
        // req = args[2];
        // 循环取出key， 拿到req
        // logger.info(req.req)
        logger.info('在这里做认证')
        return router.apply(caller, args)
    }

}

