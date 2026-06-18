// 使用全局注册函数（已修正）
const extensionSettings = {
    settingsHtml: null, // 触发自动加载同目录下 index.html
};

if (typeof registerExtension === 'function') {
    registerExtension(extensionSettings);
} else {
    console.error('[小剧场] registerExtension 不存在');
}

// Worker 地址（你的真实地址）
const WORKER_BASE_URL = 'https://noisy-poetry-480d.blumenkatze0108-b18.workers.dev/';

async function fetchTheaterData(channelType = 'theater_1') {
    try {
        const resp = await fetch(`${WORKER_BASE_URL}?channelType=${channelType}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const result = await resp.json();
        // Worker 返回 { success: true, data: [...] }
        if (result.success && Array.isArray(result.data)) {
            return result.data;
        } else {
            console.error('[小剧场] Worker 返回数据异常', result);
            return [];
        }
    } catch (e) {
        console.error('[小剧场] 拉取数据失败：', e);
        return null;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderMessages(messages) {
    const container = document.getElementById('theater-content');
    const loading = document.getElementById('theater-loading');
    if (!container) return;

    if (!messages || messages.length === 0) {
        container.innerHTML = '<div style="padding:10px; color: #aaa;">暂无消息</div>';
    } else {
        let html = '';
        messages.forEach(msg => {
            const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
            html += `
                <div style="margin-bottom: 12px; border-left: 3px solid #7289da; padding-left: 8px;">
                    <div style="font-weight: bold; color: #b9bbbe;">
                        ${escapeHtml(msg.author)}
                        <span style="font-size: 0.8em; color: #72767d;">${time}</span>
                    </div>
                    <div style="color: #dcddde; white-space: pre-wrap;">${escapeHtml(msg.content)}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    if (loading) loading.style.display = 'none';
}

// 启动时加载
function initPlugin() {
    fetchTheaterData('theater_1').then(renderMessages);
}

if (document.readyState === 'complete') {
    initPlugin();
} else {
    window.addEventListener('load', initPlugin);
}
