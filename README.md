# koatty_payload
Payload parser middleware for koatty.

# 使用
-----

Koatty框架默认集成了该中间件，无需引入即可使用。

项目middleware配置 config/middleware.ts:
```
// src/config/middleware.ts
export default {
  list: [], // 加载的插件列表,执行顺序按照数组元素顺序
  config: { // 插件配置
    "PayloadMiddleware": {
        "extTypes": {
            "json": ['application/json'],
            "form": ['application/x-www-form-urlencoded'],
            "text": ['text/plain'],
            "multipart": ['multipart/form-data'],
            "xml": ['text/xml']
        },
        "limit": '20mb',
        "encoding": 'utf-8',
        "multiples": true,
        "keepExtensions": true
    }
  },
};

```
