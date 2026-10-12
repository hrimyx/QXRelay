/**
 * @title 云智手机
 * @desc 云智手机空间领取兑换
 *
 * @Task 0 6 * * * https://raw.githubusercontent.com/hrimyx/QXRelay/master/JS/CT/yunzhi.js, tag=云智手机, img-url=https://raw.githubusercontent.com/hrimyx/QXRelay/master/Resource/yunzhi.png, enabled=true
 * @param #pollCount=xxx&pollIntervalMs=yyy&notify=zzz
 * 
 * @Rewrite ^https:\/\/yunzhi\.new-gm\.cn\/yunzhi\/api\/benefit\/lobster\/pool\/byUser(?:\?.*)?$ url script-request-header https://raw.githubusercontent.com/hrimyx/QXRelay/master/JS/CT/yunzhi.js
 * @mitm yunzhi.new-gm.cn
 */


const CONFIG = {
    // 可由 Task URL 覆盖的运行参数
    pollCount: "3",          // 状态查询最多次数（1-10）
    pollIntervalMs: "1200",  // 状态查询间隔（1-10000 毫秒）
    notify: "1",              // 1=执行结果通知，0=仅日志
    requestTimeoutMs: 9000,    // 单次请求等待上限

    baseUrl: "https://yunzhi.new-gm.cn",
    paths: {
        popupClaim: "/yunzhi/api/content/home-popups/46/claim",
        userList: "/yunzhi/api/benefit/user/list",
        claim: "/yunzhi/api/benefit/claim",
        status: "/yunzhi/api/benefit/claim/status",
        benefit: "/yunzhi/api/benefit/user/benefit"
    },

    // 源码中两类签名算法分别使用不同密钥，不能任意合并，否则签名会失效。
    h5SignKey: "8822FF81B6623e6f338d6F2A7F49DA83",
    bodySignKey: "7f9e2d08c1b5a3709e4f6d2a8c0e1b3f",
    excludedSignHeaders: [
        "content-length", "host", "connection", "accept-encoding", "user-agent",
        "sign", "content-type", "accept", "device_code", "model", "api_level", "cache-control"
    ]
};

// Task 使用 QX 远程脚本 # 参数；Rewrite 阶段不依赖这些参数。
const args = (typeof $environment !== "undefined" && $environment && $environment.variables) || {};

// QX 的 script-request-header 环境中存在 $request；Task 环境中不存在 $request。
// 此脚本只将同一份代码分别配置为 script-request-header 和 Task。
const IS_REWRITE = typeof $request !== "undefined";

// 多账号身份信息集中保存在一个带项目名前缀的 QX 持久化 Key 中。
// v2 格式：{ version: 2, accounts: [{ id, auth, deviceNo }] }，其中 id 统一为 JWT 中的稳定 userId（形如 "uid:1540939"）。
// 读取时兼容旧版 { auth, deviceNo }，迁移后不会覆盖其他账号。
const PREF_STATE_KEY = "YunzhiQX.State";
const PREF_VERSION = 2;
let activeAccount = null;
let finished = false;

function base64UrlToBytes(input) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const text = String(input || "").replace(/=+$/, "");
    const out = [];
    let buffer = 0, bits = 0;
    for (let i = 0; i < text.length; i++) {
        const index = alphabet.indexOf(text.charAt(i));
        if (index < 0) throw new Error("base64url 字符非法");
        buffer = (buffer << 6) | index;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out.push((buffer >>> bits) & 255);
        }
    }
    return out;
}

function decodeJwtPayloadText(auth) {
    // 解出 JWT 中间段的载荷文本；非 JWT 或解码失败返回空字符串。
    try {
        const parts = String(auth || "").trim().split(".");
        if (parts.length !== 3 || !parts[1]) return "";
        const bytes = base64UrlToBytes(parts[1]);
        if (!bytes.length) return "";
        // 载荷按 Latin-1 还原为文本即可做结构解析与数字扫描（标识字段为纯 ASCII）。
        let text = "";
        for (let i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i] & 255);
        return text;
    } catch (error) {
        return "";
    }
}

function extractUserIdFromJwt(auth) {
    // JWT 载荷中的 userId/sub 是用户的稳定标识，token 刷新后不变。
    // 实测 byUser 请求的载荷为 {"clientType":"h5","userId":1540939,"sub":"1540939",...}，不含手机号。
    const text = decodeJwtPayloadText(auth);
    if (!text) return "";
    let payload = null;
    try { payload = JSON.parse(text); } catch (parseError) { payload = null; }
    if (!payload || typeof payload !== "object") return "";
    const fields = ["userId", "sub", "user_id", "uid", "userOid", "id"];
    for (let i = 0; i < fields.length; i++) {
        const value = payload[fields[i]];
        const str = String(value === undefined || value === null ? "" : value).trim();
        if (/^\d{1,20}$/.test(str) && str !== "0") return str;
    }
    return "";
}

function accountKey(auth) {
    // 统一以 JWT 载荷中的稳定 userId 作为账号唯一标识（形如 "uid:1540939"）；
    // token 刷新后 userId 不变，不会产生重复账号。无法解析时返回空字符串。
    const userId = extractUserIdFromJwt(auth);
    return userId ? "uid:" + userId : "";
}

