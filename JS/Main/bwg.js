!(async function () {
    // ----- 参数解析（支持外部传参）-----
    const query = Object.fromEntries(
        ($environment.sourcePath || '').split('#')[1]?.split('&').map(p => p.split('=')) || []
    );
    const VEID = query.veid || 'veid';
    const KEY  = query.key  || 'key';

    const url = `https://api.64clouds.com/v1/getServiceInfo?veid=${VEID}&api_key=${KEY}`;

    try {
        const { body } = await $task.fetch({ url });
        const d = JSON.parse(body);

        // 流量换算（用 1e9 即十进制 GB，简洁且精度足够）
        const total = (d.plan_monthly_data / 1e9).toFixed(1);
        const used  = (d.data_counter / 1e9).toFixed(1);
        const remain = (total - used).toFixed(1);

        // 重置倒计时（直接以秒为单位计算）
        const remainingSec = Math.floor((d.data_next_reset * 1000 - Date.now()) / 1000);
        const days = Math.floor(remainingSec / 86400);
        const hours = Math.floor((remainingSec % 86400) / 3600);
        const minutes = Math.floor((remainingSec % 3600) / 60);
        const resetText = remainingSec <= 0 ? '已重置' : `${days}天${hours}小时${minutes}分`;

        $notify('📊 搬瓦工流量', `用量 ${used}G / ${total}G`, `余 ${remain}G | ${resetText}后重置`);
    } catch (_) {
        $notify('流量查询失败', '', '请检查网络或参数');
    } finally {
        $done();
    }
})();