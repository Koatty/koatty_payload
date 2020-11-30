/*
 * @Author: richen
 * @Date: 2020-11-27 17:34:42
 * @LastEditors: linyyyang<linyyyang@tencent.com>
 * @LastEditTime: 2020-11-30 11:23:26
 * @License: BSD (3-Clause)
 * @Copyright (c) - <richenlin(at)gmail.com>
 */
import fs from "fs";
import qs from "querystring";
import util from "util";
import getRawBody from "raw-body";
import inflate from "inflation";
import { parseStringPromise } from "xml2js";
import { IncomingForm } from "formidable";
import { PayloadOptions } from "./index";
import onFinished from "on-finished";
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
export function Parse(ctx: any, options: PayloadOptions) {
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
 * @param {*} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  
 */
function parseForm(ctx: any, opts: PayloadOptions) {
    return parseText(ctx, opts).then((str: string) => qs.parse(str)).then((data: any) => ({ post: data }));
}

/**
 * parse multipart
 *
 * @param {*} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  
 */
function parseMultipart(ctx: any, opts: PayloadOptions) {
    const form = new IncomingForm();
    form.encoding = opts.encoding;
    form.multiples = opts.multiples;
    form.keepExtensions = opts.keepExtensions;
    // form.hash = opts.hash;
    // form.uploadDir = opts.uploadDir;

    let uploadFiles: any = null;
    onFinished(ctx.res, () => {
        if (!uploadFiles) {
            return;
        }
        Object.keys(uploadFiles).forEach((key: string) => {
            fsAccess(uploadFiles[key].path).then(() => fsUnlink(uploadFiles[key].path)).catch(() => { });
        });
    });
    return new Promise((resolve, reject) => {
        form.parse(ctx.req, function (err, fields, files) {
            if (err) {
                return reject(err);
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
 * @param {*} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  
 */
function parseJson(ctx: any, opts: PayloadOptions) {
    return parseText(ctx, opts).then((str: string) => JSON.parse(str)).then((data: any) => ({ post: data }));
}

/**
 * parse text
 *
 * @param {*} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  {Promise<string>}
 */
function parseText(ctx: any, opts: PayloadOptions): Promise<string> {
    return new Promise((resolve, reject) => {
        getRawBody(inflate(ctx.req), opts, function (err: any, body: string) {
            if (err) {
                reject(err);
            }
            resolve(body);
        });
    });
}

/**
 * parse xml
 *
 * @param {*} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  
 */
function parseXml(ctx: any, opts: PayloadOptions) {
    return parseText(ctx, opts).then((str: string) => parseStringPromise(str)).then((data: any) => ({ post: data }));
}