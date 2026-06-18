const MODULE_NAME = 'discord_theater';
const WORKER_URL = 'https://noisy-poetry-480d.blumenkatze0108-b18.workers.dev/'; 
let currentChannel = 'theater_1';
let isFetching = false;

// 声明注入 UI 的核心逻辑
function injectUI() {
    // 防重复注入保护
    if ($('#discord-theater-drawer').length) return;

    const html = `
        <div id="discord-theater-drawer" class="inline-drawer">
            <div id="discord-theater-toggle" class="inline-drawer-toggle inline-drawer-header" style="cursor:pointer;">
                <b>🎭 Discord 社区小剧场</b>
                <div class="inline-drawer-icon fa-solid fa-chevron-down"></div>
            </div>
            <div id="discord-theater-content" class="inline-drawer-content" style="display: none; padding: 10px;">
                <div class="theater-tabs" style="display:flex; gap:5px; margin-bottom:10px;">
                    <button class="menu_button active" data-channel="theater_1" style="flex:1; padding:6px; cursor:pointer;">🎭 官方剧场</button>
                    <button class="menu_button" data-channel="theater_2" style="flex:1; padding:6px; cursor:pointer;">✍️ 同人投稿</button>
                </div>
                <div id="theater-list" style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding-right:3px;">
                    <p style="font-size:0.9em; color:var(--grey-50);">正在从 Discord 同步中...</p>
                </div>
            </div>
        </div>
    `;

    // 强行塞入酒馆设置面板
    $('#extensions_settings').append(html);

    // 绑定手势触控展开事件
    $('#discord-theater-toggle').on('click', function() {
        $('#discord-theater-content').slideToggle(150);
        $(this).find('.inline-drawer-icon').toggleClass('fa-chevron-down fa-chevron-up');
    });

    // 绑定标签切换事件
    $('.theater-tabs button').on('click', async function(e) {
        e.stopPropagation();
        $('.theater-tabs button').removeClass('active');
        $(this).addClass('active');
        currentChannel = $(this).data('channel');
        await loadTheaterList();
    });

    // 注入后立刻触发一次数据加载
    loadTheaterList();
}

async function loadTheaterList() {
    const listContainer = $('#theater-list');
    if (!listContainer.length || isFetching) return;
    
    isFetching = true;
    listContainer.html('<p style="font-size:0.9em; color:var(--grey-50);">正在加载最新内容...</p>');

    try {
        const response = await fetch(`${WORKER_URL}?channelType=${currentChannel}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            listContainer.empty();
            
            result.data.forEach(item => {
                if (!item.content) return;
                
                const previewTitle = item.content.substring(0, 35) + (item.content.length > 35 ? '...' : '');
                
                const cardHtml = `
                    <div class="theater-card" style="background:var(--black-70); border:1px solid var(--grey-30); padding:10px; border-radius:6px; cursor:pointer; margin-bottom:5px;">
                        <div style="font-size:0.8em; color:var(--grey-50); margin-bottom:3px;">👤 ${item.author}</div>
                        <div style="font-size:0.95em; color:var(--text-color); font-weight:bold;">${previewTitle}</div>
                        <div class="full-content" style="display:none; margin-top:8px; border-top:1px dashed #444; padding-top:8px; white-space:pre-wrap; font-size:0.9em; color:#ddd; line-height:1.4;">${item.content}</div>
                        <button class="menu_button use-theater-btn" style="display:none; width:100%; margin-top:8px; background:var(--blue-50)!important; font-size:0.85em; padding:4px;">⚡ 导入到当前输入框</button>
                    </div>
                `;
                listContainer.append(cardHtml);
            });

            $('.theater-card').off('click').on('click', function(e) {
                if ($(e.target).hasClass('use-theater-btn')) return;
                $(this).find('.full-content').slideToggle(150);
                $(this).find('.use-theater-btn').toggle();
            });

            $('.use-theater-btn').off('click').on('click', function() {
                const fullContent = $(this).siblings('.full-content').text();
                const sendTextArea = $('#send_textarea');
                
                if (sendTextArea.length) {
                    sendTextArea.val(fullContent);
                    sendTextArea.trigger('input'); 
                    toastr.success('已成功将小剧场导入输入框！');
                }
            });

        } else {
            listContainer.html('<p style="font-size:0.9em; color:var(--grey-50);">该频道空空如也~</p>');
        }
    } catch (error) {
        listContainer.html('<p style="color:var(--text-error); font-size:0.9em;">同步失败，请稍后再试。</p>');
    } {
        isFetching = false;
    }
}

// 👁️ 核心降维打击：用动态错误隔离+高频轮询定时器，无视酒馆的一切擦除和生命周期机制
(async () => {
    try {
        const { registerExtension } = await import('../../extensions.js');
        registerExtension({ name: MODULE_NAME, render: () => {} });
    } catch (e) {
        try {
            const { registerExtension } = await import('/scripts/extensions.js');
            registerExtension({ name: MODULE_NAME, render: () => {} });
        } catch (err) {
            console.log("[Discord Theater] 独立注入模式启动");
        }
    }

    // 开启高频监控：每 1 秒检查一次，只要发现菜单被酒馆偷偷清空了，瞬间重新粘上去！
    setInterval(() => {
        if ($('#extensions_settings').length && !$('#discord-theater-drawer').length) {
            injectUI();
        }
    }, 1000);
})();
