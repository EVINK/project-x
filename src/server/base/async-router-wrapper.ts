/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * Copy from https://github.com/davidbanham/express-async-errors
 *
 */
import { Router } from 'express'
// @ts-ignore
import Layer = require('express/lib/router/layer')

const last = (arr = []) => arr[arr.length - 1]
const noop = Function.prototype

function copyFnProps(oldFn: { [x: string]: any }, newFn: { (...args: any[]): any;[x: string]: any }) {
    Object.keys(oldFn).forEach((key) => {
        newFn[key] = oldFn[key]
    })
    return newFn
}

function wrap(fn: { [x: string]: any; apply?: any; length?: any }) {
    const newFn = function newFn(...args: any[]) {
        // @ts-ignore
        const ret = fn.apply(this, args)
        const next = (args.length === 5 ? args[2] : last(args as any)) || noop
        if (ret && ret.catch) ret.catch((err:Error) => next(err))
        return ret
    }
    Object.defineProperty(newFn, 'length', {
        value: fn.length,
        writable: false,
    })
    return copyFnProps(fn, newFn)
}

function patchRouterParam() {
    const originalParam = Router.prototype.constructor.param
    Router.prototype.constructor.param = function param(name: any,
        fn: { (...args: any[]): any;[x: string]: any; apply?: any; length?: any }
    ) {
        fn = wrap(fn)
        return originalParam.call(this, name, fn)
    }
}

Object.defineProperty(Layer.prototype, 'handle', {
    enumerable: true,
    get() {
        return this.__handle
    },
    set(fn) {
        fn = wrap(fn)
        this.__handle = fn
    },
})

patchRouterParam()