function cleanAccount(item) {
    if (!item || typeof item !== "object") return null;
    const auth = String(item.auth || "").trim();
    if (auth.length < 20 || auth.toLowerCase() === "null") return null;
    // 账号 id 统一从 token 的 userId 派生；无法解析的记录视为无效。
    const id = accountKey(auth);
    if (!id) return null;
    const deviceNo = String(item.deviceNo || "").trim();
    return {
        id: id,
        auth: auth,
        deviceNo: deviceNo && deviceNo.toLowerCase() !== "null" ? deviceNo : ""
    };
}

function readPrefState() {
    try {
        if (typeof $prefs === "undefined" || !$prefs || typeof $prefs.valueForKey !== "function") {
            return { version: PREF_VERSION, accounts: [] };
        }
        const raw = $prefs.valueForKey(PREF_STATE_KEY);
        if (raw === undefined || raw === null || raw === "") {
            return { version: PREF_VERSION, accounts: [] };
        }
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return { version: PREF_VERSION, accounts: [] };
        }

        let source = Array.isArray(parsed.accounts) ? parsed.accounts : [];
        // 旧版本单账号数据迁移为 accounts 数组。
        if (source.length === 0 && parsed.auth) {
            source = [{ auth: parsed.auth, deviceNo: parsed.deviceNo || "" }];
        }

        const accounts = [];
        source.forEach(function (item) {
            const account = cleanAccount(item);
            if (!account) return;
            const existing = accounts.filter(function (entry) { return entry.id === account.id; })[0];
            if (existing) {
                // 同一账号的历史重复条目合并时，采用后出现的（更新）凭据。
                existing.auth = account.auth;
                if (account.deviceNo) existing.deviceNo = account.deviceNo;
            } else {
                accounts.push(account);
            }
        });
        return { version: PREF_VERSION, accounts: accounts };
    } catch (error) {
        return { version: PREF_VERSION, accounts: [] };
    }
}

function writePrefState(state) {
    try {
        if (typeof $prefs === "undefined" || !$prefs || typeof $prefs.setValueForKey !== "function") return false;
        const source = Array.isArray(state) ? state : (state && Array.isArray(state.accounts) ? state.accounts : []);
        const accounts = [];
        source.forEach(function (item) {
            const account = cleanAccount(item);
            if (!account) return;
            const existing = accounts.filter(function (entry) { return entry.id === account.id; })[0];
            if (existing) {
                // 同一账号的历史重复条目合并时，采用后出现的（更新）凭据。
                existing.auth = account.auth;
                if (account.deviceNo) existing.deviceNo = account.deviceNo;
            } else {
                accounts.push(account);
            }
        });
        const payload = { version: PREF_VERSION, accounts: accounts };
        return $prefs.setValueForKey(JSON.stringify(payload), PREF_STATE_KEY) !== false;
    } catch (error) {
        return false;
    }
}

function listAccounts() {
    return readPrefState().accounts;
}

function upsertAccount(auth, deviceNo) {
    const normalizedAuth = String(auth || "").trim();
    const normalizedDeviceNo = String(deviceNo || "").trim();
    if (normalizedAuth.length < 20 || normalizedAuth.toLowerCase() === "null") return null;
    // 账号 id 统一为 JWT 中的稳定 userId；无法解析则跳过本次采集。
    const id = accountKey(normalizedAuth);
    if (!id) return null;

    const state = readPrefState();
    let account = state.accounts.filter(function (item) { return item.id === id; })[0];
    const isNew = !account;
    if (!account) {
        account = { id: id, auth: "", deviceNo: "" };
        state.accounts.push(account);
    }
    // 只更新本账号的身份字段；缺少 device_no 的请求不抹掉之前捕获的值。
    // 记录 token 是否发生变化，供采集日志/通知标注"更新"。
    const tokenRefreshed = !isNew && account.auth !== normalizedAuth;
    account.auth = normalizedAuth;
    if (normalizedDeviceNo && normalizedDeviceNo.toLowerCase() !== "null") {
        account.deviceNo = normalizedDeviceNo;
    }
    if (!writePrefState(state)) throw new Error("账号凭据写入 QX 持久化存储失败。");
    return {
        id: id,
        auth: normalizedAuth,
        deviceNo: account.deviceNo || normalizedDeviceNo,
        authChanged: isNew,
        tokenRefreshed: tokenRefreshed,
        deviceNoChanged: !!normalizedDeviceNo
    };
}

function migratePrefState() {
    try {
        if (typeof $prefs === "undefined" || !$prefs || typeof $prefs.valueForKey !== "function") return;
        const raw = $prefs.valueForKey(PREF_STATE_KEY);
        if (!raw) return;
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
        if (parsed.version !== PREF_VERSION || !Array.isArray(parsed.accounts)) {
            writePrefState(readPrefState());
        }
    } catch (error) {
        // 损坏的旧状态不阻断脚本；后续成功捕获账号时会写入规范格式。
    }
}

migratePrefState();

function value(name) {
    // 运行参数可通过 Task URL 覆盖；认证参数来自 Rewrite，其余业务参数由 Task 实时请求。
    const overridable = ["pollCount", "pollIntervalMs", "notify"];
    if (overridable.indexOf(name) !== -1 &&
        Object.prototype.hasOwnProperty.call(args, name) && args[name] !== undefined &&
        args[name] !== null && String(args[name]) !== "") {
        return String(args[name]);
    }

    const capturedFields = ["auth", "deviceNo"];
    if (capturedFields.indexOf(name) !== -1) {
        const account = activeAccount || listAccounts()[0] || {};
        const captured = account[name];
        return captured === undefined || captured === null ? "" : String(captured);
    }

    const localValue = CONFIG[name];
    return localValue === undefined || localValue === null ? "" : String(localValue);
}

