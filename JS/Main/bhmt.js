/**
 * @fileoverview 巴哈姆特 每日签到
 * @supported Quantumult X (v1.5.6-build918+)
 *
 * https://raw.githubusercontent.com/hrimyx/QXRelay/master/JS/Main/bhmt.js#account=xxx&password=xxx&totp=xxx&ads=0&guild=1&answer=0&notify=1&force-timeout=180000
 * 必填 account 账号、password 密码
 * 选填 totp 两步验证, guild 公会签到  1, ads 广告双倍签到 0, answer 动画疯每日答题 1, notify 通知 1, force-timeout 超时 180000
 */

!(async () => {

    // ==================================================
    // QX 参数
    // ==================================================

    const args =
        $environment.variables || {};

    const ACCOUNT =
        String(
            args["account"] || ""
        ).trim();

    const PASSWORD =
        String(
            args["password"] || ""
        ).trim();

    const TOTP_SECRET =
        String(
            args["totp"] || ""
        )
            .replace(
                /\s+/g,
                ""
            )
            .trim();

    const NEED_SIGN_ADS =
        parseBoolean(
            args["ads"],
            false
        );

    const NEED_SIGN_GUILD =
        parseBoolean(
            args["guild"],
            true
        );

    const NEED_ANSWER =
        parseBoolean(
            args["answer"],
            true
        );

    const NOTIFY_ENABLED =
        parseBoolean(
            args["notify"],
            true
        );

    const FORCE_TIMEOUT =
        parseTimeout(
            args["force-timeout"],
            180000
        );

    // ==================================================
    // 常量
    // ==================================================

    const SCRIPT_NAME =
        "巴哈姆特签到";

    // --------------------------------------------------
    // 登录
    // --------------------------------------------------

    const LOGIN_USER_AGENT =
        "Bahadroid (https://www.gamer.com.tw/)";

    const LOGIN_VCODE =
        "7045";

    const LOGIN_URL =
        "https://api.gamer.com.tw/mobile_app/user/v3/do_login.php";

    // --------------------------------------------------
    // 主站签到
    // --------------------------------------------------

    const CSRF_URL =
        "https://www.gamer.com.tw/ajax/get_csrf_token.php";

    const SIGN_URL =
        "https://www.gamer.com.tw/ajax/signin.php";

    // --------------------------------------------------
    // 公会
    // --------------------------------------------------

    const NEW_GUILD_LIST_URL =
        "https://api.gamer.com.tw/guild/v2/guild_my.php";

    const OLD_GUILD_LIST_URL =
        "https://api.gamer.com.tw/ajax/common/topBar.php?type=forum";

    const GUILD_SIGN_URL =
        "https://guild.gamer.com.tw/ajax/guildSign.php";

    // --------------------------------------------------
    // 动画疯
    // --------------------------------------------------

    const ANIMAD_USER_AGENT =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

    const QUESTION_URL =
        "https://ani.gamer.com.tw/ajax/animeGetQuestion.php";

    const ANSWER_ARTICLE_URL =
        "https://api.gamer.com.tw/mobile_app/bahamut/v1/home.php?owner=blackXblue&page=1";

    const ANSWER_DETAIL_URL =
        "https://api.gamer.com.tw/mobile_app/bahamut/v1/home_creation_detail.php?sn=";

    const ANSWER_SUBMIT_URL =
        "https://ani.gamer.com.tw/ajax/animeAnsQuestion.php";

    // --------------------------------------------------
    // 广告
    // --------------------------------------------------

    const AD_URL_PREFIX =
        "https://api.gamer.com.tw/mobile_app/bahamut/v1/sign_in_ad_";

    // ==================================================
    // 状态
    // ==================================================

    let finished =
        false;

    let BAHARUNE =
        "";

    let AUTH_COOKIE =
        "";

    const notifyMsg =
        [];

    // ==================================================
    // 日志
    // ==================================================

    function log(
        message
    ) {
        const text =
            String(
                message === undefined ||
                message === null
                    ? ""
                    : message
            ).trim();

        if (!text) {
            return;
        }

        console.log(
            "[" +
            SCRIPT_NAME +
            "] " +
            text
        );
    }

    // ==================================================
    // 通知
    // ==================================================

    function notify(
        title,
        message
    ) {
        if (
            !NOTIFY_ENABLED
        ) {
            return;
        }

        try {
            $notify(
                title ||
                    SCRIPT_NAME,
                "",
                message || ""
            );
        } catch (
            error
        ) {
            log(
                "通知失败: " +
                String(error)
            );
        }
    }

    // ==================================================
    // 唯一结束
    // ==================================================

    function finish(
        title,
        message
    ) {
        if (
            finished
        ) {
            return;
        }

        finished =
            true;

        if (
            title ||
            message
        ) {
            notify(
                title ||
                    SCRIPT_NAME,
                message || ""
            );
        }

        $done();
    }

    // ==================================================
    // Boolean
    // ==================================================

    function parseBoolean(
        value,
        defaultValue
    ) {
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return defaultValue;
        }

        const text =
            String(
                value
            )
                .trim()
                .toLowerCase();

        if (
            text === "1" ||
            text === "true" ||
            text === "yes" ||
            text === "on"
        ) {
            return true;
        }

        if (
            text === "0" ||
            text === "false" ||
            text === "no" ||
            text === "off"
        ) {
            return false;
        }

        return defaultValue;
    }

    // ==================================================
    // Timeout
    // ==================================================

    function parseTimeout(
        value,
        defaultValue
    ) {
        const number =
            parseInt(
                String(
                    value || ""
                ),
                10
            );

        if (
            Number.isFinite(
                number
            ) &&
            number >= 1000
        ) {
            return number;
        }

        return defaultValue;
    }

    // ==================================================
    // 账号脱敏
    // ==================================================

    function maskAccount(
        account
    ) {
        if (!account) {
            return "未提供";
        }

        if (
            account.length <= 2
        ) {
            return "*".repeat(
                account.length
            );
        }

        if (
            account.length <= 4
        ) {
            return (
                account.charAt(0) +
                "*" +
                account.charAt(
                    account.length - 1
                )
            );
        }

        return (
            account.slice(
                0,
                2
            ) +
            "***" +
            account.slice(
                -2
            )
        );
    }

    // ==================================================
    // HTTP
    // ==================================================

    function httpRequest(
        url,
        method,
        headers,
        body,
        userAgent
    ) {
        const request =
            {
                url:
                    url,

                method:
                    String(
                        method ||
                            "GET"
                    ).toUpperCase(),

                headers:
                    Object.assign(
                        {
                            "User-Agent":
                                userAgent ||
                                LOGIN_USER_AGENT
                        },
                        headers || {}
                    ),

                opts: {
                    "auto-cookie":
                        true,

                    redirection:
                        true
                }
            };

        if (
            body !== undefined &&
            body !== null
        ) {
            request.body =
                body;
        }

        return $task.fetch(
            request
        );
    }

    // ==================================================
    // HTTP 状态
    // ==================================================

    function responseStatus(
        response
    ) {
        if (!response) {
            return 0;
        }

        const code =
            parseInt(
                response.statusCode,
                10
            );

        return Number.isFinite(
            code
        )
            ? code
            : 0;
    }

    // ==================================================
    // 错误
    // ==================================================

    function getErrorMessage(
        error
    ) {
        if (!error) {
            return "未知错误";
        }

        if (
            error.error !==
                undefined &&
            error.error !== null
        ) {
            return String(
                error.error
            );
        }

        if (
            error.message
        ) {
            return String(
                error.message
            );
        }

        return String(
            error
        );
    }

    // ==================================================
    // JSON
    // ==================================================

    function parseJSON(
        body
    ) {
        if (
            body === undefined ||
            body === null
        ) {
            throw new Error(
                "响应 Body 为空"
            );
        }

        const text =
            String(
                body
            ).trim();

        if (!text) {
            throw new Error(
                "响应 Body 为空"
            );
        }

        try {
            return JSON.parse(
                text
            );
        } catch (
            error
        ) {
            throw new Error(
                "JSON 解析失败: " +
                String(error)
            );
        }
    }

    // ==================================================
    // BAHARUNE
    // ==================================================

    function extractBAHARUNE(
        headers
    ) {
        if (!headers) {
            return "";
        }

        let serialized =
            "";

        try {
            serialized =
                JSON.stringify(
                    headers
                );
        } catch (
            error
        ) {
            serialized =
                String(
                    headers
                );
        }

        let match =
            serialized.match(
                /(BAHARUNE=[A-Za-z0-9_.-]+)/
            );

        if (match) {
            return match[1];
        }

        const names = [
            "set-cookie",
            "Set-Cookie",
            "SET-COOKIE",
            "cookie",
            "Cookie"
        ];

        for (
            let i = 0;
            i < names.length;
            i += 1
        ) {
            const value =
                headers[
                    names[i]
                ];

            if (
                value === undefined ||
                value === null
            ) {
                continue;
            }

            const text =
                Array.isArray(
                    value
                )
                    ? value.join(
                          ";"
                      )
                    : String(
                          value
                      );

            match =
                text.match(
                    /(BAHARUNE=[A-Za-z0-9_.-]+)/
                );

            if (match) {
                return match[1];
            }
        }

        return "";
    }

    // ==================================================
    // 登录 Cookie
    // ==================================================

    function extractAuthCookie(
        headers
    ) {
        if (!headers) {
            return "";
        }

        let serialized =
            "";

        try {
            serialized =
                JSON.stringify(
                    headers
                );
        } catch (
            error
        ) {
            serialized =
                String(
                    headers
                );
        }

        const names = [
            "BAHAID",
            "BAHAHASHID",
            "BAHANICK",
            "BAHALV",
            "BAHAFLT",
            "BAHAENUR",
            "BAHARUNE"
        ];

        const result =
            [];

        for (
            let i = 0;
            i < names.length;
            i += 1
        ) {
            const name =
                names[i];

            const expression =
                new RegExp(
                    name +
                    "=([^;,\"\\s}]+)"
                );

            const match =
                serialized.match(
                    expression
                );

            if (
                match &&
                match[1]
            ) {
                result.push(
                    name +
                    "=" +
                    match[1]
                );
            }
        }

        return result.join(
            "; "
        );
    }

    // ==================================================
    // 登录
    // ==================================================

    async function BahamutLogin(
        retry,
        interval
    ) {
        const maxRetry =
            retry || 1;

        const waitInterval =
            interval || 1000;

        if (!ACCOUNT) {
            throw new Error(
                "未提供 account 参数"
            );
        }

        if (!PASSWORD) {
            throw new Error(
                "未提供 password 参数"
            );
        }

        log(
            "开始登录，账号=" +
            maskAccount(
                ACCOUNT
            )
        );

        for (
            let i = 0;
            i < maxRetry;
            i += 1
        ) {
            if (
                i > 0
            ) {
                await wait(
                    waitInterval
                );

                log(
                    "尝试第" +
                    (i + 1) +
                    "次登录"
                );
            }

            let loginCode =
                "";

            if (
                TOTP_SECRET
            ) {
                try {
                    loginCode =
                        TOTP(
                            TOTP_SECRET
                        );

                    log(
                        "TOTP 已生成，尾码=" +
                        loginCode.slice(
                            -2
                        )
                    );

                } catch (
                    error
                ) {
                    throw new Error(
                        "TOTP 生成失败: " +
                        getErrorMessage(
                            error
                        )
                    );
                }
            }

            const body =
                "uid=" +
                encodeURIComponent(
                    ACCOUNT
                ) +
                "&passwd=" +
                encodeURIComponent(
                    PASSWORD
                ) +
                "&vcode=" +
                LOGIN_VCODE +
                (
                    loginCode
                        ? "&twoStepAuth=" +
                          encodeURIComponent(
                              loginCode
                          )
                        : ""
                );

            let response;

            try {
                response =
                    await httpRequest(
                        LOGIN_URL,
                        "POST",
                        {
                            "Cookie":
                                "ckAPP_VCODE=" +
                                LOGIN_VCODE,

                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        },
                        body,
                        LOGIN_USER_AGENT
                    );

            } catch (
                error
            ) {
                log(
                    "登录请求失败: " +
                    getErrorMessage(
                        error
                    )
                );

                throw error;
            }

            log(
                "登录 HTTP: " +
                responseStatus(
                    response
                )
            );

            let result;

            try {
                result =
                    parseJSON(
                        response.body
                    );
            } catch (
                error
            ) {
                log(
                    "登录响应不是有效 JSON"
                );

                if (
                    response &&
                    response.body
                ) {
                    log(
                        "响应前120字符: " +
                        String(
                            response.body
                        )
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .slice(
                                0,
                                120
                            )
                    );
                }

                throw error;
            }

            if (
                result &&
                result.userid
            ) {
                BAHARUNE =
                    extractBAHARUNE(
                        response.headers
                    );

                AUTH_COOKIE =
                    extractAuthCookie(
                        response.headers
                    );

                if (
                    BAHARUNE
                ) {
                    log(
                        "登录成功，BAHARUNE 已获取"
                    );
                } else {
                    log(
                        "登录成功，但未获取到 BAHARUNE"
                    );
                }

                if (
                    AUTH_COOKIE
                ) {
                    log(
                        "认证 Cookie 已建立"
                    );
                }

                log(
                    "✅巴哈姆特登录成功"
                );

                return;
            }

            const failMsg =
                result &&
                result.error &&
                result.error.message
                    ? result.error.message
                    : "";

            const message =
                result &&
                result.message
                    ? result.message
                    : (
                        failMsg ||
                        "原因未知"
                    );

            log(
                "登录失败: " +
                message
            );

            throw new Error(
                message
            );
        }

        throw new Error(
            "登录失败"
        );
    }

    // ==================================================
    // 主站签到
    //
    // 注意：
    // 已调整到公会签到之前。
    // ==================================================

    async function BahamutSign() {
        log(
            "开始获取签到令牌"
        );

        try {
            const response =
                await httpRequest(
                    CSRF_URL,
                    "GET",
                    {},
                    undefined,
                    LOGIN_USER_AGENT
                );

            log(
                "CSRF HTTP: " +
                responseStatus(
                    response
                )
            );

            if (
                !response ||
                !response.body
            ) {
                throw new Error(
                    "获取签到令牌失败"
                );
            }

            const token =
                String(
                    response.body
                ).trim();

            if (!token) {
                throw new Error(
                    "签到令牌为空"
                );
            }

            log(
                "✅获取签到令牌成功"
            );

            const days =
                await StartSignBahamut(
                    token
                );

            if (
                days ===
                "ALREADY_SIGNED"
            ) {
                notifyMsg.push(
                    "主页签到: 今日已签到"
                );
            } else {
                notifyMsg.push(
                    "主页签到: 成功，已连续签到" +
                    days +
                    "天"
                );
            }

            await StartAdsBonus(
                token.slice(
                    0,
                    16
                ),
                "start"
            );

        } catch (
            error
        ) {
            const message =
                getErrorMessage(
                    error
                );

            notifyMsg.push(
                "主页签到: " +
                message
            );

            log(
                "❌主站签到异常: " +
                message
            );
        }
    }

    // ==================================================
    // 主站签到请求
    // ==================================================

    async function StartSignBahamut(
        token
    ) {
        const response =
            await httpRequest(
                SIGN_URL,
                "POST",
                {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                "action=1&token=" +
                encodeURIComponent(
                    token
                ),
                LOGIN_USER_AGENT
            );

        log(
            "主站签到 HTTP: " +
            responseStatus(
                response
            )
        );

        const body =
            parseJSON(
                response.body
            );

        if (
            body &&
            body.data
        ) {
            log(
                "✅巴哈姆特签到成功，已连续签到" +
                body.data.days +
                "天"
            );

            return body.data.days;
        }

        const failMsg =
            body &&
            body.error &&
            body.error.message
                ? body.error.message
                : "";

        const message =
            failMsg ||
            body.message ||
            "未知";

        if (
            message.includes(
                "今天您已經簽到過了喔"
            )
        ) {
            log(
                "ℹ️今天已经签到过了"
            );

            return "ALREADY_SIGNED";
        }

        throw new Error(
            message
        );
    }

    // ==================================================
    // 广告签到
    // ==================================================

    async function StartAdsBonus(
        token,
        type
    ) {
        if (
            !NEED_SIGN_ADS
        ) {
            log(
                "广告签到已关闭"
            );

            return;
        }

        if (
            !token ||
            token.length < 16
        ) {
            throw new Error(
                "广告签到 Token 无效"
            );
        }

        const cookieParts =
            [
                "ckBahamutCsrfToken=" +
                token
            ];

        if (
            BAHARUNE
        ) {
            cookieParts.push(
                BAHARUNE
            );
        }

        const url =
            AD_URL_PREFIX +
            type +
            ".php";

        try {
            const response =
                await httpRequest(
                    url,
                    "POST",
                    {
                        "X-Bahamut-Csrf-Token":
                            token,

                        "Cookie":
                            cookieParts.join(
                                ";"
                            )
                    },
                    undefined,
                    LOGIN_USER_AGENT
                );

            log(
                "广告签到[" +
                type +
                "] HTTP: " +
                responseStatus(
                    response
                )
            );

            const body =
                parseJSON(
                    response.body
                );

            if (
                body &&
                body.data &&
                body.data.finished == 0 &&
                type === "start"
            ) {
                log(
                    "🔶正在执行广告签到，等待30秒"
                );

                await wait(
                    30000
                );

                await StartAdsBonus(
                    token,
                    "finished"
                );

                return;
            }

            if (
                body &&
                body.data &&
                body.data.finished == 1
            ) {
                log(
                    "✅领取广告奖励成功"
                );

                notifyMsg.push(
                    "广告签到: 成功，已领取双倍签到奖励"
                );

                return;
            }

            const failMsg =
                body &&
                body.error &&
                body.error.message
                    ? body.error.message
                    : "";

            throw new Error(
                failMsg ||
                body.message ||
                "未知"
            );

        } catch (
            error
        ) {
            const message =
                getErrorMessage(
                    error
                );

            notifyMsg.push(
                "广告签到: " +
                message
            );

            log(
                "❌广告奖励签到失败: " +
                message
            );
        }
    }

    // ==================================================
    // 公会签到
    // ==================================================

    async function BahamutGuildSign() {
        if (
            !NEED_SIGN_GUILD
        ) {
            log(
                "公会签到已关闭"
            );

            return;
        }

        try {
            let list =
                await getNewGuildList();

            if (
                !list ||
                !list.length
            ) {
                log(
                    "新公会接口未返回列表，尝试旧接口"
                );

                list =
                    await getOldGuildList();
            }

            if (
                !list ||
                !list.length
            ) {
                log(
                    "ℹ️当前账号没有可签到的公会"
                );

                notifyMsg.push(
                    "公会签到: 无可签到公会"
                );

                return;
            }

            log(
                "✅获取公会列表成功，共" +
                list.length +
                "个"
            );

            let successCount =
                0;

            let failCount =
                0;

            // 串行请求
            for (
                let i = 0;
                i < list.length;
                i += 1
            ) {
                const result =
                    await StartSignGuild(
                        list[i]
                    );

                if (
                    result === 1
                ) {
                    successCount +=
                        1;
                } else {
                    failCount +=
                        1;
                }
            }

            let message =
                "公会签到: ";

            if (
                successCount
            ) {
                message +=
                    "成功" +
                    successCount +
                    "个";
            }

            if (
                successCount &&
                failCount
            ) {
                message +=
                    "，";
            }

            if (
                failCount
            ) {
                message +=
                    "失败" +
                    failCount +
                    "个";
            }

            if (
                !successCount &&
                !failCount
            ) {
                message +=
                    "无结果";
            }

            notifyMsg.push(
                message
            );

        } catch (
            error
        ) {
            const message =
                getErrorMessage(
                    error
                );

            notifyMsg.push(
                "公会签到: " +
                message
            );

            log(
                "❌公会签到异常: " +
                message
            );
        }
    }

    // ==================================================
    // 新公会接口
    // ==================================================

    async function getNewGuildList() {
        const response =
            await httpRequest(
                NEW_GUILD_LIST_URL,
                "GET",
                {
                    "Accept":
                        "application/json"
                },
                undefined,
                LOGIN_USER_AGENT
            );

        log(
            "公会新接口 HTTP: " +
            responseStatus(
                response
            )
        );

        if (
            !response ||
            !response.body
        ) {
            return [];
        }

        let body;

        try {
            body =
                parseJSON(
                    response.body
                );
        } catch (
            error
        ) {
            log(
                "公会 JSON 解析失败"
            );

            return [];
        }

        const list =
            body &&
            body.data &&
            Array.isArray(
                body.data.list
            )
                ? body.data.list
                : [];

        log(
            "公会解析数量: " +
            list.length
        );

        return list
            .map(
                function (
                    item
                ) {
                    if (
                        !item ||
                        !item.sn
                    ) {
                        return null;
                    }

                    return {
                        sn:
                            String(
                                item.sn
                            ),

                        name:
                            String(
                                item.name ||
                                item.title ||
                                item.gname ||
                                item.guild_name ||
                                item.sn
                            )
                    };
                }
            )
            .filter(
                function (
                    item
                ) {
                    return !!item;
                }
            );
    }

    // ==================================================
    // 旧公会接口
    // ==================================================

    async function getOldGuildList() {
        const response =
            await httpRequest(
                OLD_GUILD_LIST_URL,
                "GET",
                {},
                undefined,
                LOGIN_USER_AGENT
            );

        log(
            "公会旧接口 HTTP: " +
            responseStatus(
                response
            )
        );

        if (
            !response ||
            !response.body
        ) {
            return [];
        }

        const source =
            String(
                response.body
            ).replace(
                /\n/g,
                ""
            );

        const matches =
            source.match(
                /guild\.php\?g?sn=\d.+?<\/p>/g
            ) || [];

        return matches
            .map(
                function (
                    item
                ) {
                    const sn =
                        item.split(
                            /guild\.php\?g?sn=(\d+)/
                        )[1];

                    const name =
                        item.split(
                            /<p>(.+?)<\/p>/
                        )[1];

                    if (!sn) {
                        return null;
                    }

                    return {
                        sn:
                            String(
                                sn
                            ),

                        name:
                            name ||
                            String(
                                sn
                            )
                    };
                }
            )
            .filter(
                function (
                    item
                ) {
                    return !!item;
                }
            );
    }

    // ==================================================
    // 单个公会签到
    // ==================================================

    async function StartSignGuild(
        guild
    ) {
        try {
            const headers = {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            };

            if (
                AUTH_COOKIE
            ) {
                headers.Cookie =
                    AUTH_COOKIE;
            }

            const response =
                await httpRequest(
                    GUILD_SIGN_URL,
                    "POST",
                    headers,
                    "sn=" +
                    encodeURIComponent(
                        guild.sn
                    ),
                    LOGIN_USER_AGENT
                );

            const body =
                parseJSON(
                    response.body
                );

            const name =
                guild.name ||
                guild.sn;

            if (
                body.ok
            ) {
                log(
                    "🔷<" +
                    name +
                    "> ✅" +
                    (
                        body.msg ||
                        "签到成功"
                    )
                );

                return 1;
            }

            log(
                "🔷<" +
                name +
                "> ❌" +
                (
                    body.msg ||
                    "签到失败"
                )
            );

            return 0;

        } catch (
            error
        ) {
            log(
                "🔷<" +
                (
                    guild.name ||
                    guild.sn
                ) +
                "> ❌" +
                getErrorMessage(
                    error
                )
            );

            return 0;
        }
    }

    // ==================================================
    // 动画疯
    //
    // 当前暂时不建议测试。
    //
    // 设置 answer=0 可关闭。
    // 代码保留完整逻辑。
    // ==================================================

    async function BahamutAnswer() {
        if (
            !NEED_ANSWER
        ) {
            log(
                "动画疯答题已关闭"
            );

            return;
        }

        try {
            log(
                "开始获取动画疯题目"
            );

            const headers = {
                "Accept":
                    "application/json,text/plain,*/*",

                "X-Requested-With":
                    "XMLHttpRequest"
            };

            if (
                AUTH_COOKIE
            ) {
                headers.Cookie =
                    AUTH_COOKIE;
            }

            const response =
                await httpRequest(
                    QUESTION_URL,
                    "GET",
                    headers,
                    undefined,
                    ANIMAD_USER_AGENT
                );

            const status =
                responseStatus(
                    response
                );

            log(
                "动画疯题目 HTTP: " +
                status
            );

            if (
                !response
            ) {
                throw new Error(
                    "动画疯响应为空"
                );
            }

            if (
                status !== 200
            ) {
                let preview =
                    "";

                if (
                    response.body
                ) {
                    preview =
                        String(
                            response.body
                        )
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .slice(
                                0,
                                300
                            );
                }

                if (
                    preview
                ) {
                    log(
                        "动画疯异常响应: " +
                        preview
                    );
                }

                throw new Error(
                    "动画疯题目接口 HTTP " +
                    status
                );
            }

            const r =
                parseJSON(
                    response.body
                );

            if (
                !r.token
            ) {
                throw new Error(
                    r.msg ||
                    "获取题目失败"
                );
            }

            log(
                "✅获取动画疯题目成功"
            );

            log(
                "🔶<" +
                (
                    r.game ||
                    ""
                ) +
                "> " +
                (
                    r.question ||
                    ""
                )
            );

            log(
                "1️⃣" +
                (
                    r.a1 ||
                    ""
                ) +
                "  2️⃣" +
                (
                    r.a2 ||
                    ""
                )
            );

            log(
                "3️⃣" +
                (
                    r.a3 ||
                    ""
                ) +
                "  4️⃣" +
                (
                    r.a4 ||
                    ""
                )
            );

            const article =
                await GetAanswerArticles();

            const answer =
                await StartSearchAnswers(
                    article
                );

            const result =
                await StartBahamutAnswer(
                    answer,
                    r.token
                );

            notifyMsg.push(
                "动画答题: " +
                result
            );

        } catch (
            error
        ) {
            const message =
                getErrorMessage(
                    error
                );

            notifyMsg.push(
                "动画答题: " +
                message
            );

            log(
                "❌动画疯答题失败: " +
                message
            );
        }
    }

    // ==================================================
    // 获取每日答案文章
    // ==================================================

    async function GetAanswerArticles() {
        log(
            "🔶开始获取答案文章"
        );

        const response =
            await httpRequest(
                ANSWER_ARTICLE_URL,
                "GET",
                {
                    "Accept":
                        "application/json"
                },
                undefined,
                LOGIN_USER_AGENT
            );

        log(
            "答案文章 HTTP: " +
            responseStatus(
                response
            )
        );

        const body =
            parseJSON(
                response.body
            );

        const today =
            getTaipeiDateMMDD();

        const creation =
            Array.isArray(
                body.creation
            )
                ? body.creation
                : [];

        const title =
            creation.filter(
                function (
                    item
                ) {
                    return (
                        item &&
                        typeof item.title ===
                            "string" &&
                        item.title.includes(
                            today
                        )
                    );
                }
            );

        if (
            title.length &&
            title[0].sn
        ) {
            log(
                "✅获取今日答案文章成功，sn=" +
                title[0].sn
            );

            return title[0].sn;
        }

        throw new Error(
            "今日答案未发表"
        );
    }

    // ==================================================
    // 答案提取
    //
    // 保持原版算法：
    //
    // body.content.split(/A:(\d)/)[1]
    // ==================================================

    async function StartSearchAnswers(
        id
    ) {
        log(
            "🔶开始获取答案"
        );

        const response =
            await httpRequest(
                ANSWER_DETAIL_URL +
                encodeURIComponent(
                    id
                ),
                "GET",
                {},
                undefined,
                LOGIN_USER_AGENT
            );

        log(
            "答案详情 HTTP: " +
            responseStatus(
                response
            )
        );

        const body =
            parseJSON(
                response.body
            );

        if (
            typeof body.content !==
            "string"
        ) {
            throw new Error(
                "答案文章内容为空"
            );
        }

        const answers =
            body.content.split(
                /A:(\d)/
            )[1];

        if (
            answers
        ) {
            log(
                "✅获取答案成功，答案=" +
                answers
            );

            return answers;
        }

        throw new Error(
            "提取答案失败"
        );
    }

    // ==================================================
    // 提交动画疯答案
    // ==================================================

    async function StartBahamutAnswer(
        answer,
        token
    ) {
        log(
            "🔶开始提交答案，答案=" +
            answer
        );

        const headers = {
            "Content-Type":
                "application/x-www-form-urlencoded",

            "Referer":
                "https://ani.gamer.com.tw/"
        };

        if (
            AUTH_COOKIE
        ) {
            headers.Cookie =
                AUTH_COOKIE;
        }

        const response =
            await httpRequest(
                ANSWER_SUBMIT_URL,
                "POST",
                headers,
                "ans=" +
                encodeURIComponent(
                    answer
                ) +
                "&token=" +
                encodeURIComponent(
                    token
                ) +
                "&t=" +
                Date.now(),
                ANIMAD_USER_AGENT
            );

        log(
            "动画疯答题 HTTP: " +
            responseStatus(
                response
            )
        );

        const body =
            parseJSON(
                response.body
            );

        if (
            body.ok
        ) {
            const result =
                body.gift ||
                "答题成功";

            log(
                "✅" +
                result
            );

            return result;
        }

        const failMsg =
            body &&
            body.error &&
            body.error.message
                ? body.error.message
                : "";

        throw new Error(
            body.msg ||
            failMsg ||
            "未知"
        );
    }

    // ==================================================
    // 台北日期
    // ==================================================

    function getTaipeiDateMMDD() {
        try {
            const parts =
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        timeZone:
                            "Asia/Taipei",

                        month:
                            "2-digit",

                        day:
                            "2-digit"
                    }
                ).formatToParts(
                    new Date()
                );

            let month =
                "";

            let day =
                "";

            for (
                let i = 0;
                i < parts.length;
                i += 1
            ) {
                if (
                    parts[i].type ===
                    "month"
                ) {
                    month =
                        parts[i].value;
                }

                if (
                    parts[i].type ===
                    "day"
                ) {
                    day =
                        parts[i].value;
                }
            }

            return (
                month +
                "/" +
                day
            );

        } catch (
            error
        ) {
            const now =
                new Date();

            return (
                String(
                    now.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                ) +
                "/" +
                String(
                    now.getDate()
                ).padStart(
                    2,
                    "0"
                )
            );
        }
    }

    // ==================================================
    // 等待
    // ==================================================

    function wait(
        milliseconds
    ) {
        return new Promise(
            function (
                resolve
            ) {
                setTimeout(
                    resolve,
                    milliseconds
                );
            }
        );
    }

    // ==================================================
    // SHA-1
    //
    // 纯 JS
    // ==================================================

    function sha1(
        bytes
    ) {
        const x =
            [];

        for (
            let i = 0;
            i < bytes.length;
            i += 1
        ) {
            x[i >> 2] |=
                (
                    bytes[i] &
                    0xFF
                ) <<
                (
                    24 -
                    (
                        i % 4
                    ) * 8
                );
        }

        const len =
            bytes.length *
            8;

        x[len >> 5] |=
            0x80 <<
            (
                24 -
                len % 32
            );

        x[
            (
                (
                    len + 64
                ) >>> 9
            ) *
            16 +
            15
        ] =
            len;

        let a =
            0x67452301;

        let b =
            0xEFCDAB89;

        let c =
            0x98BADCFE;

        let d =
            0x10325476;

        let e =
            0xC3D2E1F0;

        function safeAdd(
            x,
            y
        ) {
            const lsw =
                (
                    x &
                    0xFFFF
                ) +
                (
                    y &
                    0xFFFF
                );

            const msw =
                (
                    x >>> 16
                ) +
                (
                    y >>> 16
                ) +
                (
                    lsw >>> 16
                );

            return (
                (
                    msw << 16
                ) |
                (
                    lsw &
                    0xFFFF
                )
            );
        }

        function rol(
            num,
            cnt
        ) {
            return (
                (
                    num << cnt
                ) |
                (
                    num >>>
                    (
                        32 -
                        cnt
                    )
                )
            );
        }

        for (
            let i = 0;
            i < x.length;
            i += 16
        ) {
            const oldA =
                a;

            const oldB =
                b;

            const oldC =
                c;

            const oldD =
                d;

            const oldE =
                e;

            const w =
                [];

            for (
                let t = 0;
                t < 80;
                t += 1
            ) {
                if (
                    t < 16
                ) {
                    w[t] =
                        x[i + t] |
                        0;
                } else {
                    w[t] =
                        rol(
                            w[t - 3] ^
                            w[t - 8] ^
                            w[t - 14] ^
                            w[t - 16],
                            1
                        );
                }

                let f;
                let k;

                if (
                    t < 20
                ) {
                    f =
                        (
                            b & c
                        ) |
                        (
                            (~b) &
                            d
                        );

                    k =
                        0x5A827999;

                } else if (
                    t < 40
                ) {
                    f =
                        b ^
                        c ^
                        d;

                    k =
                        0x6ED9EBA1;

                } else if (
                    t < 60
                ) {
                    f =
                        (
                            b & c
                        ) |
                        (
                            b & d
                        ) |
                        (
                            c & d
                        );

                    k =
                        0x8F1BBCDC;

                } else {
                    f =
                        b ^
                        c ^
                        d;

                    k =
                        0xCA62C1D6;
                }

                const temp =
                    safeAdd(
                        safeAdd(
                            rol(
                                a,
                                5
                            ),
                            f
                        ),
                        safeAdd(
                            e,
                            safeAdd(
                                k,
                                w[t]
                            )
                        )
                    );

                e =
                    d;

                d =
                    c;

                c =
                    rol(
                        b,
                        30
                    );

                b =
                    a;

                a =
                    temp;
            }

            a =
                safeAdd(
                    a,
                    oldA
                );

            b =
                safeAdd(
                    b,
                    oldB
                );

            c =
                safeAdd(
                    c,
                    oldC
                );

            d =
                safeAdd(
                    d,
                    oldD
                );

            e =
                safeAdd(
                    e,
                    oldE
                );
        }

        const words = [
            a,
            b,
            c,
            d,
            e
        ];

        const result =
            [];

        for (
            let i = 0;
            i < words.length;
            i += 1
        ) {
            const value =
                words[i];

            result.push(
                (
                    value >>> 24
                ) & 0xFF,

                (
                    value >>> 16
                ) & 0xFF,

                (
                    value >>> 8
                ) & 0xFF,

                value & 0xFF
            );
        }

        return result;
    }

    // ==================================================
    // HMAC-SHA1
    // ==================================================

    function hmacSha1(
        key,
        message
    ) {
        let k =
            Array.from(
                key
            );

        if (
            k.length > 64
        ) {
            k =
                sha1(
                    k
                );
        }

        while (
            k.length < 64
        ) {
            k.push(
                0
            );
        }

        const inner =
            k.map(
                function (
                    value
                ) {
                    return (
                        value ^
                        0x36
                    );
                }
            );

        const outer =
            k.map(
                function (
                    value
                ) {
                    return (
                        value ^
                        0x5C
                    );
                }
            );

        const innerHash =
            sha1(
                inner.concat(
                    Array.from(
                        message
                    )
                )
            );

        return sha1(
            outer.concat(
                innerHash
            )
        );
    }

    // ==================================================
    // Base32
    // ==================================================

    function base32ToBytes(
        secret
    ) {
        const alphabet =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

        const normalized =
            String(
                secret
            )
                .replace(
                    /=+$/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                )
                .toUpperCase();

        if (
            !normalized
        ) {
            throw new Error(
                "TOTP 密钥为空"
            );
        }

        let buffer =
            0;

        let bits =
            0;

        const result =
            [];

        for (
            let i = 0;
            i < normalized.length;
            i += 1
        ) {
            const index =
                alphabet.indexOf(
                    normalized.charAt(
                        i
                    )
                );

            if (
                index < 0
            ) {
                throw new Error(
                    "TOTP 密钥包含无效 Base32 字符"
                );
            }

            buffer =
                buffer *
                32 +
                index;

            bits +=
                5;

            if (
                bits >= 8
            ) {
                bits -=
                    8;

                result.push(
                    (
                        Math.floor(
                            buffer /
                            Math.pow(
                                2,
                                bits
                            )
                        )
                    ) &
                    0xFF
                );

                buffer =
                    buffer %
                    Math.pow(
                        2,
                        bits
                    );
            }
        }

        return result;
    }

    // ==================================================
    // TOTP
    //
    // 已验证：
    // QX 结果 = 验证器结果
    //
    // 30 秒
    // HMAC-SHA1
    // 6 位
    // ==================================================

    function TOTP(
        secret
    ) {
        const key =
            base32ToBytes(
                secret
            );

        if (
            !key.length
        ) {
            throw new Error(
                "TOTP 密钥解析后为空"
            );
        }

        const counter =
            Math.floor(
                Date.now() /
                1000 /
                30
            );

        const message =
            [];

        for (
            let i = 7;
            i >= 0;
            i -= 1
        ) {
            message.push(
                (
                    Math.floor(
                        counter /
                        Math.pow(
                            2,
                            i * 8
                        )
                    )
                ) &
                0xFF
            );
        }

        const digest =
            hmacSha1(
                key,
                message
            );

        const offset =
            digest[
                digest.length - 1
            ] &
            0x0F;

        const binary =
            (
                (
                    digest[offset] &
                    0x7F
                ) *
                0x1000000
            ) +
            (
                digest[
                    offset + 1
                ] *
                0x10000
            ) +
            (
                digest[
                    offset + 2
                ] *
                0x100
            ) +
            digest[
                offset + 3
            ];

        return String(
            binary % 1000000
        ).padStart(
            6,
            "0"
        );
    }

    // ==================================================
    // Watchdog
    // ==================================================

    const watchdogTimer =
        setTimeout(
            function () {

                if (
                    finished
                ) {
                    return;
                }

                log(
                    "Task watchdog timeout"
                );

                const summary =
                    notifyMsg.length
                        ? notifyMsg.join(
                              "\n"
                          )
                        : "执行超时";

                finish(
                    SCRIPT_NAME,
                    "任务超时\n" +
                    summary
                );

            },
            FORCE_TIMEOUT
        );

    // ==================================================
    // 主流程
    //
    // 最终顺序：
    //
    // 1. 登录
    // 2. 主站签到
    // 3. 公会签到
    // 4. 动画疯答题
    // ==================================================

    try {
        log(
            "任务开始"
        );

        log(
            "参数检查：account=" +
            (
                ACCOUNT
                    ? "已提供"
                    : "未提供"
            ) +
            " password=" +
            (
                PASSWORD
                    ? "已提供"
                    : "未提供"
            ) +
            " totp=" +
            (
                TOTP_SECRET
                    ? "已提供"
                    : "未提供"
            ) +
            " guild=" +
            NEED_SIGN_GUILD +
            " answer=" +
            NEED_ANSWER +
            " ads=" +
            NEED_SIGN_ADS
        );

        // ==================================================
        // 1. 登录
        //
        // 当前固定只尝试一次
        // ==================================================

        await BahamutLogin(
            1,
            1000
        );

        if (
            finished
        ) {
            return;
        }

        // ==================================================
        // 2. 主站每日签到
        // ==================================================

        await BahamutSign();

        if (
            finished
        ) {
            return;
        }

        // ==================================================
        // 3. 公会签到
        // ==================================================

        await BahamutGuildSign();

        if (
            finished
        ) {
            return;
        }

        // ==================================================
        // 4. 动画疯答题
        // ==================================================

        await BahamutAnswer();

        if (
            finished
        ) {
            return;
        }

        // ==================================================
        // 完成
        // ==================================================

        log(
            "任务完成"
        );

        const summary =
            notifyMsg.length
                ? notifyMsg.join(
                      "\n"
                  )
                : "执行完成";

        finish(
            SCRIPT_NAME,
            summary
        );

    } catch (
        error
    ) {
        const message =
            getErrorMessage(
                error
            );

        log(
            "任务异常: " +
            message
        );

        notifyMsg.push(
            "任务异常: " +
            message
        );

        finish(
            SCRIPT_NAME,
            notifyMsg.join(
                "\n"
            )
        );

    } finally {
        clearTimeout(
            watchdogTimer
        );
    }

})();