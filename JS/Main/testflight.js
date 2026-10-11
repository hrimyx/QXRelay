/**
 * @fileoverview TestFlight 空位监测
 * @supported Quantumult X (v1.5.6-build918+)
 *
 * https://raw.githubusercontent.com/hrimyx/QXRelay/master/JS/Main/testflight.js#appkey=xxx+yyy         e.g. "VCIvwk2g+NLskzwi5";
 */

!(async () => {
    // 统一结束函数，确保 $done() 仅执行一次
    let finished = false;
    function finish() {
        if (finished) return;
        finished = true;
        $done();
    }

    function stripTags(s) {
        return String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }

    // 从标题 / 状态区提取 App 名称（中英文），失败则回退为 key
    function extractAppName(body, blockText, key) {
        let m = body.match(/<title>\s*Join the (.+?) beta/i)
            || body.match(/content="Join the (.+?) beta"/i)       // og:title / twitter:title
            || body.match(/<title>\s*加入\s*(.+?)\s*Beta 版/i)     // 中文标题
            || blockText.match(/To join the (.+?) beta/i)          // 英文状态文案
            || blockText.match(/加入\s*(.+?)\s*Beta 版/i);          // 中文状态文案
        return m ? m[1].trim() : key;
    }

    // 状态判定（与页面语言无关）：返回 'available' | 'full' | 'closed' | 'unknown'
    // 注意："已满"状态同样带 app-icon，因此必须先用文案排除已满，再用 app-icon 判定有空位
    function detectStatus(block, plain) {
        // 已满（中英文）
        if (/this beta is full/i.test(plain) || /已满/.test(plain)) return "full";
        // 有空位：app-icon 存在即成立，与语言无关；文案匹配作为兜底
        if (/app-icon/.test(block) || /to join the/i.test(plain) || /open the link/i.test(plain)) return "available";
        // 未开放 / 已结束（中英文）
        if (/accepting any new testers/i.test(plain) || /不接受/.test(plain)) return "closed";
        return "unknown";
    }

    try {
        // 解析外部传入参数，使用 let 避免旧版 JSC 引擎只读报错
        let args = $environment.variables || {};
        let appkeysParam = args["appkey"];

        if (!appkeysParam) {
            console.log("🆃🅵未检测到 appkey 参数，请在脚本配置路径后添加 #appkey=xxx+yyy");
            return;
        }

        // 分割并过滤无效 key
        let keys = appkeysParam.split("+").map(k => k.trim()).filter(k => k.length > 0);

        if (keys.length === 0) {
            console.log("🆃🅵未解析到有效的 appkey，请检查参数格式");
            return;
        }

        // 使用传统 for 循环解决旧版 iOS JavaScriptCore for...of + const 造成的只读属性报错
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            // 时间戳参数：防止拿到 CDN 缓存的旧状态
            let url = `https://testflight.apple.com/join/${key}?_=${Date.now()}`;

            try {
                let response = await $task.fetch({
                    url: url,
                    method: "GET",
                    headers: {
                        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
                    }
                });

                if (!response || response.statusCode !== 200) {
                    console.log(`🆃🅵TF监测 [${key}] 请求失败或状态码异常: ${response ? response.statusCode : "无响应"}`);
                    continue;
                }

                // 容错处理，保障 Body 解析安全
                let body = response.body || "";

                // 状态区：<div class="beta-status"> … </div><div class="divider">，结构与语言无关
                let blockMatch = body.match(/<div class="beta-status">([\s\S]*?)<\/div>\s*<div class="divider">/i);
                let block = blockMatch ? blockMatch[1] : "";

                if (!block) {
                    console.log(`🆃🅵TF监测 [${key}] 未找到状态区，页面结构可能已变更`);
                    continue;
                }

                let plain = stripTags(block);
                let status = detectStatus(block, plain);
                let appName = extractAppName(body, plain, key);
                // 通知用干净的加入链接（去掉时间戳参数）
                let joinUrl = `https://testflight.apple.com/join/${key}`;

                if (status === "available") {
                    console.log(`🆃🅵TF监测 [${appName}] 发现空位: ${joinUrl}`);
                    $notify(
                        "TestFlight 空位监测",
                        `🎉 [${appName}] 有空位啦！`,
                        `点击通知立即加入\n完整链接: ${joinUrl}`,
                        {"open-url": joinUrl}
                    );
                } else if (status === "full") {
                    console.log(`🆃🅵TF监测 [${appName}] 无空位 (测试已满)`);
                } else if (status === "closed") {
                    console.log(`🆃🅵TF监测 [${appName}] 无空位 (未开放或已结束)`);
                } else {
                    console.log(`🆃🅵TF监测 [${appName}] 无空位 (未知状态): ${plain}`);
                }

            } catch (fetchError) {
                let errMsg = fetchError && fetchError.error ? fetchError.error : "Unknown error";
                console.log(`🆃🅵TF监测 [${key}] 网络请求异常: ${errMsg}`);
            }
        }

    } catch (error) {
        console.log("🆃🅵TF监测脚本执行发生意外错误: " + String(error));
    } finally {
        // 无论成功、失败还是异常，统一在此保证任务结束退出
        finish();
    }
})();
