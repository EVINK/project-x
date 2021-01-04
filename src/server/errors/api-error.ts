import { BaseError } from './base-error'
import { ErrorType } from '../error-result-types'

export class Success extends BaseError {

    constructor (err: ErrorType, msg?: string){
        super(err, msg)
    }

}
export class Failed extends BaseError {

    constructor (err: ErrorType, msg?: string){
        super(err, msg)
    }

}