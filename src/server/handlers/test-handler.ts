import { Response, Request, Express } from "express"
import { logger } from "../base/log4j"
import { auth } from "../utils/auth"

import * as express from 'express'
import { Resify } from "../utils/resify"
import { RedisClient } from "../base/redis"
import { getConnection, getManager, Connection } from "typeorm"
import e = require("express")
import { resolve } from "path"
import { MysqlClient } from "../base/mysql"
import { ParamsChecker } from "../utils/helpers"

const router = express.Router()

router.get('/test', function (req: Request, res: Response, next) {
    (async function() {
        // NOTE: Do not throw error in an async function, it will block node
        // throw new Error('test error')
        const rClient = new RedisClient(next)
        await rClient.set('EvinK', new Date().toISOString())
        const date = await rClient.get('EvinK')

        const client = new MysqlClient(next)
        const data = await client.query('SELECT * from question limit 10')
        // console.log('data', data)
        Resify.success({
            req, res, data: {
                key: "value",
                date,
            // d1: data[0],
            // d2: data[1],
            }})
    })()

})

router.get('/redis', function (req: Request, res: Response, next) {
    (async function() {
        const client = new MysqlClient(next)
        const data = await client.update(
            `update question set city_id = ${(Math.random() * 10).toFixed()} where id = 0`
        )
        await client.update(
            `update question set city_id = ${(Math.random() * 10).toFixed()} where id = 1`
        )
        client.commit()

        Resify.success({
            req, res, data: {
                data
            }})
    })()

})

router.get('/params/:name', (req, res, next) => {
    const params = req.params
    console.log('params', params, req.query)

    const data = new ParamsChecker(req).checkArgs({
        name: "str",
        age: "int",
        birth: 'date',
        key: '?float',
        // list: 'list',
        dict: 'json',
    })

    Resify.success({
        req, res, data:{data}
    })
})

router.post('/params/body', (req, res, next) => {
    const body = req.body
    console.log('body', body)

    const data = new ParamsChecker(req).checkArgs({
        name: "str",
        age: "int",
        birth: 'date',
        key: '?float',
        list: 'list',
        dict: 'json',
    })

    Resify.success({
        req, res, data:{data}
    })
})

// 由于被app.use函数调用，这里的this实际指的是全局的app(Express)变量
// NOTE: 但如果单独作为模块被其他文件引用，此处有可能成为bug
export const TestHandler = auth(this as unknown as Express, router)