function notifyEnabled() {
    return value("notify") !== "0";
}

// 每条控制台日志单独输出，确保每一行都以 🆈🆉 开头。
function log(message) {
    String(message === undefined || message === null ? "" : message)
        .split(/\r?\n/)
        .forEach(function (line) {
            console.log("🆈🆉 " + line);
        });
}

function finish(title, subtitle, message) {
    if (finished) return;
    finished = true;
    log("任务结束：" + String(title || "执行结束"));
    if (notifyEnabled()) {
        try {
            $notify("云智手机", String(subtitle || title || "执行结束"), String(message || ""));
        } catch (error) {
            log("通知发送失败：" + String(error));
        }
    }
    $done();
}

function requireFields(fields) {
    const missing = fields.filter(function (field) { return value(field) === ""; });
    if (missing.length) {
        throw new Error("缺少 Rewrite 捕获参数：" + missing.join(", ") + "。请先在云智手机 App 中访问用户权益/云机空间页面和相关权益领取流程，使对应响应经过 Rewrite 后再运行 Task。");
    }
}

function positiveInteger(name, fallback, maxValue) {
    const raw = value(name) || String(fallback);
    if (!/^\d+$/.test(raw)) throw new Error(name + " 必须是正整数。");
    const num = Number(raw);
    if (!Number.isSafeInteger(num) || num <= 0 || (maxValue && num > maxValue)) {
        throw new Error(name + " 超出有效范围。");
    }
    return num;
}

function utf8Bytes(text) {
    const s = String(text);
    const out = [];
    for (let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);
        if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
            const low = s.charCodeAt(i + 1);
            if (low >= 0xDC00 && low <= 0xDFFF) {
                c = 0x10000 + ((c - 0xD800) << 10) + (low - 0xDC00);
                i++;
            }
        }
        if (c < 0x80) {
            out.push(c);
        } else if (c < 0x800) {
            out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
        } else if (c < 0x10000) {
            out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
        } else {
            out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
        }
    }
    return out;
}

function bytesToHex(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i++) out += (bytes[i] & 255).toString(16).padStart(2, "0");
    return out;
}

function md5Bytes(inputBytes) {
    const bytes = inputBytes.slice();
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const low = bitLength >>> 0;
    const high = Math.floor(bitLength / 4294967296) >>> 0;
    for (let i = 0; i < 4; i++) bytes.push((low >>> (8 * i)) & 255);
    for (let i = 0; i < 4; i++) bytes.push((high >>> (8 * i)) & 255);

    const shifts = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    const k = [];
    for (let i = 0; i < 64; i++) k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;

    let a0 = 0x67452301 | 0;
    let b0 = 0xefcdab89 | 0;
    let c0 = 0x98badcfe | 0;
    let d0 = 0x10325476 | 0;

    for (let offset = 0; offset < bytes.length; offset += 64) {
        const m = new Array(16);
        for (let i = 0; i < 16; i++) {
            const p = offset + i * 4;
            m[i] = (bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16) | (bytes[p + 3] << 24)) | 0;
        }
        let a = a0, b = b0, c = c0, d = d0;
        for (let i = 0; i < 64; i++) {
            let f, g;
            if (i < 16) {
                f = (b & c) | (~b & d); g = i;
            } else if (i < 32) {
                f = (d & b) | (~d & c); g = (5 * i + 1) % 16;
            } else if (i < 48) {
                f = b ^ c ^ d; g = (3 * i + 5) % 16;
            } else {
                f = c ^ (b | ~d); g = (7 * i) % 16;
            }
            const sum = (a + f + k[i] + m[g]) | 0;
            const shift = shifts[i];
            const rotated = ((sum << shift) | (sum >>> (32 - shift))) | 0;
            const oldD = d;
            d = c;
            c = b;
            b = (b + rotated) | 0;
            a = oldD;
        }
        a0 = (a0 + a) | 0;
        b0 = (b0 + b) | 0;
        c0 = (c0 + c) | 0;
        d0 = (d0 + d) | 0;
    }

    const out = [];
    [a0, b0, c0, d0].forEach(function (word) {
        out.push(word & 255, (word >>> 8) & 255, (word >>> 16) & 255, (word >>> 24) & 255);
    });
    return out;
}

function md5Hex(text) {
    return bytesToHex(md5Bytes(utf8Bytes(text)));
}

