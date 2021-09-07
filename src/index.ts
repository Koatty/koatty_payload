/*
 * @Author: richen
 * @Date: 2020-11-27 17:07:25
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-07-12 11:56:57
 * @License: BSD (3-Clause)
 * @Copyright (c) - <richenlin(at)gmail.com>
 */
import * as Koa from 'koa';
import * as helper from "koatty_lib";
import { Koatty, KoattyContext } from "koatty_core";
import { DefaultLogger as logger } from "koatty_logger";
import { Parse } from "./parse";

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
export function Payload(options: PayloadOptions, app: Koatty): Koa.Middleware {
    options = { ...defaultOptions, ...options };

    return async (ctx: KoattyContext, next: Koa.Next) => {
        /**
         * request body parser
         *
         * @param {any} name
         * @param {any} value
         * @returns
         */
        helper.define(ctx, 'bodyParser', function (): any {
            let body = ctx.getMetaData("_body");
            if (!helper.isTrueEmpty(body)) {
                return body;
            }
            return Parse(ctx, options).then((res: any) => {
                body = res || {};
                ctx.setMetaData("_body", body);
                return body;
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
        helper.define(ctx, 'queryParser', function (): any {
            let query = ctx.getMetaData("_query");
            if (!helper.isTrueEmpty(query)) {
                return query;
            }
            query = { ...(ctx.query), ...(ctx.params || {}) };
            ctx.setMetaData("_query", query);
            return query;
        });

        return next();
    };
}