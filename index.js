// 使用酒馆标准绝对路由，彻底解决全版本路径不兼容导致的无法加载问题
import { registerExtension } from '/scripts/extensions.js';

const MODULE_NAME = 'discord_theater';
const WORKER_URL = 'https://noisy-poetry-480d.blumenkatze0108-b18.workers.dev/'; 
let currentChannel = 'theater_1';

async function init() {
    console.log("[Discord Theater] 动力引擎加载成功，开始注入 UI...");
    injectUI();
    await loadTheaterList();
}

function injectUI() {
    // 移除不必要的外部样式依赖，采用酒馆原生 CSS 变量，确保触控屏完美适配
    const html = `
        <div id="discord-theater-container" style="padding:10px; background:rgba(0,0,0,0.2); border-radius:8px; margin-top:10px;">
            <h4 style="margin-top:0; color:var(--text-color); font-size:1.1em; display:flex; align-items:center; gap:5px;">
                🎭 社区同步小剧场
            </h4>
            <div class="theater-tabs" style="display:flex; gap:5px; margin-bottom:10px;">
                <button class="menu_button active" data-channel="theater_1" style="flex:1; padding:6px; cursor:pointer;">🎭 官方剧场</button>
                <button class="menu_button" data-channel="theater_2" style="flex:1; padding:6px; cursor:pointer;">✍️ 同人投稿</button>
            </div>
            <div id="theater-list" style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding-right:3px;">
                <p style="font-size:0.9em; color:var(--grey-50);">正在从 Discord 同步中...</p>
            </div>
        </div>
    `;
    $('#extensions_menu').append(html);

    // 触控切换标签页逻辑
    $('.theater-tabs button').on('click', async function() {
        $('.theater-tabs button').removeClass('active');
        $(this).addClass('active');
        currentChannel = $(this).data('channel');
        await loadTheaterList();
    });
}

async function loadTheaterList() {
    const listContainer = $('#theater-list');
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
                    <div class="theater-card" style="background:var(--black-70); border:1px solid var(--grey-30); padding:10px; border-radius:6px; cursor:pointer; transition:0.2s;">
                        <div style="font-size:0.8em; color:var(--grey-50); margin-bottom:3px;">👤 ${item.author}</div>
                        <div style="font-size:0.95em; color:var(--text-color); font-weight:bold;">${previewTitle}</div>
                        <div class="full-content" style="display:none; margin-top:8px; border-top:1px dashed #444; padding-top:8px; white-space:pre-wrap; font-size:0.9em; color:#ddd; line-height:1.4;">${item.content}</div>
                        <button class="menu_button use-theater-btn" style="display:none; width:100%; margin-top:8px; background:var(--blue-50)!important; font-size:0.85em; padding:4px;">⚡ 导入到当前输入框</button>
                    </div>
                `;
                listContainer.append(cardHtml);
            });

            // 针对手机平板优化的手势点击折叠菜单
            $('.theater-card').off('click').on('click', function(e) {
                if ($(e.target).hasClass('use-theater-btn')) return;
                $(this).find('.full-content').slideToggle(150);
                $(this).find('.use-theater-btn').toggle();
            });

            // 一键导入输入框逻辑
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

// 🟢 改成这样，让酒馆第一时间抓到它：
registerExtension({
    name: MODULE_NAME,
    render: init
});
