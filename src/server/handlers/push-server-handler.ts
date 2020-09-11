import { router, app } from "../base/base"
import { Request, Response } from 'express'
import { logger } from "../base/log4j"
import { dbExecutor, mongoClient } from "../base/mongo"
import { MongoClient, Db } from "mongodb"
import { webpush } 'web-push'

/* push service */

router.get('/subscription/add/key.js1', function (req: Request, res, next) {
    const subscription = req.query.subscription
    // {
    //     "endpoint": "https://fcm.googleapis.com/fcm/send/fO2o2-3d9NI:APA91bHidOprO0qFBHrFEM8_gkzNZYIkFAX5hF2O2yjPEjY5Nj6jbyA0EVrIvICbSPVZSllXVJGo2nlGVNIj2lkeVPo1-ZyfXqtcRzJId_LaGjFdyzdTasGwh34fMUQaO4OpS2zUnP4xQwnZDa43Suia_Zz6JG-iUQ",
    //         "expirationTime": null,
    //             "keys": {
    //         "p256dh": "BMo5Y1aw5lIWhEsUjepNSp_ap8keHOqR1yUr_lyIOs4HOe-CwQmFBXcu2FG4HzgrMWe_nGJ6-uCTLrdKAuxDb6c",
    //             "auth": "iCi77eiIZwI7bWIFpiGqEQ"
    //     }
    // }
    const script = 'ToolsBar.subscribeSuccess();'

    // dbExecutor()
    //     .then((db: Db) => {
    //         db.collection('user_subscriptions').insert(JSON.parse(subscription))
    //         return res.send(script)
    //     }).catch((err) => {
    //         logger.info(err)
    //         logger.error(err)
    //         script = `ToolsBar.subscribeFailure('${err}')`
    //         return res.send(script)
    //     })
    res.send('ok')

})

// PublicKey = BPGASesD4Aj8sLxWFnYZ0mfuD4-Q0FepTUhHcoPSu3psp03EU8LJnNvfzuOjcXIAl5XEdGIleK8jy7M-431DhxY
// PrivateKey = XlFDs9y0TxLG8ZSHuDltvHBxYBzZzLvcnrQ90A3M6uw




export const pushServerHandler = router