function sha256Bytes(inputBytes) {
    const bytes = inputBytes.slice();
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const high = Math.floor(bitLength / 4294967296) >>> 0;
    const low = bitLength >>> 0;
    bytes.push((high >>> 24) & 255, (high >>> 16) & 255, (high >>> 8) & 255, high & 255);
    bytes.push((low >>> 24) & 255, (low >>> 16) & 255, (low >>> 8) & 255, low & 255);

    const k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let h0 = 0x6a09e667 | 0, h1 = 0xbb67ae85 | 0, h2 = 0x3c6ef372 | 0, h3 = 0xa54ff53a | 0;
    let h4 = 0x510e527f | 0, h5 = 0x9b05688c | 0, h6 = 0x1f83d9ab | 0, h7 = 0x5be0cd19 | 0;

    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

    for (let offset = 0; offset < bytes.length; offset += 64) {
        const w = new Array(64);
        for (let i = 0; i < 16; i++) {
            const p = offset + i * 4;
            w[i] = ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) | 0;
        }
        for (let i = 16; i < 64; i++) {
            const x = w[i - 15], y = w[i - 2];
            const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
            const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
        for (let i = 0; i < 64; i++) {
            const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (h + s1 + ch + k[i] + w[i]) | 0;
            const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (s0 + maj) | 0;
            h = g; g = f; f = e; e = (d + t1) | 0;
            d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
        h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    const out = [];
    [h0, h1, h2, h3, h4, h5, h6, h7].forEach(function (word) {
        out.push((word >>> 24) & 255, (word >>> 16) & 255, (word >>> 8) & 255, word & 255);
    });
    return out;
}

function hmacSha256Hex(message, secret) {
    let key = utf8Bytes(secret);
    const msg = utf8Bytes(message);
    if (key.length > 64) key = sha256Bytes(key);
    while (key.length < 64) key.push(0);
    const inner = [], outer = [];
    for (let i = 0; i < 64; i++) {
        inner.push(key[i] ^ 0x36);
        outer.push(key[i] ^ 0x5C);
    }
    const innerHash = sha256Bytes(inner.concat(msg));
    return bytesToHex(sha256Bytes(outer.concat(innerHash)));
}

function bodySign(bodyFields) {
    const entries = Object.entries(bodyFields || {}).filter(function (entry) {
        return entry[0] !== "sign" && entry[1] !== null && entry[1] !== undefined;
    }).sort(function (a, b) {
        return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
    });
    const canonical = entries.map(function (entry) { return entry[0] + "=" + String(entry[1]); }).join("&") + CONFIG.bodySignKey;
    return md5Hex(canonical);
}

function canonicalParams(params) {
    if (!params) return "";
    return Object.keys(params).sort().filter(function (key) {
        return params[key] !== null && params[key] !== undefined;
    }).map(function (key) { return key + "=" + params[key]; }).join("&");
}

function canonicalBody(body) {
    if (!body) return "";
    let data = body;
    if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (error) { return data; }
    }
    if (typeof data !== "object" || data === null) return String(data);
    return Object.keys(data).sort().filter(function (key) {
        return data[key] !== null && data[key] !== undefined;
    }).map(function (key) {
        const v = data[key];
        return key + "=" + (typeof v === "object" ? JSON.stringify(v) : String(v));
    }).join("&");
}

function canonicalHeaders(headers) {
    const normalized = {};
    Object.entries(headers || {}).forEach(function (entry) {
        const key = entry[0].toLowerCase();
        const val = entry[1];
        if (val === null || val === undefined || CONFIG.excludedSignHeaders.indexOf(key) !== -1) return;
        normalized[key] = String(val);
    });
    return Object.keys(normalized).sort().map(function (key) {
        return key + "=" + normalized[key];
    }).join("&");
}

function h5RequestSign(method, path, params, body, signHeaders) {
    // 前端源码 ed() 使用换行分隔五段，并且规范串末尾保留一个换行。
    const canonical = String(method || "GET").toUpperCase() + "\n" + path + "\n" +
        canonicalParams(params) + "\n" + canonicalBody(body) + "\n" +
        canonicalHeaders(signHeaders) + "\n";
    return hmacSha256Hex(canonical, CONFIG.h5SignKey);
}

function randomRequestId() {
    return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
}

function popupPath() {
    // 按原始脚本保留 ID=46；它不是动态捕获参数。
    return CONFIG.paths.popupClaim;
}

function popupHeaders() {
    requireFields(["auth", "deviceNo"]);
    const signed = {
        request_id: randomRequestId(),
        timestamp: Date.now().toString(),
        version: "10310",
        device_type: "3",
        device_no: value("deviceNo"),
        client_type: "h5",
        channel_code: "00000042",
        api_version: "1",
        authorization: value("auth").replace(/^Bearer\s+/i, "")
    };
    const sign = h5RequestSign("POST", popupPath(), null, null, signed);

    // 只保留领取接口的业务头和签名必需字段；省略浏览器环境的 Origin/Referer/UA 等头。
    return {
        "api_version": signed.api_version,
        "request_id": signed.request_id,
        "version": signed.version,
        "sign": sign,
        "timestamp": signed.timestamp,
        "authorization": signed.authorization,
        "client_type": signed.client_type,
        "device_no": signed.device_no,
        "device_type": signed.device_type,
        "channel_code": signed.channel_code
    };
}

function appHeaders() {
    requireFields(["auth"]);
    return {
        "Accept": "application/json, text/plain, */*",
        "authorization": value("auth").replace(/^Bearer\s+/i, ""),
        "client_type": "app",
        "device_no": "",
        "device_type": "3",
        "Content-Type": "application/json",
        "channel_code": "00000000"
    };
}

function userListHeaders() {
    requireFields(["auth"]);
    return {
        "Accept": "application/json, text/plain, */*",
        "client_type": "app",
        "authorization": value("auth").replace(/^Bearer\s+/i, ""),
        "device_no": "",
        "device_type": "3",
        "channel_code": "00000042"
    };
}

function requestJSON(path, method, headers, body) {
    const request = {
        url: CONFIG.baseUrl + path,
        method: String(method || "GET").toUpperCase(),
        headers: headers || {}
    };
    if (body !== undefined && body !== null) request.body = JSON.stringify(body);

    return new Promise(function (resolve, reject) {
        let settled = false;
        const timer = setTimeout(function () {
            settleReject(new Error("请求等待超过 " + CONFIG.requestTimeoutMs + " 毫秒，已按超时处理。"));
        }, CONFIG.requestTimeoutMs);

        function settleResolve(result) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(result);
        }

        function settleReject(error) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            reject(error instanceof Error ? error : new Error(String(error)));
        }

        try {
            $task.fetch(request).then(function (response) {
                if (settled) return;
                try {
                    if (!response) throw new Error("接口没有返回 Response。");
                    const statusCode = Number(response.statusCode);
                    if (!Number.isFinite(statusCode) || statusCode < 200 || statusCode >= 300) {
                        throw new Error("HTTP 状态异常：" + String(response.statusCode));
                    }

                    let result;
                    try {
                        result = JSON.parse(response.body || "{}");
                    } catch (error) {
                        throw new Error("响应不是有效 JSON：" + String(error));
                    }
                    if (!result || typeof result !== "object") throw new Error("接口 JSON 结构异常。");
                    if (Number(result.code) !== 0 && Number(result.code) !== 200) {
                        throw new Error("接口业务错误：code=" + String(result.code) + "，message=" + String(result.message || "无错误说明"));
                    }
                    settleResolve(result);
                } catch (error) {
                    settleReject(error);
                }
            }, function (reason) {
                const detail = reason && reason.error ? reason.error : reason;
                settleReject(new Error("网络请求失败：" + String(detail || "未知错误")));
            });
        } catch (error) {
            settleReject(error);
        }
    });
}

