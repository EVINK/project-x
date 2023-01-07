/**
 * Just a example for demonstration, do not use directly.
*/
import { Resify } from '../utils/resify'
import {router } from '../base/base'
import { genRandomStringBaseOnTime, ParamsChecker } from '../utils/helpers'
import { getPrivateDownloadUrl, getUploadToken } from '../base/qiniu'
import { QINIU_SERCRET } from '../../secret'
import { Auth } from '../utils/auth'
import { WorkerDevice } from '../entity/device-info'

router.get('/ping', (req, res) => {
    res.send('PONG!')
})

router.get('/version', (req, res) => {
    Resify.success({
        req, res, data: {
            version: '1.0.0',
            downloadAddress: 'I am downloadAddress',
        }})
})

router.get('/private/url', (req, res) => {
    const args = new ParamsChecker(req).checkArgs({
        key: 'string',
        style: '?string',
        ios: '?bool'
    })
    if (args.style === 'avatar') {
        args.key += '?imageMogr2/thumbnail/50x50!/blur/1x0/quality/75'
    } else if (!args.ios) {
        args.key += '?imageMogr2/format/webp/blur/1x0/quality/75'
    } else {
        args.key += '?imageMogr2/format/jpg/blur/1x0/quality/75'
    }
    const url = getPrivateDownloadUrl(args.key)
    Resify.redirect({ req, res, url})
})

router.get('/upload/token', Auth, (req, res) => {
    const args = new ParamsChecker(req).checkArgs({
        key: '?str'
    })
    const key = args.key? args.key : `${Date.now()}_${Math.floor(Math.random()*1000)}`
    Resify.success({
        req, res, data: {
            token: getUploadToken({keyToOverwrite: key}),
            bucket: QINIU_SERCRET.bucket,
            key,
        }
    })
})

router.get('/system/messages', Auth, (req, res) => {
    const messages = ''
    return Resify.success({req, res, data: {messages}})
})

router.post('/device/register', async (req, res) => {
    const args = new ParamsChecker(req).checkArgs({
        deviceId: '?str',
        userId: '?str',
        platform: '?str',
        model: '?str'
    })
    if (!args.platform || !args.model) return Resify.success({req, res})
    let record = {} as WorkerDevice
    if (args.deviceId) {
        // as additional info
        record = new WorkerDevice({
            id: args.deviceId,
            platform: args.platform,
            modelOrUa: args.model
        })
    } else {
        // as new
        record = new WorkerDevice({
            platform: args.platform,
            modelOrUa: args.model,
            deviceToken: genRandomStringBaseOnTime(64)
        })
    }
    await record.save()
    // we could verifying the valid client request through generating a device-based token
    // but now it is not that necessary
    return Resify.success({ req, res, data: { id: record.id || '', token: record.deviceToken || ''}})
})

export const commonHandlers = router
