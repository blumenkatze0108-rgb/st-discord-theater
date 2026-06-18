(function() {
    const WORKER_URL = 'https://noisy-poetry-480d.blumenkatze0108-b18.workers.dev/';

    // 注册扩展（必须调用，且返回一个对象）
    if (typeof registerExtension === 'function') {
        registerExtension({
            // settingsHtml 会直接渲染到扩展设置列表
            settingsHtml: `
                <div class="extension-settings inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>🎭 Discord 社区小剧场</b>
                        <span class="inline-drawer-icon fa-solid fa-circle-chevron-down"></span>
                    </div>
                    <div class="inline-drawer-content" style="max-height:400px; overflow-y:auto;">
                        <div id="theater-messages" style="padding:10px;">
                            <div style="text-align:center; padding:20px; color:#aaa;">
                                <i class="fa-solid fa-spinner fa-spin"></i> 加载剧场中...
                            </div>
                        </div>
                    </div>
                </div>
            `
        });
    } else {
        // 如果 registerExtension 不存在，在页面左上角显示报错
        const err = document.createElement('div');
        err.style.cssText = 'position:fixed; top:0; left:0; background:red; color:white; padding:5px; z-index:9999;';
        err.textContent = '❌ registerExtension 函数未找到';
        document.body.appendChild(err);
        return;
    }

    // 加载 Worker 数据
    async function fetchTheaterData(channelType = 'theater_1') {
        try {
            const resp = await fetch(`${WORKER_URL}?channelType=${channelType}`);
            const result = await resp.json();
            return (result.success && result.data) ? result.data : [];
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    async function render() {
        const container = document.getElementById('theater-messages');
        if (!container) return;
        const messages = await fetchTheaterData();
        if (!messages.length) {
            container.innerHTML = '<div style="color:#aaa; text-align:center;">暂无消息</div>';
            return;
        }
        let html = '';
        messages.forEach(msg => {
            const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
            html += `
                <div style="margin-bottom:12px; border-left:3px solid #7289da; padding-left:8px;">
                    <div style="font-weight:bold; color:#b9bbbe;">
                        ${escapeHtml(msg.author)}
                        <span style="font-size:0.8em; color:#72767d;">${time}</span>
                    </div>
                    <div style="color:#dcddde; white-space:pre-wrap;">${escapeHtml(msg.content)}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // 页面加载后自动渲染
    if (document.readyState === 'complete') {
        render();
    } else {
        window.addEventListener('load', render);
    }
})();