function getJSON(path, headers) {
    return requestJSON(path, "GET", headers);
}

function postJSON(path, headers, body) {
    return requestJSON(path, "POST", headers, body);
}

// 抓包中的时间字符串为服务端中国时区时间（UTC+8），显式按 UTC+8 解析，避免设备时区影响有效性判断。
function parseChinaDateTime(valueText) {
    const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(String(valueText || ""));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6]);
    const check = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 ||
        check.getUTCDate() !== day || check.getUTCHours() !== hour ||
        check.getUTCMinutes() !== minute || check.getUTCSeconds() !== second) return null;
    // 服务端时间按 UTC+8 解释；转成 UTC 时间戳供 Date.now() 比较。
    return Date.UTC(year, month - 1, day, hour - 8, minute, second);
}

function isEligibleUserItem(item, now) {
    if (!item || !/^\d+$/.test(String(item.userItemId || ""))) return false;
    const id = Number(item.userItemId);
    if (!Number.isSafeInteger(id) || id <= 0) return false;
    const expiresAt = parseChinaDateTime(item.expireTime);
    const startsAt = parseChinaDateTime(item.startTime);
    if (expiresAt === null || expiresAt <= now) return false;
    if (startsAt !== null && startsAt > now) return false;
    return true;
}

function extractResourceId(data) {
    if (!data || typeof data !== "object") return "";
    const devices = Array.isArray(data.cloudDevices) ? data.cloudDevices : [];
    const candidates = [];
    devices.forEach(function (device) {
        const id = device && (device.vendorResourceId || device.resourceId || device.resource_id);
        if (id !== undefined && id !== null && String(id).trim() !== "") {
            const normalized = String(id).trim();
            if (candidates.indexOf(normalized) === -1) candidates.push(normalized);
        }
    });

    const direct = data.resourceId || data.vendorResourceId || data.resource_id;
    const directId = direct !== undefined && direct !== null && String(direct).trim() !== ""
        ? String(direct).trim()
        : "";
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
        if (directId && candidates.indexOf(directId) !== -1) return directId;
        throw new Error("接口返回多个不同的云机 resourceId，无法唯一确定目标云机。");
    }
    return directId;
}

function requestUserItemId() {
    // 每次 Task 都重新读取最新 userItemId、benefitConfigId；不复用 Rewrite 保存的业务数据。
    return getJSON(CONFIG.paths.userList, userListHeaders()).then(function (result) {
        const data = result.data && typeof result.data === "object" ? result.data : {};
        const benefits = Array.isArray(data.benefits) ? data.benefits : [];
        const targetBenefit = selectCloudBenefit(benefits);
        if (!targetBenefit) {
            throw new Error("user/list 响应中无法唯一识别云机空间权益，已停止兑换以避免误选。");
        }

        const configValue = targetBenefit.benefitConfigId;
        if (configValue === undefined || configValue === null || String(configValue).trim() === "") {
            throw new Error("user/list 的云机空间权益没有返回 benefitConfigId。");
        }
        const benefitConfigId = String(configValue).trim();
        const items = Array.isArray(targetBenefit.userItems) ? targetBenefit.userItems : [];
        const eligible = items.filter(function (item) { return isEligibleUserItem(item, Date.now()); });
        eligible.sort(function (a, b) {
            return (parseChinaDateTime(b.startTime) || 0) - (parseChinaDateTime(a.startTime) || 0);
        });
        if (!eligible.length) {
            const quota = targetBenefit.remainingQuota;
            throw new Error("user/list 中没有未过期且已生效的 userItemId。remainingQuota=" +
                String(quota === undefined ? "未返回" : quota));
        }

        const selected = eligible[0];
        const benefitName = String(targetBenefit.benefitName || benefitConfigId);
        const listResourceId = extractResourceId(targetBenefit);
        const resultItem = {
            userItemId: String(selected.userItemId),
            benefitConfigId: benefitConfigId,
            resourceId: listResourceId,
            benefitName: benefitName,
            startTime: String(selected.startTime || "未返回"),
            expireTime: String(selected.expireTime || "未返回")
        };

        // 若 user/list 没有提供 resourceId，则通过当前配置对应的 user/benefit 接口即时读取。
        if (resultItem.resourceId) {
            resultItem.message = "已从本次 user/list 获取最新权益；权益=" + benefitName +
                "；开始=" + resultItem.startTime + "；记录到期=" + resultItem.expireTime +
                "；resourceId 已获取";
            return resultItem;
        }
        return requestBenefit(benefitConfigId).then(function (benefitResult) {
            resultItem.resourceId = extractResourceId(benefitResult.data);
            if (!resultItem.resourceId) {
                throw new Error("user/list 与 user/benefit 均未返回 resourceId，无法安全兑换。");
            }
            resultItem.message = "已从本次 user/list 获取最新权益；resourceId 由 user/benefit 即时补齐；权益=" +
                benefitName + "；开始=" + resultItem.startTime + "；记录到期=" + resultItem.expireTime;
            return resultItem;
        });
    });
}

