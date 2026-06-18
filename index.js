import { registerExtension } from '../../scripts/extensions.js';

// 核心注册：让酒馆自动加载 index.html 作为设置面板
const extension = {
    settingsHtml: null, // 触发自动抓取同目录下的 index.html
};

registerExtension(extension);

// 加载 Discord 数据（请替换成你的 Worker 真实地址）
const WORKER_BASE_URL = 'https://noisy-poetry-480d.blumenkatze0108-b18.workers.dev/';

async function fetchTheaterData(channelType = 'theater_1') {
    try {
        const response = await fetch(`${WORKER_BASE_URL}?channelType=${channelType}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('[小剧场插件] 数据拉取失败:', error);
        return null;
    }
}

function renderMessages(messages) {
    const container = document.getElementById('theater-content');
    const loading = document.getElementById('theater-loading');
    if (!container) return;

    if (!messages || messages.length === 0) {
        container.innerHTML = '<div style="padding:10px; color: #aaa;">暂无消息</div>';
        if (loading) loading.style.display = 'none';
        return;
    }

    let html = '';
    messages.forEach(msg => {
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
        html += `
            <div style="margin-bottom: 12px; border-left: 3px solid #7289da; padding-left: 8px;">
                <div style="font-weight: bold; color: #b9bbbe;">
                    ${escapeHtml(msg.author)} 
                    <span style="font-size: 0.8em; color: #72767d;">${timestamp}</span>
                </div>
                <div style="color: #dcddde; white-space: pre-wrap;">${escapeHtml(msg.content)}</div>
            </div>
        `;
    });

    container.innerHTML = html;
    if (loading) loading.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 页面就绪后执行
if (document.readyState === 'complete') {
    initPlugin();
} else {
    window.addEventListener('load', initPlugin);
}

async function initPlugin() {
    // 默认先拉取频道1（可后续加按钮切换）
    const data = await fetchTheaterData('theater_1');
    renderMessages(data);
}                $(this).find('.use-theater-btn').toggle();
            });

            $('.use-theater-btn').off('click').on('click', function (e) {
                e.stopPropagation();

                const fullContent = $(this).siblings('.full-content').text();
                const sendTextArea = getSendTextarea();

                if (sendTextArea.length) {
                    sendTextArea.val(fullContent);
                    sendTextArea.trigger('input');
                    sendTextArea.trigger('change');

                    if (typeof toastr !== 'undefined') {
                        toastr.success('已成功将小剧场导入输入框！');
                    }
                } else {
                    if (typeof toastr !== 'undefined') {
                        toastr.error('没有找到输入框。');
                    }
                }
            });
        } else {
            listContainer.html('<p style="font-size:0.9em; color:var(--grey-50);">该频道空空如也。</p>');
        }
    } catch (error) {
        console.error('[Discord Theater] 同步失败：', error);
        listContainer.html('<p style="color:var(--text-error); font-size:0.9em;">同步失败，请检查 Worker 地址或网络。</p>');
    } finally {
        isFetching = false;
    }
}

function injectFloatingButton() {
    if ($('#discord-theater-float-btn').length) return;

    const floatHtml = `
        <button id="discord-theater-float-btn" title="Discord 社区小剧场" style="
            position: fixed;
            right: 14px;
            bottom: 86px;
            z-index: 9999;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            border: 1px solid var(--grey-30);
            background: var(--SmartThemeBlurTintColor, rgba(30,30,30,0.75));
            color: var(--text-color);
            font-size: 22px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.25);
            backdrop-filter: blur(8px);
            cursor: pointer;
        ">🎭</button>
    `;

    $('body').append(floatHtml);

    $('#discord-theater-float-btn').off('click').on('click', function () {
        injectUI();
        $('#discord-theater-content').show();
        $('#discord-theater-toggle .inline-drawer-icon')
            .removeClass('fa-chevron-down')
            .addClass('fa-chevron-up');

        const drawer = $('#discord-theater-drawer')[0];
        if (drawer && drawer.scrollIntoView) {
            drawer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

(async () => {
    try {
        const { registerExtension } = await import('../../extensions.js');
        registerExtension({ name: MODULE_NAME, render: () => {} });
    } catch (e) {
        try {
            const { registerExtension } = await import('/scripts/extensions.js');
            registerExtension({ name: MODULE_NAME, render: () => {} });
        } catch (err) {
            console.log('[Discord Theater] 独立注入模式启动');
        }
    }

    setInterval(() => {
        if (!$('#discord-theater-drawer').length) {
            injectUI();
        }

        if (!$('#discord-theater-float-btn').length) {
            injectFloatingButton();
        }
    }, 1000);
})();
