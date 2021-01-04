export interface ErrorType {
    statusCode: number;
    errorMsg: string;
}

/**
 * @description 枚举类
 * @example ErrorRusltTypeEnum.SampleError
 */
export class Errors {

    public static genErrors
    (data: ErrorType, msg?: string): ErrorType {
        if (!msg) msg = ''
        return {
            statusCode: data.statusCode,
            errorMsg: data.errorMsg + msg
        }
    }

    public static Success: ErrorType = {
        statusCode: 200,
        errorMsg: 'Success'
    }

    public static AccessDenied: ErrorType = {
        statusCode: 403,
        errorMsg: 'Access Denied'
    }

    public static NotFound: ErrorType = {
        statusCode: 404,
        errorMsg: 'Not Found'
    }

    public static InternalError: ErrorType = {
        statusCode: 500,
        errorMsg: 'Internel Error'
    }

    public ArgsError: ErrorType = {
        statusCode: 1001,
        errorMsg: '参数错误'
    }

    public static ArgsError: ErrorType = {
        statusCode: 1001,
        errorMsg: '参数错误'
    }

    public static JWTVerifiedFailed = {
        statusCode: 1002,
        errorMsg: '未认证的用户'
    }

    public static JWTExpired = {
        statusCode: 1003,
        errorMsg: '凭据已过期'
    }

    public static ResourceNotExists = {
        statusCode: 1004,
        errorMsg: '资源不存在'
    }

    public static VerificationCodeError = {
        statusCode: 1005,
        errorMsg: '验证码错误'
    }

    public static PasswordIncorrect = {
        statusCode: 1006,
        errorMsg: '密码错误'
    }

    public static UserAlreadyRegister = {
        statusCode: 1007,
        errorMsg: '用户已注册'
    }

    public static SocketAboutClosing = {
        statusCode: 1008,
        // 客户端到server的连接只能存在一条
        errorMsg: 'Server ends your connection. ignore this warning if new connection has been established.'
    }

}