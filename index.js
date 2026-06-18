const MODULE_NAME = 'discord_theater';
const WORKER_URL = 'https://noisy-poetry-480d.blumenkatze0108-b18.workers.dev/';

let currentChannel = 'theater_1';
let isFetching = false;

function getInjectTarget() {
    return (
        $('#extensions_settings').first().length ? $('#extensions_settings').first() :
        $('#extensions_settings2').first().length ? $('#extensions_settings2').first() :
        $('.extensions_settings').first().length ? $('.extensions_settings').first() :
        $('#extensionsMenu').first().length ? $('#extensionsMenu').first() :
        $('.drawer-content').first().length ? $('.drawer-content').first() :
        $('body')
    );
}

function injectUI() {
    if ($('#discord-theater-drawer').length) return;

    const html = `
        <div id="discord-theater-drawer" class="inline-drawer" style="margin-top:10px;">
            <div id="discord-theater-toggle" class="inline-drawer-toggle inline-drawer-header" style="cursor:pointer;">
                <b>🎭 Discord 社区小剧场</b>
                <div class="inline-drawer-icon fa-solid fa-chevron-down"></div>
            </div>

            <div id="discord-theater-content" class="inline-drawer-content" style="display:none; padding:10px;">
                <div class="theater-tabs" style="display:flex; gap:6px; margin-bottom:10px;">
                    <button class="menu_button active" data-channel="theater_1" style="flex:1; padding:6px; cursor:pointer;">🎭 官方剧场</button>
                    <button class="menu_button" data-channel="theater_2" style="flex:1; padding:6px; cursor:pointer;">✍️ 同人投稿</button>
                </div>

                <div style="display:flex; gap:6px; margin-bottom:10px;">
                    <button id="theater-refresh-btn" class="menu_button" style="flex:1; padding:6px;">🔄 刷新</button>
                </div>

                <div id="theater-list" style="max-height:320px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding-right:3px;">
                    <p style="font-size:0.9em; color:var(--grey-50);">正在从 Discord 同步中...</p>
                </div>
            </div>
        </div>
    `;

    getInjectTarget().append(html);

    $('#discord-theater-toggle').off('click').on('click', function () {
        $('#discord-theater-content').slideToggle(150);
        $(this).find('.inline-drawer-icon').toggleClass('fa-chevron-down fa-chevron-up');
    });

    $('.theater-tabs button').off('click').on('click', async function (e) {
        e.stopPropagation();

        $('.theater-tabs button').removeClass('active');
        $(this).addClass('active');

        currentChannel = $(this).data('channel');
        await loadTheaterList();
    });

    $('#theater-refresh-btn').off('click').on('click', async function (e) {
        e.stopPropagation();
        await loadTheaterList();
    });

    loadTheaterList();
}

function escapeHtml(text) {
    return String(text ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getSendTextarea() {
    return $('#send_textarea').length ? $('#send_textarea') :
        $('textarea[name="send_textarea"]').length ? $('textarea[name="send_textarea"]') :
        $('textarea').first();
}

async function loadTheaterList() {
    const listContainer = $('#theater-list');

    if (!listContainer.length || isFetching) return;

    isFetching = true;
    listContainer.html('<p style="font-size:0.9em; color:var(--grey-50);">正在加载最新内容...</p>');

    try {
        const response = await fetch(`${WORKER_URL}?channelType=${encodeURIComponent(currentChannel)}`);

        if (!response.ok) {
            throw new Error(`Worker 返回异常：${response.status}`);
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            listContainer.empty();

            result.data.forEach((item) => {
                if (!item.content) return;

                const author = escapeHtml(item.author || '未知用户');
                const content = escapeHtml(item.content);
                const previewTitle = escapeHtml(
                    item.content.substring(0, 35) + (item.content.length > 35 ? '...' : '')
                );

                const cardHtml = `
                    <div class="theater-card" style="background:var(--black-70); border:1px solid var(--grey-30); padding:10px; border-radius:8px; cursor:pointer; margin-bottom:6px;">
                        <div style="font-size:0.8em; color:var(--grey-50); margin-bottom:4px;">👤 ${author}</div>
                        <div style="font-size:0.95em; color:var(--text-color); font-weight:bold;">${previewTitle}</div>

                        <div class="full-content" style="display:none; margin-top:8px; border-top:1px dashed var(--grey-30); padding-top:8px; white-space:pre-wrap; font-size:0.9em; color:var(--text-color); line-height:1.45;">${content}</div>

                        <button class="menu_button use-theater-btn" style="display:none; width:100%; margin-top:8px; font-size:0.85em; padding:6px;">
                            ⚡ 导入到当前输入框
                        </button>
                    </div>
                `;

                listContainer.append(cardHtml);
            });

            $('.theater-card').off('click').on('click', function (e) {
                if ($(e.target).hasClass('use-theater-btn')) return;

                $(this).find('.full-content').slideToggle(150);
                $(this).find('.use-theater-btn').toggle();
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
