/**
 * Just a example for demonstration, do not use directly.
*/
import { Express, Request, Response } from 'express'
import { logger } from '../base/log4j'

import * as express from 'express'
import { Resify } from '../utils/resify'
import { AsyncRedis } from '../base/redis'
import { MysqlClient } from '../base/mysql'
import { decodeId, genId, ParamsChecker } from '../utils/helpers'
import { EducationalBackground, Gender, User } from '../entity/user'
import { notify } from '../base/wb'
import { UserService } from '../services/user-service'
import { auth } from '../utils/auth'

const router = express.Router()

router.get('/genRefreshToken', async (req: Request, res: Response, next) => {
    // // throw new Error('test error')
    // await AsyncRedis.set('EvinK', new Date().toISOString())
    // const date = await AsyncRedis.get('EvinK')

    // const client = new MysqlClient()
    // const data = await client.query('SELECT * from question limit 10')
    // // console.log('data', data)
    const token = await UserService.genRefreshToken(genId(1), 1)
    // if (1) throw Error('test')
    // const client = new MysqlClient()
    // await client.query('')
    Resify.success({
        req, res, data: {
            token
        }
    })

})

router.get('/error', (req: Request, res: Response) => {
    if (1) throw Error('testing Error')
    Resify.success()
})

router.get('/redis', async (req, res) => {
    await AsyncRedis.set('evink', '1')
    const value = await AsyncRedis.get('evink')
    return Resify.success({data: {value}})
})

router.get('/mysql', async function (req: Request, res: Response, next) {

    const client = new MysqlClient()
    const data = await client.update(
        `update question set city_id = ${(Math.random() * 10).toFixed()} where id = 0`
    )
    await client.update(
        `update question set city_id = ${(Math.random() * 10).toFixed()} where id = 1`
    )
    await client.commit()

    Resify.success({
        req, res, data: {
            data
        }
    })

})

router.get('/params/:name', (req, res, next) => {
    const params = req.params
    console.log('params', params, req.query)

    const data = new ParamsChecker(req).checkArgs({
        name: 'str',
        age: 'int',
        birth: 'date',
        key: '?float',
        list: 'list',
        dict: 'json',
    })

    Resify.success({
        req, res, data: { data }
    })
})

router.post('/params/body', (req, res, next) => {
    const body = req.body
    console.log('body', body)

    const data = new ParamsChecker(req).checkArgs({
        name: 'str',
        age: 'int',
        birth: 'date',
        key: '?float',
        list: 'list',
        dict: 'json',
    })

    Resify.success({
        req, res, data: { data }
    })
})

router.get('/orm', async (req, res, next) => {

    const client = new MysqlClient()
    await client.update()

    // const jobCategory = new JobCategory({
    //     name: 'evink-category2',
    //     noExists: 'test',
    // })
    // // await jobCategory.save()
    // await client.session.manager.save(jobCategory)
    const jobCategory = {}

    const user = new User({
        phone: Math.floor(Math.random() * 100000)
    })
    user.name = 'EvinK'
    user.gender = Gender.Male
    user.avatar = 'test avatar'
    // await user.save() // not using transaction
    await client.session.manager.save(user) // using transaction
    // if(1) throw Error('test error')
    await client.commit() // if not commit, data will not changed in db

    user.attachData.test = jobCategory
    user.attachData.arr = [jobCategory]

    Resify.success({
        req, res, data: { user: [user] }
    })

})

router.get('/async/task', async (req, res) => {
    const promises = []
    for (let i = 0; i < 10; i++)
        promises.push(AsyncRedis.newTask('test'))
    await Promise.all(promises)
    return Resify.success({ req, res })
})

router.get('/notification', async (req, res) => {
    const args = ParamsChecker.checkArgs({
        uid: 'int'
    })
    await notify({
        uid: args.uid, type: 'system', data: {
            message: '这是一个系统消息'
        }
    })
    Resify.success({ req, res })
})

router.get('/decode/id', (req, res) => {
    const args = new ParamsChecker(req).checkArgs({
        uid: '?string'
    })
    let decodeValue
    console.log('res.local', res.local)
    if (!args.uid) decodeValue = decodeId(res.local.chaosId)
    else decodeValue = decodeId(args.uid)
    return Resify.success({ req, res, data: { decodeValue } })

})

// 由于被app.use函数调用，这里的this实际指的是全局的app(Express)变量
// NOTE: 但如果单独作为模块被其他文件引用，此处有可能成为bug
export const TestHandler = auth(this as unknown as Express, router)
