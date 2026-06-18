import { registerExtension } from '../../extensions.js';

const MODULE_NAME = 'discord_theater';
const WORKER_URL = 'https://noisy-poetry-480d.blumenkatze0108-b18.workers.dev/'; 
let currentChannel = 'theater_1';

async function init() {
    console.log("[Discord Theater] 正在注入到扩展程序设置面板...");
    injectUI();
    await loadTheaterList();
}

function injectUI() {
    // 1. 如果已经存在旧面板，先移除防止重复注入
    $('#discord-theater-drawer').remove();

    // 2. 完美的酒馆原生折叠菜单（inline-drawer）结构，确保和“酒馆助手”视觉完全一致
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

    // 3. 精准注入到你截图2所看的“扩展程序”设置列表中
    $('#extensions_settings').append(html);

    // 4. 手动绑定折叠菜单的展开与收起，确保手机端触控绝对可用
    $('#discord-theater-toggle').off('click').on('click', function() {
        $('#discord-theater-content').slideToggle(150);
        $(this).find('.inline-drawer-icon').toggleClass('fa-chevron-down fa-chevron-up');
    });

    // 5. 触控切换标签页逻辑
    $('.theater-tabs button').off('click').on('click', async function(e) {
        e.stopPropagation(); // 阻止事件冒泡，防止点击按钮时把菜单折叠起来
        $('.theater-tabs button').removeClass('active');
        $(this).addClass('active');
        currentChannel = $(this).data('channel');
        await loadTheaterList();
    });
}

async function loadTheaterList() {
    const listContainer = $('#theater-list');
    if (!listContainer.length) return;
    
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
                    <div class="theater-card" style="background:var(--black-70); border:1px solid var(--grey-30); padding:10px; border-radius:6px; cursor:pointer; transition:0.2s; margin-bottom:5px;">
                        <div style="font-size:0.8em; color:var(--grey-50); margin-bottom:3px;">👤 ${item.author}</div>
                        <div style="font-size:0.95em; color:var(--text-color); font-weight:bold;">${previewTitle}</div>
                        <div class="full-content" style="display:none; margin-top:8px; border-top:1px dashed #444; padding-top:8px; white-space:pre-wrap; font-size:0.9em; color:#ddd; line-height:1.4;">${item.content}</div>
                        <button class="menu_button use-theater-btn" style="display:none; width:100%; margin-top:8px; background:var(--blue-50)!important; font-size:0.85em; padding:4px;">⚡ 导入到当前输入框</button>
                    </div>
                `;
                listContainer.append(cardHtml);
            });

            // 卡片点击展开逻辑
            $('.theater-card').off('click').on('click', function(e) {
                if ($(e.target).hasClass('use-theater-btn')) return;
                $(this).find('.full-content').slideToggle(150);
                $(this).find('.use-theater-btn').toggle();
            });

            // 一键导入到酒馆输入框
            $('.use-theater-btn').off('click').on('click', function() {
                const fullContent = $(this).siblings('.full-content').text();
                const sendTextArea = $('#send_textarea');
                
                if (sendTextArea.length) {
                    sendTextArea.val(fullContent);
                    sendTextArea.trigger('input'); 
                    toastr.success('已成功将小剧场导入输入框！');
                } else {
                    toastr.error('未检测到酒馆输入框');
                }
            });

        } else {
            listContainer.html('<p style="font-size:0.9em; color:var(--grey-50);">该频道空空如也~</p>');
        }
    } catch (error) {
        listContainer.html('<p style="color:var(--text-error); font-size:0.9em;">同步失败，请稍后再试。</p>');
    }
}

// 极其关键：直接注册，绝不延迟
registerExtension({
    name: MODULE_NAME,
    render: init
});
