import * as qiniu from 'qiniu'
import { QINIU_SERCRET } from '../../secret'

const mac = new qiniu.auth.digest.Mac(QINIU_SERCRET.accessKey, QINIU_SERCRET.secretKey)

export function getUploadToken (
    { bucket, keyToOverwrite }: { bucket?: string, keyToOverwrite?: string }
): string {
    if (!bucket) bucket = QINIU_SERCRET.bucket
    if (!keyToOverwrite) keyToOverwrite = ''
    else keyToOverwrite = `:${keyToOverwrite}`
    const options = {
        scope: `${bucket}${keyToOverwrite}`
    }
    const putPolicy = new qiniu.rs.PutPolicy(options)
    return putPolicy.uploadToken(mac)
}

export function getPrivateDownloadUrl (key:string):string {
    // const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(mac)
    const deadline = Math.floor(Date.now() / 1000) + 3600 * 12
    return bucketManager.privateDownloadUrl(QINIU_SERCRET.domain, key, deadline)
}