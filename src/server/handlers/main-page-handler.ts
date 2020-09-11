import { router } from "../base/base"
import { logger } from "../base/log4j"
import { NextFunction, Request, Response } from "express"

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    logger.info(typeof req)
    logger.info(typeof res)
    return res.send('index')
})

export const mainPageRounter = router