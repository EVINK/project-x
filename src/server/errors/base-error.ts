import { ErrorType } from '../error-result-types'

export abstract class BaseError extends Error {

    public err: ErrorType;

    constructor (err: ErrorType, msg?: string) {
        super()
        if (!msg) msg = ''
        this.err = {
            statusCode: err.statusCode,
            errorMsg: err.errorMsg + msg
        }
    }

}