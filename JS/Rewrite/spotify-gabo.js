// QX 版 gabo 伪造响应
// 原版(Surge)用 $done({response:{status,headers,body}}) 直接返回伪造响应，QX 不支持这种写法。
// QX 下必须配合 rewrite 里的 `script-echo-response` 类型，使用 $done({status, headers, body})。
// 作用：拦截 gabo-receiver-service 的广告上报请求，直接回一个 200 空响应。

console.log("自动生成gabo响应");

$done({
  status: "HTTP/1.1 200 OK",
  headers: {
    "cache-control": "no-cache",
    "content-length": "0",
    "server-timing": "edge;dur=666",
    "strict-transport-security": "max-age=31536000",
    "x-content-type-options": "nosniff",
    "alt-svc": 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
    "date": new Date().toUTCString(),
    "server": "envoy",
    "via": "HTTP/2 edgeproxy, 1.1 google"
  },
  body: ""
});
