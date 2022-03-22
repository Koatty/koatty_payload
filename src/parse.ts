/*
 * @Author: richen
 * @Date: 2020-11-27 17:34:42
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-03-22 10:06:07
 * @License: BSD (3-Clause)
 * @Copyright (c) - <richenlin(at)gmail.com>
 */
import fs from "fs";
import { parse } from "querystring";
import util from "util";
import getRawBody from "raw-body";
import inflate from "inflation";
import { parseStringPromise } from "xml2js";
import { IncomingForm, BufferEncoding } from "formidable";
import { DefaultLogger as Logger } from "koatty_logger";
import { PayloadOptions } from "./index";
import onFinished from "on-finished";
import { KoattyContext } from "koatty_core";
const fsUnlink = util.promisify(fs.unlink);
const fsAccess = util.promisify(fs.access);
/**
 *
 *
 * @export
 * @param {*} ctx
 * @param {*} options
 * @returns {*}  
 */
export function Parse(ctx: KoattyContext, options: PayloadOptions) {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH', 'LINK', 'UNLINK'];
    if (methods.every((method: string) => ctx.method !== method)) {
        return Promise.resolve({});
    }
    // defaults
    const len = ctx.req.headers['content-length'];
    const encoding = ctx.req.headers['content-encoding'] || 'identity';
    if (len && encoding === 'identity') {
        options.length = ~~len;
    }
    options.encoding = options.encoding || 'utf8';
    options.limit = options.limit || '1mb';

    if (ctx.request.is(options.extTypes.form)) {
        return parseForm(ctx, options);
    }
    if (ctx.request.is(options.extTypes.multipart)) {
        return parseMultipart(ctx, options);
    }
    if (ctx.request.is(options.extTypes.json)) {
        return parseJson(ctx, options);
    }
    if (ctx.request.is(options.extTypes.text)) {
        return parseText(ctx, options);
    }
    if (ctx.request.is(options.extTypes.xml)) {
        return parseXml(ctx, options);
    }

    return Promise.resolve({});
}

/**
 * parse form
 *
 * @param {KoattyContext} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  
 */
async function parseForm(ctx: KoattyContext, opts: PayloadOptions) {
    try {
        const str = await parseText(ctx, opts);
        const data = parse(str);
        return { post: data };
    } catch (error) {
        Logger.Error(error);
        return { post: {} };
    }
}

/**
 * parse multipart
 *
 * @param {KoattyContext} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  
 */
function parseMultipart(ctx: KoattyContext, opts: PayloadOptions) {

    const form = new IncomingForm({
        encoding: <BufferEncoding>opts.encoding,
        multiples: opts.multiples,
        keepExtensions: opts.keepExtensions,
    });

    let uploadFiles: any = null;
    onFinished(ctx.res, () => {
        if (!uploadFiles) {
            return;
        }
        Object.keys(uploadFiles).forEach((key: string) => {
            fsAccess(uploadFiles[key].path).then(() => fsUnlink(uploadFiles[key].path)).catch((err) => Logger.Error(err));
        });
    });
    return new Promise((resolve, reject) => {
        form.parse(ctx.req, function (err, fields, files) {
            if (err) {
                // return reject(err);
                Logger.Error(err);
                return resolve({ post: {}, file: {} });
            }
            uploadFiles = files;
            return resolve({
                post: fields,
                file: files
            });
        });
    });
}

/**
 * parse json
 *
 * @param {KoattyContext} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  
 */
async function parseJson(ctx: KoattyContext, opts: PayloadOptions) {
    try {
        const str = await parseText(ctx, opts);
        const data = JSON.parse(str);
        return { post: data };
    } catch (error) {
        Logger.Error(error);
        return { post: {} };
    }
}

/**
 * parse text
 *
 * @param {KoattyContext} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  {Promise<string>}
 */
function parseText(ctx: KoattyContext, opts: PayloadOptions): Promise<string> {
    return new Promise((resolve, reject) => {
        getRawBody(inflate(ctx.req), opts, function (err: any, body: string) {
            if (err) {
                // reject(err);
                Logger.Error(err);
                return resolve("");
            }
            resolve(body);
        });
    });
}

/**
 * parse xml
 *
 * @param {KoattyContext} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  
 */
async function parseXml(ctx: KoattyContext, opts: PayloadOptions) {
    try {
        const str = await parseText(ctx, opts);
        const data = await parseStringPromise(str);
        return { post: data };
    } catch (error) {
        Logger.Error(error);
        return { post: {} };
    }
}