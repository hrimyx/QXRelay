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

    try {
        // 解析外部传入参数，使用 let 避免旧版 JSC 引擎只读报错
        let args = $environment.variables || {};
        let appkeysParam = args["appkey"];

        if (!appkeysParam) {
            console.log("未检测到 appkey 参数，请在脚本配置路径后添加 #appkey=xxx+yyy");
            return;
        }

        // 分割并过滤无效 key
        let keys = appkeysParam.split("+").map(k => k.trim()).filter(k => k.length > 0);

        if (keys.length === 0) {
            console.log("未解析到有效的 appkey，请检查参数格式");
            return;
        }

        // 使用传统 for 循环解决旧版 iOS JavaScriptCore for...of + const 造成的只读属性报错
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let url = `https://testflight.apple.com/join/${key}`;
            
            let request = {
                url: url,
                method: "GET",
                headers: {
                    "Accept": "text/html,application/xhtml+xml",
                    // 强制英文页面返回，确保下方状态正则匹配不受区域语言影响
                    "Accept-Language": "en-US,en;q=0.9",
                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
                }
            };

            try {
                let response = await $task.fetch(request);
                
                if (!response || response.statusCode !== 200) {
                    console.log(`TF监测 [${key}] 请求失败或状态码异常: ${response ? response.statusCode : "无响应"}`);
                    continue;
                }

                // 容错处理，保障 Body 解析安全
                let body = response.body || "";
                
                // 解析 App 名称
                let appName = key;
                let titleMatch = body.match(/<title>Join the (.*?) beta - TestFlight/i);
                if (titleMatch && titleMatch[1]) {
                    appName = titleMatch[1].trim();
                }

                // 根据 TestFlight 英文版页面的固定 DOM 文案判定状态
                let isFull = /This beta is full/i.test(body);
                let isClosed = /is not accepting any new testers/i.test(body);

                if (isFull) {
                    console.log(`TF监测 [${appName}] 无空位 (测试已满)`);
                } else if (isClosed) {
                    console.log(`TF监测 [${appName}] 无空位 (未开放或已结束)`);
                } else if (/To join the/i.test(body)) {
                    // 页面存在加入引导提示，判定为有空位
                    console.log(`TF监测 [${appName}] 发现空位: ${url}`);
                    $notify(
                        "TestFlight 空位监测", 
                        `🎉 [${appName}] 有空位啦！`, 
                        `点击通知立即加入\n完整链接: ${url}`,
                        {"open-url": url}
                    );
                } else {
                    console.log(`TF监测 [${appName}] 状态未知，请手动检查: ${url}`);
                }

            } catch (fetchError) {
                let errMsg = fetchError && fetchError.error ? fetchError.error : "Unknown error";
                console.log(`TF监测 [${key}] 网络请求异常: ${errMsg}`);
            }
        }

    } catch (error) {
        console.log("TF监测脚本执行发生意外错误: " + String(error));
    } finally {
        // 无论成功、失败还是异常，统一在此保证任务结束退出
        finish();
    }
})();