export interface ErrorResultType {
    statusCode: number;
    errorMsg: string;
}

/**
 * @description 枚举类
 * @example ErrorRusltTypeEnum.SampleError
 */
export class ErrorRusult {

    public static Success: ErrorResultType = {
        statusCode: 200,
        errorMsg: 'Success'
    }

    public static AccessDenied: ErrorResultType = {
        statusCode: 403,
        errorMsg: 'Access Denied'
    }

    public static NotFound: ErrorResultType = {
        statusCode: 404,
        errorMsg: 'Not Found'
    }

    public static InternelError: ErrorResultType = {
        statusCode: 500,
        errorMsg: 'Internel Error'
    }

    public ArgsError: ErrorResultType = {
        statusCode: 1001,
        errorMsg: '参数错误'
    }

}