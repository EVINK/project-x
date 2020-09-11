import { ErrorResultType } from "../error-result-types"

export abstract class BaseError extends Error {

    public errType: ErrorResultType;

    constructor(errType: ErrorResultType) {
        super()
        this.errType = errType
    }

}