function requestPopup() {
    return postJSON(popupPath(), popupHeaders(), undefined).then(function (result) {
        const data = result.data && typeof result.data === "object" ? result.data : {};
        const message = "success=" + String(data.success) + "；claimed=" + String(data.claimed) +
            (data.claimNo ? "；claimNo=" + String(data.claimNo) : "") +
            (data.failReason ? "；原因=" + String(data.failReason) : "");
        if (data.success !== true || data.claimed !== true) {
            throw new Error("领取权益未确认成功，停止后续兑换。接口返回：" + message);
        }
        return { data: data, message: message };
    });
}

function requestClaim(userItemId, resourceId) {
    const idRaw = String(userItemId || "");
    if (!/^\d+$/.test(idRaw) || !Number.isSafeInteger(Number(idRaw)) || Number(idRaw) <= 0) {
        throw new Error("userItemId 必须是有效的正整数。");
    }
    const resourceIdValue = String(resourceId || "").trim();
    if (!resourceIdValue) throw new Error("本次接口响应没有提供有效 resourceId，无法兑换。");
    const timestamp = Date.now().toString();
    const fields = { userItemId: Number(idRaw), timestamp: timestamp, resourceId: resourceIdValue };
    const payload = { userItemId: fields.userItemId, timestamp: timestamp, sign: bodySign(fields), resourceId: fields.resourceId };
    return postJSON(CONFIG.paths.claim, appHeaders(), payload).then(function (result) {
        const data = result.data && typeof result.data === "object" ? result.data : {};
        return { data: data, message: "claimId=" + String(data.claimId || "未返回") + "；status=" + String(data.status) + (data.errorMsg ? "；错误=" + String(data.errorMsg) : "") };
    });
}

function requestStatus(claimId) {
    const idRaw = String(claimId || "");
    if (!/^\d+$/.test(idRaw) || !Number.isSafeInteger(Number(idRaw)) || Number(idRaw) <= 0) {
        throw new Error("claimId 必须是有效的正整数。");
    }
    const timestamp = Date.now().toString();
    const fields = { claimId: Number(idRaw), timestamp: timestamp };
    const payload = { claimId: fields.claimId, timestamp: timestamp, sign: bodySign(fields) };
    return postJSON(CONFIG.paths.status, appHeaders(), payload).then(function (result) {
        const data = result.data && typeof result.data === "object" ? result.data : {};
        let statusText = "未知状态（status=" + String(data.status) + "）";
        if (Number(data.status) === 1) statusText = "发放成功（status=1）";
        else if (Number(data.status) === 0) statusText = "处理中或尚未完成（status=0）";
        return { data: data, message: "claimId=" + String(data.claimId || idRaw) + "；" + statusText + (data.errorMsg ? "；错误=" + String(data.errorMsg) : "") };
    });
}

function requestBenefit(benefitConfigId) {
    requireFields(["auth"]);
    const configId = String(benefitConfigId || "").trim();
    if (!/^\d+$/.test(configId)) throw new Error("本次 user/list 没有提供有效 benefitConfigId。");
    const timestamp = Date.now().toString();
    const fields = { benefitConfigId: configId, timestamp: timestamp };
    const payload = { benefitConfigId: fields.benefitConfigId, timestamp: timestamp, sign: bodySign(fields) };
    return postJSON(CONFIG.paths.benefit, appHeaders(), payload).then(function (result) {
        const data = result.data && typeof result.data === "object" ? result.data : {};
        const devices = Array.isArray(data.cloudDevices) ? data.cloudDevices : [];
        let message;
        if (!devices.length) {
            message = "接口成功，但 cloudDevices 为空；权益名称=" + String(data.benefitName || "未返回");
        } else {
            message = devices.map(function (device, index) {
                if (!device || typeof device !== "object") return "云机 " + (index + 1) + "：数据结构异常";
                return "云机 " + (index + 1) + "：到期=" + String(device.expireTime || "未返回") +
                    "；规格=" + String(device.flavor || "未返回") +
                    "；状态=" + String(device.status === undefined ? "未返回" : device.status);
            }).join("\n");
        }
        return { data: data, message: message };
    });
}

function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

// -------------------------- Rewrite 参数采集区 --------------------------
// script-request-header 规则只匹配 /benefit/lobster/pool/byUser，从请求头采集身份信息。
// 仅持久化 Task 无法自行恢复的 Authorization 与 device_no；本阶段不读取或修改响应体。
function captureLog(message) {
    String(message || "").split(/\r?\n/).forEach(function (line) {
        console.log("🆈🆉 [参数采集] " + line);
    });
}

