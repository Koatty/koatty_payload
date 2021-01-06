/*
 * @Author: richen
 * @Date: 2020-11-27 17:07:25
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2020-12-24 14:42:34
 * @License: BSD (3-Clause)
 * @Copyright (c) - <richenlin(at)gmail.com>
 */
import * as Koa from 'koa';
import * as helper from "koatty_lib";
import { DefaultLogger as logger } from "koatty_logger";
import { Parse } from "./parse";

/**
 * Koatty Application
 *
 * @export
 * @interface Application
 */
export interface Application {
    rootPath: string;
    config(propKey: string, type: string): any;
    on(event: string, callback: () => void): any;
    once(event: string, callback: () => void): any;
}

/**
 *
 *
 * @interface DefaultOptions
 */
export interface PayloadOptions {
    extTypes: {
        json: string[],
        form: string[],
        text: string[],
        multipart: string[],
        xml: string[],
    };
    limit: string;
    encoding: string;
    multiples: boolean;
    keepExtensions: boolean;
    length?: number;
}

/** @type {*} */
const defaultOptions: PayloadOptions = {
    extTypes: {
        json: ['application/json'],
        form: ['application/x-www-form-urlencoded'],
        text: ['text/plain'],
        multipart: ['multipart/form-data'],
        xml: ['text/xml']
    },
    limit: '20mb',
    encoding: 'utf-8',
    multiples: true,
    keepExtensions: true,
};

/**
 *
 *
 * @export
 * @param {PayloadOptions} options
 * @param {*} app Koatty or Koa instance
 */
export function Payload(options: PayloadOptions, app: Application): Koa.Middleware {
    options = { ...defaultOptions, ...options };

    return async (ctx: Koa.Context, next: Koa.Next) => {
        // cached
        helper.define(ctx, '_cache', {
            body: null,
            query: null
        }, true);

        /**
         * request body parser
         *
         * @param {any} name
         * @param {any} value
         * @returns
         */
        helper.define(ctx, 'bodyParser', function () {
            if (!helper.isTrueEmpty(ctx._cache.body)) {
                return ctx._cache.body;
            }
            return Parse(ctx, options).then((res: {

            }) => {
                ctx._cache.body = res || {};
                return ctx._cache.body;
            }).catch((err: any) => {
                logger.Error(err);
                return {};
            });
        });

        /**
         * queryString parser
         *
         * @param {any} name
         * @param {any} value
         * @returns
         */
        helper.define(ctx, 'queryParser', function () {
            if (helper.isTrueEmpty(ctx._cache.query)) {
                ctx._cache.query = { ...(ctx.query), ...(ctx.params || {}) };
            }
            return ctx._cache.query;
        });

        return next();
    };
}