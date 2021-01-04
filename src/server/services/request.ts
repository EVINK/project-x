import * as http from 'http'
import * as https from 'https'
import * as http2 from 'http2'
import * as querystring from 'querystring'
import { logger } from '../base/log4j'
import { Failed } from '../errors/api-error'
import { Errors } from '../error-result-types'

export class API {
    private protocol = 'https'
    private debug = false

    private host!: string
    private path = '/'
    private headers = {
        'accept-encoding': 'gzip, deflate, br',
        'content-type': 'application/json; charset=utf-8',
        'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36',
    }

    private options: {
        host: string,
        path: string,
        headers: {[x:string]: string},
        method: 'GET' | 'POST' | 'DELETE' | 'HEAD' | 'PUT',
        port?: number
    } = {
        host: this.host,
        path: this.path,
        headers: this.headers,
        method: 'GET',
    }

    private payload = {}
    private body = {}

    private response?: http.IncomingMessage | string

    private constructor (args: {
        path: string,
        host?: string,
        port?: number
        forcedHttp?: boolean,
        http2?: boolean,
        debug?: boolean,
    }) {
        this.options.host = this.host = args.host ? args.host : 'api.ngrok.evink.cn'
        this.options.path = this.path = args.path ? args.path : '/'
        this.protocol = args.forcedHttp ? 'http' : 'https'
        this.debug = args.debug ? args.debug : false
        if (args.port) this.options.port = args.port
        if (args.http2) this.protocol = 'http2'
    }

    addHeader (headers: { [x: string]: string }): API {
        this.options.headers = Object.assign(this.headers, headers)
        return this
    }

    addPayload (payload: { [x: string]: any }): API {
        this.payload = Object.assign(this.payload, payload)
        return this
    }

    addBody (body: { [x: string]: any }): API {
        this.body = Object.assign(this.body, body)
        return this
    }

    private request<T> (callback?: (data: T, response: http.IncomingMessage)=> void): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.response) return reject(Error('A request already sent... ignored'))
            const api = this.protocol === 'https' ? https : http
            this.options.path = `${this.path}?${querystring.stringify(this.payload)}`
            if (this.options.method === 'GET') this.body = {}

            if (this.debug) {
                logger.debug('Request options:', this.options)
                logger.debug('Request payload:', this.payload)
                logger.debug('Request body:', this.body)
            }

            const request = api.request(this.options, (response) => {
                this.response = response
                response.setEncoding('utf-8')
                let data = ''
                response.on('data', (chunk) =>{
                    data += chunk
                    if (this.debug) logger.debug('Response chunk:', chunk)
                })
                response.on('end', ()=> {
                    if ('content-type' in response.headers && response.headers['content-type']?.toString().includes('application/json'))
                        data = JSON.parse(data)
                    resolve(data as any)
                    if (callback) callback(data as any, response)
                    if (this.debug) logger.debug('Response data:', data)
                })
                response.on('error', (err) => {
                    logger.error('A request to remote server got an error:', err)
                })
            })

            request.write(JSON.stringify(this.body))
            request.end()
        })
    }

    private http2Request<T> (callback?: ((data: T) => void)): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.response) return reject(Error('A request already sent... ignored'))
            let data = ''
            try {
                const client = http2.connect(`https://${this.host}`)
                let path = this.path
                if (Object.keys(this.payload).length > 0) {
                    path = `${this.path}?${querystring.stringify(this.payload)}`
                }
                const options = {
                    ':method': this.options.method,
                    ':path': path,
                    ...this.headers
                }
                const request = client.request(options)
                if (this.debug) {
                    logger.debug('Request options:', this.host, options)
                    logger.debug('Request payload:', this.payload)
                    logger.debug('Request body:', this.body)
                }
                let jsonTypeResponse = false
                request.on('response', (headers, flags) => {
                    if (':status' in headers) logger.info('Response status code: ', headers[':status'])
                    if ('content-type' in headers && headers['content-type']?.includes('application/json'))
                        jsonTypeResponse = true
                })
                request.on('data', chunk => {
                    data += chunk
                    if (this.debug) logger.debug('Response chunk:', chunk)
                })
                request.on('end', () => {
                    client.close()
                    if (jsonTypeResponse) data = JSON.parse(data)
                    resolve(data as any)
                    if (callback) callback(data as any)
                    if (this.debug) logger.debug('Response data:', data)
                    this.response = data
                })
                request.end(JSON.stringify(this.body))
            }
            catch (err) {
                logger.error(err)
                return reject(new Failed(Errors.InternalError))
            }
        })

    }

    static get (args: {
        path: string,
        host?: string,
        port?: number
        forcedHttp?: boolean,
        http2?: boolean,
        debug?: boolean,
    }): API {
        const api = new API(args)
        api.options.method = 'GET'
        return api
    }

    static post (args: {
        path: string,
        host?: string,
        port?: number
        forcedHttp?: boolean,
        http2?: boolean,
        debug?: boolean,
    }): API {
        const api = new API(args)
        api.options.method = 'POST'
        return api
    }

    send (callback?: (data: string | { [x: string]: any }, response?: http.IncomingMessage) => void): Promise<string | { [x: string]: any }> {
        if (this.protocol === 'http2')
            return this.http2Request(callback)
        else
            return this.request(callback)
    }
}

// API.post({ host: '127.0.0.1', port: 9002, path: '/test/params/body', debug: true, forcedHttp: true }).addBody({
//     name: 'evink', age: 12, birth: new Date(), list: [1, 2], dict: {name: 'EvinK'}
// }).send()