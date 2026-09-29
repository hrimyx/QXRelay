// https://raw.githubusercontent.com/hrimyx/QXRelay/master/JS/Main/testflight.js#appkey=xxx&appkey=yyy

!(async function () {
    // ----- 解析参数，收集所有 appkey（支持 appkey=xxx&appkey=yyy）-----
    const hash = ($environment.sourcePath || '').split('#')[1] || '';
    const appkeys = [...new Set(
        hash.split('&')
            .filter(p => p.startsWith('appkey='))
            .map(p => p.slice(7))
            .filter(Boolean)
    )];

    if (!appkeys.length) {
        $done();
        return;
    }

    // ----- 并发查询每个 TestFlight 页面 -----
    const RE_FULL = /版本的测试员已满|版本目前不接受任何新测试员|This beta is full|This beta isn't accepting any new testers right now/;
    const RE_NAME = /Join the (.+?) beta - TestFlight - Apple/;
    const RE_NAME_CN = /加入 Beta 版[“"](.+?)[”"] - TestFlight - Apple/;

    const results = await Promise.all(
        appkeys.map(async (key) => {
            try {
                const { body } = await $task.fetch({
                    url: `https://testflight.apple.com/join/${key}`,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
                    }
                });
                const m = body.match(RE_NAME) || body.match(RE_NAME_CN);
                return {
                    key,
                    name: m ? m[1].trim() : key,
                    has: !RE_FULL.test(body)
                };
            } catch (e) {
                return { key, name: key, has: false }; // 请求失败视为无空位
            }
        })
    );

    // ----- 有空位则通知 -----
    const available = results.filter(r => r.has);
    if (available.length > 0) {
        const detail = available
            .map(r => `【${r.name}】\nhttps://testflight.apple.com/join/${r.key}`)
            .join('\n\n');
        $notify('TestFlight空位', `🎉 发现 ${available.length} 个空位，抓紧上车`, detail);
    } else {
        console.log('TestFlight监控: 暂无空位');
    }

    $done();
})();