function getHeaderIgnoreCase(headers, name) {
    const target = String(name || "").toLowerCase();
    const keys = Object.keys(headers || {});
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].toLowerCase() === target) return headers[keys[i]];
    }
    return "";
}

function captureRequestIdentity() {
    const currentRequest = (typeof $request !== "undefined" && $request) || {};
    const requestHeaders = currentRequest.headers || {};
    const requestAuth = String(getHeaderIgnoreCase(requestHeaders, "authorization") || "")
        .replace(/^Bearer\s+/i, "").trim();
    const requestDeviceNo = String(getHeaderIgnoreCase(requestHeaders, "device_no") || "").trim();
    // 账号 id 统一为 JWT 中的稳定 userId；解析不出则视为无效身份。
    const requestId = accountKey(requestAuth);
    const validAuth = requestId !== "" && requestAuth.toLowerCase() !== "null";
    const validDeviceNo = requestDeviceNo !== "" && requestDeviceNo.toLowerCase() !== "null";
    if (!validAuth) {
        return {
            id: "", auth: "", deviceNo: requestDeviceNo,
            authValid: false, deviceNoValid: validDeviceNo,
            authChanged: false, deviceNoChanged: false
        };
    }

    const saved = listAccounts().filter(function (account) {
        return account.id === requestId;
    })[0];
    const identity = upsertAccount(requestAuth, validDeviceNo ? requestDeviceNo : "");
    identity.authValid = true;
    identity.deviceNoValid = validDeviceNo || !!identity.deviceNo;
    identity.authChanged = !saved;
    identity.deviceNoChanged = validDeviceNo && (!saved || saved.deviceNo !== requestDeviceNo);
    return identity;
}

function isCloudBenefit(benefit) {
    if (!benefit || typeof benefit !== "object") return false;
    const matchType = String(benefit.matchType || benefit.resourceType || benefit.benefitType || "").toUpperCase();
    if (matchType === "CLOUD_DEVICE" || matchType === "CLOUD_PHONE" || matchType === "CLOUD_MACHINE") return true;
    const name = String(benefit.benefitName || benefit.name || benefit.title || "");
    if (/云机空间|云机服务|云端设备|云手机空间/.test(name)) return true;
    const devices = Array.isArray(benefit.cloudDevices) ? benefit.cloudDevices : [];
    return devices.some(function (device) {
        return device && (device.vendorResourceId || device.resourceId);
    });
}

function selectCloudBenefit(benefits) {
    if (!Array.isArray(benefits)) return null;
    const cloudType = benefits.filter(function (benefit) {
        const type = String(benefit && (benefit.matchType || benefit.resourceType || benefit.benefitType) || "").toUpperCase();
        return type === "CLOUD_DEVICE" || type === "CLOUD_PHONE" || type === "CLOUD_MACHINE";
    });
    if (cloudType.length === 1) return cloudType[0];
    const byName = benefits.filter(function (benefit) {
        const name = String(benefit && (benefit.benefitName || benefit.name || benefit.title) || "");
        return /云机空间|云机服务|云端设备|云手机空间/.test(name);
    });
    if (byName.length === 1) return byName[0];
    const byDevice = benefits.filter(function (benefit) {
        return isCloudBenefit(benefit);
    });
    if (byDevice.length === 1) return byDevice[0];
    // 不因为“恰好只有一项有有效 userItems”就推断它是云机权益，避免误选其他权益。
    return null;
}


function truncateForNotice(text, maxLength) {
    const s = String(text === undefined || text === null ? "" : text);
    const limit = Math.max(16, Number(maxLength) || 64);
    if (s.length <= limit) return s;
    const headLength = Math.max(8, limit - 22);
    return s.slice(0, headLength) + "…[已省略，共" + s.length + "字符]…" + s.slice(-8);
}

function captureRewriteRequestHeader() {
    let identity = null;
    try {
        identity = captureRequestIdentity();
        if (!identity.authValid) {
            captureLog("未采集到有效账号身份，已跳过。");
        } else {
            // 日志关键结果与通知内容保持一致，同出一份数据。
            // 新账号→"获取"；token 刷新或 device_no 变更→"更新"（打日志+通知）；无变化→只记一行。
            const changed = identity.authChanged || identity.tokenRefreshed || identity.deviceNoChanged;
            if (!changed) {
                captureLog(identity.id + " 参数无变化");
            } else {
                const action = identity.authChanged ? "获取" : "更新";
                const lines = [
                    identity.id + " 参数" + action,
                    "auth: " + truncateForNotice(identity.auth, 48),
                    "device_no: " + (identity.deviceNo ? truncateForNotice(identity.deviceNo, 24) : "[未捕获]"),
                    "已记录账号: " + listAccounts().map(function (account) { return account.id; }).join(",")
                ];
                lines.forEach(function (line) { captureLog(line); });

                if (notifyEnabled()) {
                    try {
                        $notify("云智手机", lines[0], lines.slice(1).join("\n"));
                    } catch (notifyError) {
                        captureLog("采集通知发送失败：" + String(notifyError));
                    }
                }
            }
        }
    } catch (error) {
        captureLog("本次请求身份采集失败：" + String(error && error.message ? error.message : error));
    }
    // script-request-header 仅采集请求头，不修改请求；结束后交回原请求。
    $done();
}

