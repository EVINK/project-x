import { BaseError } from "./base-error"
import { ErrorResultType } from "../error-result-types"

export class ApiError extends BaseError {

    constructor(errType: ErrorResultType){
        super(errType)
    }

}