// -------------------------- Task 任务执行区 --------------------------
if (IS_REWRITE) {
    captureRewriteRequestHeader();
} else if (typeof $task === "undefined" || !$task || typeof $task.fetch !== "function") {
    $done();
} else {
!(async function () {
    try {
        const accounts = listAccounts();
        if (!accounts.length) {
            finish("没有可用账号", "请先采集账号", "请在云智手机 App 中分别登录各账号，并访问用户权益/云机空间页面，确保匹配请求经过 Rewrite 规则。");
            return;
        }

        const pollCount = positiveInteger("pollCount", 3, 10);
        const pollIntervalMs = positiveInteger("pollIntervalMs", 1200, 10000);
        const results = [];
        log("检测到 " + accounts.length + " 个账号，开始按顺序执行。");

        for (let accountIndex = 0; accountIndex < accounts.length; accountIndex++) {
            const account = accounts[accountIndex];
            activeAccount = account;
            let step = "参数校验";
            let claimId = "";
            let statusSummary = "发放状态未确认";
            let expirySummary = "云机到期时间未返回";
            const label = "账号 " + (accountIndex + 1) + "/" + accounts.length + " [" + account.id + "]";

            try {
                requireFields(["auth", "deviceNo"]);
                log("开始处理 " + label + "：领取 → 兑换 → 查询发放状态 → 查询云机有效期");

                step = "第 1/4 步：领取权益";
                const popupResult = await requestPopup();
                log(label + " 1/4 领取权益：成功；" + popupResult.message);

                step = "兑换前置查询：获取 userItemId";
                const userItem = await requestUserItemId();
                log(label + " 兑换前置查询：" + userItem.message);

                step = "第 2/4 步：兑换权益";
                const claimResult = await requestClaim(userItem.userItemId, userItem.resourceId);
                claimId = String(claimResult.data && claimResult.data.claimId || "");
                log(label + " 2/4 兑换权益：" + claimResult.message);
                if (!/^\d+$/.test(claimId) || !Number.isSafeInteger(Number(claimId)) || Number(claimId) <= 0) {
                    throw new Error("兑换接口未返回有效 claimId，无法查询发放状态。");
                }

                step = "第 3/4 步：查询发放状态";
                let statusResult = null;
                let statusError = "";
                for (let i = 0; i < pollCount; i++) {
                    try {
                        statusResult = await requestStatus(claimId);
                    } catch (error) {
                        statusError = String(error && error.message ? error.message : error);
                        break;
                    }
                    const status = Number(statusResult.data && statusResult.data.status);
                    if (status === 1 || status !== 0) break;
                    if (i < pollCount - 1) await sleep(pollIntervalMs);
                }

                if (statusError) {
                    statusSummary = "发放状态查询失败";
                    log(label + " 3/4 发放状态：查询失败；" + statusError);
                } else if (statusResult) {
                    const status = Number(statusResult.data && statusResult.data.status);
                    statusSummary = status === 1 ? "发放成功" : (status === 0 ? "发放仍在处理中" : "发放状态未知");
                    log(label + " 3/4 发放状态：" + statusResult.message + (status === 0 ? "；轮询次数=" + pollCount : ""));
                } else {
                    statusSummary = "未获得发放状态";
                    log(label + " 3/4 发放状态：未获得查询结果");
                }

                step = "第 4/4 步：查询云机空间最新有效期";
                const benefitResult = await requestBenefit(userItem.benefitConfigId);
                log(label + " 4/4 云机空间有效期：" + benefitResult.message);

                const devices = Array.isArray(benefitResult.data && benefitResult.data.cloudDevices)
                    ? benefitResult.data.cloudDevices : [];
                const expiries = devices.map(function (device) {
                    return device && device.expireTime ? String(device.expireTime) : "";
                }).filter(Boolean);
                if (expiries.length) expirySummary = "云机到期：" + expiries.join("、");

                const ok = !statusError && statusResult && Number(statusResult.data && statusResult.data.status) === 1;
                results.push({
                    ok: !!ok,
                    label: label,
                    message: "兑换已提交（claimId=" + claimId + "）｜" + statusSummary + "｜" + expirySummary +
                        (statusError ? "｜状态查询错误：" + statusError : "")
                });
                log(label + " 流程结束：" + (ok ? "成功" : "已执行，但发放状态未确认成功"));
            } catch (error) {
                const errorMessage = String(error && error.message ? error.message : error);
                log(label + " 流程中断：" + step + "；原因=" + errorMessage);
                results.push({ ok: false, label: label, message: "失败步骤：" + step + "；" + errorMessage.slice(0, 220) });
                // 一个账号失败只记录结果，继续下一个账号。
            }
        }

        activeAccount = null;
        const successCount = results.filter(function (item) { return item.ok; }).length;
        const failCount = results.length - successCount;
        const detail = results.map(function (item) {
            return (item.ok ? "✅ " : "⚠️ ") + item.label + "：" + item.message;
        }).join("\n");
        const title = failCount === 0 ? "多账号执行完成" : (successCount ? "多账号部分完成" : "多账号执行失败");
        const subtitle = "成功 " + successCount + " 个，未确认成功 " + failCount + " 个，共 " + results.length + " 个账号";
        finish(title, subtitle, detail.slice(0, 1800));
    } catch (error) {
        activeAccount = null;
        const errorMessage = String(error && error.message ? error.message : error);
        log("任务初始化失败：" + errorMessage);
        finish("任务初始化失败", "参数或持久化数据异常", errorMessage.slice(0, 220));
    }
})();
}
