// JavaScript for subscription management app
// Future tasks will populate this file.

console.log("script.js loaded");

// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker 注册成功，作用域: ', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker 注册失败: ', error);
            });
    });
}

// 预设服务数据
const presetServices = [
  { id: 'netflix', name: 'Netflix', defaultUrl: 'https://www.netflix.com', category: 'entertainment', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=64' },
  { id: 'spotify', name: 'Spotify', defaultUrl: 'https://www.spotify.com', category: 'entertainment', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=spotify.com&sz=64' },
  { id: 'youtube_premium', name: 'YouTube Premium', defaultUrl: 'https://www.youtube.com/premium', category: 'entertainment', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64' },
  { id: 'office365', name: 'Microsoft 365', defaultUrl: 'https://www.microsoft.com/microsoft-365', category: 'work', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=64' },
  { id: 'aws', name: 'Amazon Web Services', defaultUrl: 'https://aws.amazon.com', category: 'work', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=64' },
  { id: 'github_pro', name: 'GitHub Pro', defaultUrl: 'https://github.com/pricing', category: 'work', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=github.com&sz=64' },
  { id: 'icloud', name: 'iCloud+', defaultUrl: 'https://www.apple.com/icloud/', category: 'utility', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=icloud.com&sz=64' },
  { id: 'google_one', name: 'Google One', defaultUrl: 'https://one.google.com/', category: 'utility', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=one.google.com&sz=64' }
];

document.addEventListener('DOMContentLoaded', () => {
    const subscriptionForm = document.getElementById('add-subscription-form');
    const subscriptionListDiv = document.getElementById('subscription-list');
    const submitButton = subscriptionForm.querySelector('button[type="submit"]');
    const billingCycleSelect = document.getElementById('billing-cycle');
    const startDateInput = document.getElementById('start-date');
    const expiryDateInput = document.getElementById('expiry-date');
    const currencyInput = document.getElementById('currency');
    const categorySelect = document.getElementById('category');
    const categoryFilterSelect = document.getElementById('category-filter');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const localCurrencyInput = document.getElementById('local-currency');
    const saveSettingsButton = document.getElementById('save-settings');
    const notificationPanel = document.getElementById('notification-panel');
    const notificationContent = document.getElementById('notification-content');
    const closeNotificationButton = document.getElementById('close-notification');
    const apiKeyInput = document.getElementById('api-key');
    const refreshRatesButton = document.getElementById('refresh-rates');
    const ratesStatusDiv = document.getElementById('rates-status');
    const developerModeCheckbox = document.getElementById('developer-mode');
    const apiCallCountSpan = document.getElementById('api-call-count');
    const refreshFrequencySpan = document.getElementById('refresh-frequency');
    const lastRefreshTimeSpan = document.getElementById('last-refresh-time');
    const themeSelect = document.getElementById('theme-select'); // 新增：主题选择器

    // 通知设置相关元素
    const enableNotificationsCheckbox = document.getElementById('enable-notifications');
    const notificationSettingsDiv = document.getElementById('notification-settings');
    const notificationDaysInput = document.getElementById('notification-days');
    const notificationDailyCheckbox = document.getElementById('notification-daily');
    const testNotificationButton = document.getElementById('test-notification');
    const notificationStatusDiv = document.getElementById('notification-status');

    // 数据导入/导出相关元素
    const exportJsonButton = document.getElementById('export-json');
    const exportCsvButton = document.getElementById('export-csv');
    const importFileInput = document.getElementById('import-file');
    const selectedFileNameSpan = document.getElementById('selected-file-name');
    const importReplaceCheckbox = document.getElementById('import-replace');
    const importButton = document.getElementById('import-button');
    const importStatusDiv = document.getElementById('import-status');

    // 统计相关元素
    const totalSubscriptionsElement = document.getElementById('total-subscriptions');
    const monthlyTotalElement = document.getElementById('monthly-total');
    const annualTotalElement = document.getElementById('annual-total');
    const categoryChartCanvas = document.getElementById('category-chart');
    const trendChartCanvas = document.getElementById('trend-chart');
    const trendTimeRangeSelect = document.getElementById('trend-time-range'); // 新增时间范围选择器

    // 预设服务模态框相关元素
    const showPresetModalBtn = document.getElementById('show-preset-modal-btn');
    const closePresetModalBtn = document.getElementById('close-preset-modal-btn');
    const presetServiceModal = document.getElementById('preset-service-modal');
    const searchPresetServiceInput = document.getElementById('search-preset-service');
    const presetServiceListDiv = document.getElementById('preset-service-list');
    const paymentAccountInput = document.getElementById('payment-account'); // 新增：支付账户输入框
    const priceHistoryNotesInput = document.getElementById('price-history-notes'); // 新增：价格历史输入框

    // 添加"自动计算"复选框到表单中
    const expiryDateContainer = expiryDateInput.parentElement;
    const autoCalculateCheckbox = document.createElement('div');
    autoCalculateCheckbox.innerHTML = `
        <input type="checkbox" id="auto-calculate" name="auto-calculate" checked>
        <label for="auto-calculate">自动计算到期日期（基于周期和首次订阅日期）</label>
    `;
    expiryDateContainer.insertAdjacentElement('afterend', autoCalculateCheckbox);
    const autoCalculateCheck = document.getElementById('auto-calculate');

    // 设置相关功能
    const SETTINGS_KEY = 'subscriptionAppSettings';
    let appSettings = {
        localCurrency: 'CNY',
        apiKey: 'ca228e734975f64f02e34368', // 默认使用提供的API Key
        notificationDismissed: false,
        lastNotificationDate: null,
        isDeveloperMode: false, // 默认为普通用户模式
        apiCallCount: 0, // API调用计数器
        lastApiCallDate: null, // 最后一次API调用日期

        // 浏览器通知设置
        enableNotifications: false, // 是否启用浏览器通知
        notificationDays: 7, // 提前多少天发送到期提醒
        notificationDaily: false, // 对已过期订阅每天发送提醒
        lastNotificationCheck: null, // 上次检查通知的时间
        notifiedSubscriptions: {}, // 已通知的订阅ID及其通知时间
        theme: 'light' // 新增：默认主题为亮色
    };

    const EXCHANGE_RATES_KEY = 'subscriptionExchangeRates';
    let exchangeRatesCache = {
        timestamp: null,
        base: '',
        rates: {}
    };

    // 获取刷新频率（小时）
    function getRefreshFrequency() {
        // 检查是否使用的是默认API密钥
        const isUsingDefaultApiKey = appSettings.apiKey === 'ca228e734975f64f02e34368';

        // 如果使用自己的API密钥且开启了开发者模式
        if (!isUsingDefaultApiKey && appSettings.isDeveloperMode) {
            return 0; // 开发者模式：无限制刷新
        }
        // 如果使用默认API密钥且API调用次数达到500次
        else if (isUsingDefaultApiKey && appSettings.apiCallCount >= 500) {
            return 24; // 默认API密钥高频使用：每24小时刷新一次
        }
        // 其他情况
        else {
            return 12; // 普通情况：每12小时刷新一次
        }
    }

    // 更新API使用情况显示
    function updateApiUsageInfo() {
        apiCallCountSpan.textContent = appSettings.apiCallCount;

        const frequency = getRefreshFrequency();
        if (frequency === 0) {
            refreshFrequencySpan.textContent = '无限制（开发者模式）';
        } else {
            refreshFrequencySpan.textContent = `每${frequency}小时`;
        }

        if (appSettings.lastApiCallDate) {
            const date = new Date(appSettings.lastApiCallDate);
            lastRefreshTimeSpan.textContent = date.toLocaleString();
        } else {
            lastRefreshTimeSpan.textContent = '从未刷新';
        }

        // 更新开发者模式复选框状态
        updateDeveloperModeCheckbox();
    }

    // 更新开发者模式复选框状态
    function updateDeveloperModeCheckbox() {
        // 检查是否使用默认API密钥
        const isUsingDefaultApiKey = apiKeyInput.value.trim() === 'ca228e734975f64f02e34368';

        // 如果使用默认API密钥，禁用开发者模式复选框
        if (isUsingDefaultApiKey) {
            developerModeCheckbox.disabled = true;
            developerModeCheckbox.checked = false;
            developerModeCheckbox.parentElement.title = '使用默认API密钥时无法启用开发者模式';
        } else {
            // 如果使用自己的API密钥，启用开发者模式复选框
            developerModeCheckbox.disabled = false;
            developerModeCheckbox.parentElement.title = '';
        }
    }

    // 检查浏览器是否支持通知
    function checkNotificationSupport() {
        if (!('Notification' in window)) {
            console.warn('浏览器不支持通知功能');
            enableNotificationsCheckbox.disabled = true;
            enableNotificationsCheckbox.checked = false;
            notificationSettingsDiv.classList.add('hidden');
            notificationStatusDiv.textContent = '您的浏览器不支持通知功能';
            notificationStatusDiv.className = 'notification-status error';
            return false;
        }
        return true;
    }

    // 请求通知权限
    async function requestNotificationPermission() {
        if (!checkNotificationSupport()) return false;

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                notificationStatusDiv.textContent = '通知权限已授予';
                notificationStatusDiv.className = 'notification-status success';
                return true;
            } else {
                notificationStatusDiv.textContent = '通知权限被拒绝，请在浏览器设置中启用通知';
                notificationStatusDiv.className = 'notification-status error';
                enableNotificationsCheckbox.checked = false;
                return false;
            }
        } catch (error) {
            console.error('请求通知权限时出错:', error);
            notificationStatusDiv.textContent = `请求通知权限时出错: ${error.message}`;
            notificationStatusDiv.className = 'notification-status error';
            enableNotificationsCheckbox.checked = false;
            return false;
        }
    }

    // 显示通知设置区域
    function toggleNotificationSettings() {
        if (enableNotificationsCheckbox.checked) {
            notificationSettingsDiv.classList.remove('hidden');
            requestNotificationPermission();
        } else {
            notificationSettingsDiv.classList.add('hidden');
            notificationStatusDiv.textContent = '';
            notificationStatusDiv.className = 'notification-status';
        }
    }

    // 加载应用设置
    function loadSettings() {
        const storedSettings = localStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
            appSettings = JSON.parse(storedSettings);

            // 确保新添加的字段存在
            if (appSettings.apiCallCount === undefined) appSettings.apiCallCount = 0;
            if (appSettings.isDeveloperMode === undefined) appSettings.isDeveloperMode = false;
            if (appSettings.lastApiCallDate === undefined) appSettings.lastApiCallDate = null;

            // 确保通知设置字段存在
            if (appSettings.enableNotifications === undefined) appSettings.enableNotifications = false;
            if (appSettings.notificationDays === undefined) appSettings.notificationDays = 7;
            if (appSettings.notificationDaily === undefined) appSettings.notificationDaily = false;
            if (appSettings.lastNotificationCheck === undefined) appSettings.lastNotificationCheck = null;
            if (appSettings.notifiedSubscriptions === undefined) appSettings.notifiedSubscriptions = {};
            if (appSettings.theme === undefined) appSettings.theme = 'light'; // 新增：确保主题设置存在
        }

        // 更新UI以反映设置
        localCurrencyInput.value = appSettings.localCurrency;
        apiKeyInput.value = appSettings.apiKey || '';
        developerModeCheckbox.checked = appSettings.isDeveloperMode;
        themeSelect.value = appSettings.theme; // 新增：设置主题选择器的值
        applyTheme(appSettings.theme); // 新增：应用加载的主题

        // 更新通知设置UI
        enableNotificationsCheckbox.checked = appSettings.enableNotifications;
        notificationDaysInput.value = appSettings.notificationDays;
        notificationDailyCheckbox.checked = appSettings.notificationDaily;

        // 根据通知启用状态显示/隐藏设置区域
        if (appSettings.enableNotifications) {
            notificationSettingsDiv.classList.remove('hidden');
        } else {
            notificationSettingsDiv.classList.add('hidden');
        }

        // 更新API使用情况显示
        updateApiUsageInfo();

        // 更新开发者模式复选框状态
        updateDeveloperModeCheckbox();

        // 检查通知支持
        checkNotificationSupport();
    }

    // 保存应用设置
    function saveSettings() {
        appSettings.localCurrency = localCurrencyInput.value.trim().toUpperCase() || 'CNY';
        appSettings.apiKey = apiKeyInput.value.trim();

        // 检查是否使用默认API密钥
        const isUsingDefaultApiKey = appSettings.apiKey === 'ca228e734975f64f02e34368';

        // 如果使用默认API密钥，强制禁用开发者模式
        if (isUsingDefaultApiKey) {
            appSettings.isDeveloperMode = false;
            developerModeCheckbox.checked = false;
        } else {
            // 如果使用自己的API密钥，允许设置开发者模式
            appSettings.isDeveloperMode = developerModeCheckbox.checked;
        }

        // 保存通知设置
        appSettings.enableNotifications = enableNotificationsCheckbox.checked;
        appSettings.notificationDays = parseInt(notificationDaysInput.value) || 7;
        appSettings.notificationDaily = notificationDailyCheckbox.checked;
        appSettings.theme = themeSelect.value; // 新增：保存主题设置

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));

        if (exchangeRatesCache.base !== appSettings.localCurrency || !appSettings.apiKey) {
            clearExchangeRatesCache();
        }

        // 更新API使用情况显示
        updateApiUsageInfo();

        console.log("Settings saved:", appSettings);

        // 如果启用了通知，请求权限
        if (appSettings.enableNotifications) {
            requestNotificationPermission();
        }
    }

    // 发送浏览器通知
    function sendNotification(title, options = {}) {
        if (!appSettings.enableNotifications || !checkNotificationSupport()) {
            return false;
        }

        if (Notification.permission !== 'granted') {
            requestNotificationPermission();
            return false;
        }

        try {
            // 设置默认图标
            if (!options.icon) {
                options.icon = 'https://www.google.com/s2/favicons?domain=subscription-manager.com&sz=64';
            }

            // 设置默认通知选项
            const notificationOptions = {
                body: options.body || '',
                icon: options.icon,
                badge: options.badge || options.icon,
                tag: options.tag || 'subscription-manager',
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
                data: options.data || {}
            };

            // 创建并显示通知
            const notification = new Notification(title, notificationOptions);

            // 添加点击事件处理
            notification.onclick = function() {
                window.focus();
                if (options.onClick) {
                    options.onClick();
                }
                notification.close();
            };

            console.log('已发送通知:', title, notificationOptions);
            return true;
        } catch (error) {
            console.error('发送通知时出错:', error);
            return false;
        }
    }

    // 检查订阅到期情况并发送通知
    function checkSubscriptionsAndNotify() {
        if (!appSettings.enableNotifications || Notification.permission !== 'granted') {
            return;
        }

        // 记录本次检查时间
        const now = new Date();
        appSettings.lastNotificationCheck = now.toISOString();

        // 获取今天的日期（不含时间）
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // 检查每个订阅
        subscriptions.forEach(sub => {
            if (!sub.expiryDate) return; // 跳过没有到期日期的订阅

            const expiryDate = new Date(sub.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            const subId = sub.id.toString();

            // 检查是否已经通知过这个订阅
            const lastNotified = appSettings.notifiedSubscriptions[subId]
                ? new Date(appSettings.notifiedSubscriptions[subId]).getTime()
                : 0;

            // 如果今天已经通知过，则跳过
            if (lastNotified >= today && !appSettings.notificationDaily) {
                return;
            }

            // 处理已过期的订阅
            if (daysUntilExpiry < 0) {
                if (appSettings.notificationDaily) {
                    sendNotification(
                        `订阅已过期: ${sub.serviceName}`,
                        {
                            body: `${sub.serviceName} 已过期 ${Math.abs(daysUntilExpiry)} 天。`,
                            icon: sub.serviceIcon,
                            tag: `expired-${subId}`,
                            requireInteraction: true,
                            data: { id: subId, type: 'expired' },
                            onClick: () => {
                                document.getElementById(`subscription-${subId}`).scrollIntoView({ behavior: 'smooth' });
                            }
                        }
                    );

                    // 记录通知时间
                    appSettings.notifiedSubscriptions[subId] = now.toISOString();
                }
            }
            // 处理即将到期的订阅
            else if (daysUntilExpiry <= appSettings.notificationDays) {
                sendNotification(
                    `订阅即将到期: ${sub.serviceName}`,
                    {
                        body: daysUntilExpiry === 0
                            ? `${sub.serviceName} 今天到期。`
                            : `${sub.serviceName} 将在 ${daysUntilExpiry} 天后到期。`,
                        icon: sub.serviceIcon,
                        tag: `expiring-${subId}`,
                        requireInteraction: true,
                        data: { id: subId, type: 'expiring' },
                        onClick: () => {
                            document.getElementById(`subscription-${subId}`).scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                );

                // 记录通知时间
                appSettings.notifiedSubscriptions[subId] = now.toISOString();
            }
        });

        // 保存通知状态
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
    }

    // 设置面板显示/隐藏
    settingsToggle.addEventListener('click', function() {
        settingsPanel.classList.toggle('hidden');
    });

    // 监听API密钥输入框变化
    apiKeyInput.addEventListener('input', function() {
        updateDeveloperModeCheckbox();
    });

    // 保存设置
    saveSettingsButton.addEventListener('click', function() {
        saveSettings();
        settingsPanel.classList.add('hidden');
        renderSubscriptions();

        // 如果启用了通知，立即检查订阅
        if (appSettings.enableNotifications && Notification.permission === 'granted') {
            checkSubscriptionsAndNotify();
        }
    });

    // 刷新汇率数据
    refreshRatesButton.addEventListener('click', async function() {
        if (!appSettings.apiKey) {
            ratesStatusDiv.textContent = '请先设置API Key';
            ratesStatusDiv.className = 'rates-status error';
            return;
        }

        // 检查是否可以刷新汇率数据
        const now = new Date().getTime();
        const cacheAge = exchangeRatesCache.timestamp ? (now - exchangeRatesCache.timestamp) / (1000 * 60 * 60) : Infinity;
        const refreshFrequency = getRefreshFrequency();

        // 如果不是开发者模式，且缓存未过期，则限制刷新频率
        if (!appSettings.isDeveloperMode && cacheAge < refreshFrequency) {
            const remainingHours = (refreshFrequency - cacheAge).toFixed(1);
            ratesStatusDiv.textContent = `刷新频率限制：请在 ${remainingHours} 小时后再试`;
            ratesStatusDiv.className = 'rates-status error';
            return;
        }

        ratesStatusDiv.textContent = '正在获取最新汇率数据...';
        ratesStatusDiv.className = 'rates-status';

        try {
            // 强制更新汇率数据
            const rates = await fetchExchangeRates(true);

            if (rates) {
                ratesStatusDiv.textContent = `汇率数据已更新（${new Date().toLocaleString()}）`;
                ratesStatusDiv.className = 'rates-status success';

                // 重新渲染订阅列表，使用新的汇率数据
                renderSubscriptions();
            } else {
                ratesStatusDiv.textContent = '获取汇率数据失败，请检查API Key和网络连接';
                ratesStatusDiv.className = 'rates-status error';
            }
        } catch (error) {
            console.error('刷新汇率时发生错误:', error);
            ratesStatusDiv.textContent = `获取汇率时发生错误: ${error.message}`;
            ratesStatusDiv.className = 'rates-status error';
        }
    });

    // 当币种输入变化时，更新标签
    // currencyInput.addEventListener('input', updateCurrencyLabels);

    // 关闭提醒面板
    closeNotificationButton.addEventListener('click', function() {
        notificationPanel.classList.add('hidden');

        appSettings.notificationDismissed = true;
        appSettings.lastNotificationDate = new Date().toISOString().split('T')[0];
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
    });

    // 当订阅周期改变或首次订阅日期改变时，自动计算到期日期
    function updateExpiryDate() {
        if (!autoCalculateCheck.checked) return;

        const billingCycle = billingCycleSelect.value;
        const startDate = startDateInput.value;

        if (billingCycle === 'one-time' || !startDate) {
            expiryDateInput.value = '';
            return;
        }

        const expiry = calculateExpiryDate(startDate, billingCycle);
        expiryDateInput.value = expiry;
    }

    // 计算下一个到期日期
    function calculateExpiryDate(startDateStr, billingCycle) {
        if (!startDateStr || billingCycle === 'one-time') return '';

        const startDate = new Date(startDateStr);
        const today = new Date();
        let nextExpiryDate = new Date(startDate);

        if (billingCycle === 'monthly') {
            while (nextExpiryDate <= today) {
                nextExpiryDate.setMonth(nextExpiryDate.getMonth() + 1);
            }
        } else if (billingCycle === 'annually') {
            while (nextExpiryDate <= today) {
                nextExpiryDate.setFullYear(nextExpiryDate.getFullYear() + 1);
            }
        }

        return nextExpiryDate.toISOString().split('T')[0];
    }

    // 计算距离到期日期还有多少天
    function getDaysUntilExpiry(expiryDateStr) {
        if (!expiryDateStr) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiryDate = new Date(expiryDateStr);

        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    // 根据到期日期距离，返回状态标签
    function getExpiryStatusLabel(daysUntilExpiry) {
        if (daysUntilExpiry === null) return '';

        if (daysUntilExpiry < 0) {
            return `<span class="expiry-status overdue">已过期 ${Math.abs(daysUntilExpiry)} 天</span>`;
        } else if (daysUntilExpiry === 0) {
            return `<span class="expiry-status today">今天到期</span>`;
        } else if (daysUntilExpiry <= 7) {
            return `<span class="expiry-status soon">即将到期 (还有 ${daysUntilExpiry} 天)</span>`;
        } else {
            return `<span class="expiry-status ok">还有 ${daysUntilExpiry} 天到期</span>`;
        }
    }

    // 添加事件监听器，自动计算到期日期
    billingCycleSelect.addEventListener('change', updateExpiryDate);
    startDateInput.addEventListener('change', updateExpiryDate);
    autoCalculateCheck.addEventListener('change', function() {
        if (this.checked) {
            updateExpiryDate();
        }
    });

    let subscriptions = [];
    const STORAGE_KEY = 'subscriptionsData';
    let editingId = null;

    // --- Exchange Rate Functions ---
    function clearExchangeRatesCache() {
        exchangeRatesCache = { timestamp: null, base: '', rates: {} };
        localStorage.removeItem(EXCHANGE_RATES_KEY);
        console.log("Exchange rates cache cleared.");
    }

    function loadExchangeRatesCache() {
        const storedRates = localStorage.getItem(EXCHANGE_RATES_KEY);
        if (storedRates) {
            exchangeRatesCache = JSON.parse(storedRates);
            console.log("Loaded exchange rates from cache:", exchangeRatesCache);
        }
    }

    function saveExchangeRatesCache() {
        localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(exchangeRatesCache));
        console.log("Saved exchange rates to cache:", exchangeRatesCache);
    }

    async function fetchExchangeRates(forceUpdate = false) {
        // 检查API Key是否设置
        if (!appSettings.apiKey) {
            console.warn("API Key未设置，无法获取汇率数据。请在设置中添加API Key。");
            return null;
        }

        // 检查本地货币是否设置
        if (!appSettings.localCurrency) {
            console.warn("本地货币未设置，无法获取汇率数据。");
            return null;
        }

        // 计算缓存年龄（小时）
        const now = new Date().getTime();
        const cacheAge = exchangeRatesCache.timestamp ? (now - exchangeRatesCache.timestamp) / (1000 * 60 * 60) : Infinity;

        // 获取当前用户的刷新频率
        const refreshFrequency = getRefreshFrequency();

        // 如果是开发者模式且强制更新，或者缓存已过期，则获取新数据
        // 否则使用缓存数据
        if (!forceUpdate &&
            exchangeRatesCache.rates &&
            Object.keys(exchangeRatesCache.rates).length > 0 &&
            (refreshFrequency === 0 ? true : cacheAge < refreshFrequency)) {

            console.log("使用缓存的汇率数据（缓存年龄：" + cacheAge.toFixed(2) + "小时，刷新频率：" +
                        (refreshFrequency === 0 ? "无限制" : refreshFrequency + "小时") + "）");
            return exchangeRatesCache.rates;
        }

        // 获取新的汇率数据
        console.log(`正在获取新的汇率数据，基准货币: ${appSettings.localCurrency}...`);
        try {
            // 构建API请求URL
            const apiUrl = `https://v6.exchangerate-api.com/v6/${appSettings.apiKey}/latest/${appSettings.localCurrency}`;
            console.log("API请求URL:", apiUrl);

            // 发送请求
            const response = await fetch(apiUrl);

            // 检查响应状态
            if (!response.ok) {
                const errorData = await response.json();
                console.error("获取汇率失败:", response.status, errorData);
                alert(`获取汇率失败: ${errorData['error-type'] || response.statusText}`);
                return null;
            }

            // 解析响应数据
            const data = await response.json();
            console.log("API返回数据:", data);

            // 检查API返回结果
            if (data.result === "success") {
                // 更新缓存
                exchangeRatesCache = {
                    timestamp: now,
                    base: data.base_code,
                    rates: data.conversion_rates
                };

                // 保存缓存
                saveExchangeRatesCache();

                // 更新API调用计数器和最后一次API调用日期
                appSettings.apiCallCount++;
                appSettings.lastApiCallDate = new Date().toISOString();
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));

                // 更新API使用情况显示
                updateApiUsageInfo();

                // 检查返回的基准货币是否与请求的相同
                if (data.base_code !== appSettings.localCurrency) {
                    console.warn(`注意：API返回的基准货币(${data.base_code})与请求的(${appSettings.localCurrency})不同。这是exchangerate-api.com免费版的限制，汇率将通过USD进行换算。`);
                }

                console.log("成功获取并缓存新的汇率数据:", exchangeRatesCache);
                console.log(`API调用计数：${appSettings.apiCallCount}，刷新频率：${getRefreshFrequency()}小时`);
                return exchangeRatesCache.rates;
            } else {
                // API返回错误
                console.error("API返回错误:", data['error-type']);
                alert(`获取汇率API返回错误: ${data['error-type']}`);
                return null;
            }
        } catch (error) {
            // 网络错误或其他异常
            console.error("获取汇率时发生网络错误:", error);
            alert("网络错误，无法获取汇率信息。请检查您的网络连接。");
            return null;
        }
    }

    function getConvertedPrice(originalPrice, originalCurrency, rates, targetCurrency) {
        if (!rates || typeof originalPrice !== 'number' || !originalCurrency || !targetCurrency) {
            console.warn("getConvertedPrice: Invalid input", {originalPrice, originalCurrency, rates, targetCurrency});
            return null;
        }

        const originalCurrencyUpperCase = originalCurrency.toUpperCase();
        const targetCurrencyUpperCase = targetCurrency.toUpperCase();

        // 如果原始货币和目标货币相同，直接返回原始价格
        if (originalCurrencyUpperCase === targetCurrencyUpperCase) {
            return originalPrice.toFixed(2);
        }

        // 检查汇率数据是否可用
        if (!rates[originalCurrencyUpperCase] || !rates[targetCurrencyUpperCase]) {
            console.warn(`找不到 ${originalCurrencyUpperCase} 或 ${targetCurrencyUpperCase} 的汇率数据`, rates);
            return null;
        }

        // 获取基准货币
        const baseCurrency = exchangeRatesCache.base;
        console.log(`汇率基准货币: ${baseCurrency}`);

        // 如果基准货币是目标货币（例如：基准是CNY，目标也是CNY）
        if (baseCurrency === targetCurrencyUpperCase) {
            // 直接使用原始货币对基准货币的汇率
            // 例如：基准是CNY，原始是USD，rates[USD] = 0.14（表示1CNY=0.14USD）
            // 那么1USD = 1/0.14 CNY = 7.14 CNY
            const rate = rates[originalCurrencyUpperCase];
            // 原始价格 / 汇率 = 目标货币价格
            // 例如：100USD * (1/0.14) = 714.29 CNY
            return (originalPrice / rate).toFixed(2);
        }

        // 如果基准货币是原始货币（例如：基准是USD，原始也是USD）
        if (baseCurrency === originalCurrencyUpperCase) {
            // 直接使用目标货币对基准货币的汇率
            // 例如：基准是USD，目标是CNY，rates[CNY] = 7.14（表示1USD=7.14CNY）
            const rate = rates[targetCurrencyUpperCase];
            // 原始价格 * 汇率 = 目标货币价格
            // 例如：100USD * 7.14 = 714 CNY
            return (originalPrice * rate).toFixed(2);
        }

        // 如果基准货币既不是原始货币也不是目标货币（例如：基准是EUR，原始是USD，目标是CNY）
        // 需要通过基准货币进行两步换算：原始货币 -> 基准货币 -> 目标货币

        // 1. 获取原始货币和目标货币相对于基准货币的汇率
        const rateOriginalToBase = rates[originalCurrencyUpperCase]; // 例如：1EUR = 1.1USD，则rateOriginalToBase = 1.1
        const rateTargetToBase = rates[targetCurrencyUpperCase];   // 例如：1EUR = 7.8CNY，则rateTargetToBase = 7.8

        // 2. 计算原始价格对应的基准货币金额
        // 例如：100USD / 1.1 = 90.91EUR
        const priceInBaseCurrency = originalPrice / rateOriginalToBase;

        // 3. 将基准货币金额转换为目标货币
        // 例如：90.91EUR * 7.8 = 709.09CNY
        const priceInTargetCurrency = priceInBaseCurrency * rateTargetToBase;

        // 4. 返回结果，保留两位小数
        return priceInTargetCurrency.toFixed(2);
    }

    // --- Data Functions ---
    function saveSubscriptions() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    }

    function loadSubscriptions() {
        const storedSubscriptions = localStorage.getItem(STORAGE_KEY);
        if (storedSubscriptions) {
            subscriptions = JSON.parse(storedSubscriptions);

            subscriptions = subscriptions.map(sub => {
                if (sub.startDate && sub.billingCycle !== 'one-time' && !sub.expiryDate) {
                    sub.expiryDate = calculateExpiryDate(sub.startDate, sub.billingCycle);
                }
                return sub;
            });

            // 为没有图标的订阅异步获取图标
            (async () => {
                let hasUpdates = false;

                for (const sub of subscriptions) {
                    if (!sub.serviceIcon) {
                        try {
                            const icon = await getServiceIcon(sub);
                            if (icon) {
                                sub.serviceIcon = icon;
                                hasUpdates = true;
                            }
                        } catch (error) {
                            console.error(`为订阅 ${sub.serviceName} 获取图标时出错:`, error);
                        }
                    }
                }

                if (hasUpdates) {
                    saveSubscriptions();
                    renderSubscriptions();
                }
            })();

            saveSubscriptions();
        }
    }

    // --- Rendering Functions ---
    function renderSubscriptions(category = 'all') {
        subscriptionListDiv.innerHTML = '';

        if (subscriptions.length === 0) {
            const placeholder = document.createElement('p');
            placeholder.textContent = '还没有添加任何订阅。';
            placeholder.style.fontStyle = 'italic';
            placeholder.style.color = '#777';
            subscriptionListDiv.appendChild(placeholder);

            notificationPanel.classList.add('hidden');
            return;
        }

        // 按分类筛选
        let filteredSubscriptions = subscriptions;
        if (category !== 'all') {
            filteredSubscriptions = filterSubscriptionsByCategory(category);

            if (filteredSubscriptions.length === 0) {
                const placeholder = document.createElement('p');
                placeholder.textContent = `没有找到分类为"${getCategoryName(category)}"的订阅。`;
                placeholder.style.fontStyle = 'italic';
                placeholder.style.color = '#777';
                subscriptionListDiv.appendChild(placeholder);
                return;
            }
        }

        const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
            if (!a.expiryDate && !b.expiryDate) return 0;
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;

            const daysA = getDaysUntilExpiry(a.expiryDate);
            const daysB = getDaysUntilExpiry(b.expiryDate);

            if (daysA < 0 && daysB >= 0) return -1;
            if (daysA >= 0 && daysB < 0) return 1;

            return daysA - daysB;
        });

        let overdueItems = [];
        let expiringSoonItems = [];

        fetchExchangeRates().then(rates => {
            if (sortedSubscriptions.length === 0 && subscriptionListDiv.querySelector('p')) {
            } else {
                subscriptionListDiv.innerHTML = '';
                if (sortedSubscriptions.length === 0) {
                    const placeholder = document.createElement('p');
                    placeholder.textContent = '还没有添加任何订阅。';
                    placeholder.style.fontStyle = 'italic';
                    placeholder.style.color = '#777';
                    subscriptionListDiv.appendChild(placeholder);
                    notificationPanel.classList.add('hidden');
                    return;
                }
            }

            sortedSubscriptions.forEach(sub => {
                const newItemDiv = document.createElement('div');
                newItemDiv.classList.add('subscription-item');
                newItemDiv.setAttribute('data-id', sub.id);
                newItemDiv.id = `subscription-${sub.id}`; // 添加ID属性，以便通知点击时能够定位

                const daysUntilExpiry = sub.expiryDate ? getDaysUntilExpiry(sub.expiryDate) : null;

                if (daysUntilExpiry !== null) {
                    if (daysUntilExpiry < 0) {
                        newItemDiv.classList.add('overdue');
                        overdueItems.push({
                            name: sub.serviceName,
                            days: Math.abs(daysUntilExpiry),
                            id: sub.id,
                            icon: sub.serviceIcon
                        });
                    } else if (daysUntilExpiry <= 7) {
                        newItemDiv.classList.add('expiring-soon');
                        expiringSoonItems.push({
                            name: sub.serviceName,
                            days: daysUntilExpiry,
                            id: sub.id,
                            icon: sub.serviceIcon
                        });
                    }
                }

                // 构建图标HTML
                let iconHtml = '';
                if (sub.serviceIcon) {
                    iconHtml = `<img src="${sub.serviceIcon}" alt="${sub.serviceName}" class="service-icon" />`;
                } else {
                    // 如果没有图标，使用首字母作为占位符
                    const firstLetter = sub.serviceName.charAt(0).toUpperCase();
                    iconHtml = `<div class="service-icon-placeholder">${firstLetter}</div>`;
                }

                let htmlContent = `
                <div class="subscription-header">
                    ${iconHtml}
                    <h3>${sub.serviceName}</h3>
                </div>`;

                const price = parseFloat(sub.price);
                const currency = sub.currency.toUpperCase();
                // 添加调试日志，跟踪汇率换算过程
                console.log(`Converting price: ${price} ${currency} to ${appSettings.localCurrency}`, rates);
                const localPrice = getConvertedPrice(price, currency, rates, appSettings.localCurrency);
                console.log(`Conversion result: ${price} ${currency} = ${localPrice} ${appSettings.localCurrency}`);

                const localPriceHTML = localPrice ? `<p><strong>价格:</strong> ${price} ${currency} <span class="local-price">(约 ${localPrice} ${appSettings.localCurrency})</span></p>` : `<p><strong>价格:</strong> ${price} ${currency}</p>`;

                htmlContent += localPriceHTML;

                htmlContent += `<p><strong>订阅周期:</strong> ${getBillingCycleText(sub.billingCycle)}</p>`;

                // 显示分类信息
                const categoryName = getCategoryName(sub.category || 'other');
                htmlContent += `<p><strong>分类:</strong> <span class="category-tag ${sub.category || 'other'}">${categoryName}</span></p>`;

                if (sub.startDate) {
                    htmlContent += `<p><strong>首次订阅日期:</strong> ${sub.startDate}</p>`;
                }

                if (sub.expiryDate) {
                    const expiryStatusLabel = getExpiryStatusLabel(daysUntilExpiry);
                    htmlContent += `<p><strong>到期日期:</strong> ${sub.expiryDate} ${expiryStatusLabel}</p>`;
                } else if (sub.billingCycle === 'one-time') {
                    htmlContent += `<p><strong>到期日期:</strong> 一次性购买，无到期日期</p>`;
                } else {
                    htmlContent += `<p><strong>到期日期:</strong> 未指定</p>`;
                }

                // 新增：显示支付账户信息
                if (sub.paymentAccount) {
                    htmlContent += `<p><strong>支付账户:</strong> ${sub.paymentAccount}</p>`;
                }

                // 新增：显示价格历史/说明信息
                if (sub.priceHistoryNotes) {
                    htmlContent += `<p><strong>价格历史/说明:</strong> ${sub.priceHistoryNotes}</p>`;
                }

                htmlContent += `
                    <div class="actions">
                        <button class="edit-btn">编辑</button>
                        <button class="delete-btn">删除</button>
                    </div>`;
                newItemDiv.innerHTML = htmlContent;
                subscriptionListDiv.appendChild(newItemDiv);
            });

            updateNotificationPanel(overdueItems, expiringSoonItems);
        });
    }

    function getBillingCycleText(cycleValue) {
        switch (cycleValue) {
            case 'monthly': return '每月';
            case 'annually': return '每年';
            case 'one-time': return '一次性';
            default: return cycleValue;
        }
    }

    // 更新提醒面板
    function updateNotificationPanel(overdueItems, expiringSoonItems) {
        if (overdueItems.length === 0 && expiringSoonItems.length === 0) {
            notificationPanel.classList.add('hidden');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (appSettings.notificationDismissed && appSettings.lastNotificationDate === today) {
            notificationPanel.classList.add('hidden');
            return;
        }

        appSettings.notificationDismissed = false;

        let notificationHtml = '';

        if (overdueItems.length > 0) {
            notificationHtml += '<div><strong>已过期订阅:</strong></div>';
            overdueItems.forEach(item => {
                // 构建图标HTML
                let iconHtml = '';
                if (item.icon) {
                    iconHtml = `<img src="${item.icon}" alt="${item.name}" class="notification-icon" />`;
                } else {
                    // 如果没有图标，使用首字母作为占位符
                    const firstLetter = item.name.charAt(0).toUpperCase();
                    iconHtml = `<div class="notification-icon-placeholder">${firstLetter}</div>`;
                }

                notificationHtml += `<div class="notification-item overdue">
                    ${iconHtml}
                    <div class="notification-text">
                        <strong>${item.name}</strong> - 已过期 ${item.days} 天
                    </div>
                </div>`;
            });
        }

        if (expiringSoonItems.length > 0) {
            notificationHtml += '<div><strong>即将到期订阅:</strong></div>';
            expiringSoonItems.forEach(item => {
                // 构建图标HTML
                let iconHtml = '';
                if (item.icon) {
                    iconHtml = `<img src="${item.icon}" alt="${item.name}" class="notification-icon" />`;
                } else {
                    // 如果没有图标，使用首字母作为占位符
                    const firstLetter = item.name.charAt(0).toUpperCase();
                    iconHtml = `<div class="notification-icon-placeholder">${firstLetter}</div>`;
                }

                const dayText = item.days === 0 ? '今天' : `${item.days} 天后`;
                notificationHtml += `<div class="notification-item expiring-soon">
                    ${iconHtml}
                    <div class="notification-text">
                        <strong>${item.name}</strong> - ${dayText}到期
                    </div>
                </div>`;
            });
        }

        notificationContent.innerHTML = notificationHtml;
        notificationPanel.classList.remove('hidden');
    }

    // --- Event Handlers ---
    subscriptionForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const serviceName = document.getElementById('service-name').value;
        const serviceUrl = document.getElementById('service-url').value.trim();
        const price = document.getElementById('price').value;
        const currency = document.getElementById('currency').value.trim().toUpperCase();
        const billingCycle = document.getElementById('billing-cycle').value;
        const category = document.getElementById('category').value;
        const startDate = document.getElementById('start-date').value;
        let expiryDate = document.getElementById('expiry-date').value;
        const notes = document.getElementById('notes').value.trim();
        const autoCalculate = document.getElementById('auto-calculate').checked;
        const paymentAccount = paymentAccountInput.value.trim(); // 新增：获取支付账户信息
        const priceHistoryNotes = priceHistoryNotesInput.value.trim(); // 新增：获取价格历史信息

        if (!serviceName || !price || !currency) {
            alert('请填写所有必填项（服务名称、价格、币种）。');
            return;
        }

        if (autoCalculate && billingCycle !== 'one-time' && startDate) {
            expiryDate = calculateExpiryDate(startDate, billingCycle);
        } else if (billingCycle === 'one-time') {
            expiryDate = '';
        }

        // 先保存订阅，然后异步获取图标
        let serviceIcon = null;

        if (editingId !== null) {
            const index = subscriptions.findIndex(sub => sub.id === editingId);
            if (index !== -1) {
                subscriptions[index] = {
                    ...subscriptions[index],
                    serviceName,
                    serviceUrl,
                    price,
                    currency,
                    billingCycle,
                    category,
                    startDate,
                    expiryDate,
                    notes,
                    autoCalculate,
                    serviceIcon,
                    paymentAccount, // 新增：保存支付账户
                    priceHistoryNotes // 新增：保存价格历史
                };
            }
            editingId = null;
            submitButton.textContent = '添加订阅';
        } else {
            const newSubscription = {
                id: Date.now(),
                serviceName,
                serviceUrl,
                price,
                currency,
                billingCycle,
                category,
                startDate,
                expiryDate,
                notes,
                autoCalculate,
                serviceIcon,
                paymentAccount, // 新增：保存支付账户
                priceHistoryNotes // 新增：保存价格历史
            };
            subscriptions.push(newSubscription);
        }

        saveSubscriptions();

        // 异步获取并更新图标
        (async () => {
            try {
                // 找到刚刚添加/编辑的订阅
                const subscription = subscriptions.find(sub =>
                    editingId === null ? sub.id === subscriptions[subscriptions.length - 1].id : sub.id === editingId
                );

                if (subscription) {
                    // 获取图标
                    const icon = await getServiceIcon(subscription);

                    // 更新订阅的图标
                    if (icon) {
                        subscription.serviceIcon = icon;
                        saveSubscriptions();
                        renderSubscriptions();
                        updateStatistics(); // 更新统计信息
                    }
                }
            } catch (error) {
                console.error("获取服务图标时出错:", error);
            }
        })();

        renderSubscriptions();
        updateStatistics(); // 更新统计信息
        subscriptionForm.reset();
        paymentAccountInput.value = ''; // 新增：重置支付账户输入框
        priceHistoryNotesInput.value = ''; // 新增：重置价格历史输入框
        autoCalculateCheck.checked = true;
    });

    subscriptionListDiv.addEventListener('click', function(event) {
        const target = event.target;
        const subscriptionItem = target.closest('.subscription-item');
        if (!subscriptionItem) return;

        const subscriptionId = Number(subscriptionItem.getAttribute('data-id'));

        if (target.classList.contains('delete-btn')) {
            deleteSubscription(subscriptionId);
        } else if (target.classList.contains('edit-btn')) {
            populateFormForEdit(subscriptionId);
        }
    });

    function deleteSubscription(id) {
        subscriptions = subscriptions.filter(sub => sub.id !== id);
        saveSubscriptions();
        renderSubscriptions();
        updateStatistics(); // 更新统计信息
        if (editingId === id) {
            editingId = null;
            submitButton.textContent = '添加订阅';
            subscriptionForm.reset();
            autoCalculateCheck.checked = true;
        }
    }

    function populateFormForEdit(id) {
        const sub = subscriptions.find(s => s.id === id);
        if (sub) {
            document.getElementById('service-name').value = sub.serviceName;
            document.getElementById('service-url').value = sub.serviceUrl || '';
            document.getElementById('price').value = sub.price;
            document.getElementById('currency').value = sub.currency;
            document.getElementById('billing-cycle').value = sub.billingCycle;
            document.getElementById('category').value = sub.category || 'other';
            document.getElementById('start-date').value = sub.startDate || '';
            document.getElementById('expiry-date').value = sub.expiryDate || '';
            document.getElementById('notes').value = sub.notes || '';
            document.getElementById('auto-calculate').checked = sub.autoCalculate !== undefined ? sub.autoCalculate : true;
            paymentAccountInput.value = sub.paymentAccount || ''; // 新增：填充支付账户信息
            priceHistoryNotesInput.value = sub.priceHistoryNotes || ''; // 新增：填充价格历史信息

            editingId = id;
            submitButton.textContent = '更新订阅';
            window.scrollTo(0, 0);
        }
    }

    // --- 服务图标相关函数 ---

    // 图标缓存
    const ICONS_CACHE_KEY = 'subscriptionServiceIcons';
    let iconsCache = {};

    // 加载图标缓存
    function loadIconsCache() {
        const storedIcons = localStorage.getItem(ICONS_CACHE_KEY);
        if (storedIcons) {
            iconsCache = JSON.parse(storedIcons);
            console.log("已加载图标缓存:", Object.keys(iconsCache).length, "个图标");
        }
    }

    // 保存图标缓存
    function saveIconsCache() {
        localStorage.setItem(ICONS_CACHE_KEY, JSON.stringify(iconsCache));
        console.log("已保存图标缓存:", Object.keys(iconsCache).length, "个图标");
    }

    // 从URL中提取域名
    function extractDomain(url) {
        if (!url) return null;

        try {
            // 尝试使用URL API解析URL
            const parsedUrl = new URL(url);
            return parsedUrl.hostname;
        } catch (error) {
            // 如果URL格式不正确，尝试简单的正则表达式提取
            const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im);
            return match ? match[1] : null;
        }
    }

    // 获取服务图标
    async function getServiceIcon(subscription) {
        // 如果没有服务名称，返回null
        if (!subscription.serviceName) {
            return null;
        }

        // 生成缓存键
        const cacheKey = subscription.serviceUrl || subscription.serviceName.toLowerCase();

        // 如果缓存中有图标，直接返回
        if (iconsCache[cacheKey]) {
            console.log(`使用缓存的图标: ${cacheKey}`);
            return iconsCache[cacheKey];
        }

        // 尝试从URL获取图标
        if (subscription.serviceUrl) {
            const domain = extractDomain(subscription.serviceUrl);
            if (domain) {
                try {
                    // 使用Google的favicon服务获取图标
                    const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

                    // 缓存图标URL
                    iconsCache[cacheKey] = iconUrl;
                    saveIconsCache();

                    console.log(`已获取并缓存图标: ${cacheKey} -> ${iconUrl}`);
                    return iconUrl;
                } catch (error) {
                    console.error(`获取图标失败: ${domain}`, error);
                }
            }
        }

        // 如果无法从URL获取图标，尝试使用服务名称
        try {
            // 使用服务名称搜索图标
            const serviceName = subscription.serviceName.toLowerCase();

            // 常见服务的图标映射
            const commonServices = {
                'netflix': 'https://www.google.com/s2/favicons?domain=netflix.com&sz=64',
                'spotify': 'https://www.google.com/s2/favicons?domain=spotify.com&sz=64',
                'amazon': 'https://www.google.com/s2/favicons?domain=amazon.com&sz=64',
                'amazon prime': 'https://www.google.com/s2/favicons?domain=amazon.com&sz=64',
                'disney': 'https://www.google.com/s2/favicons?domain=disney.com&sz=64',
                'disney+': 'https://www.google.com/s2/favicons?domain=disneyplus.com&sz=64',
                'hulu': 'https://www.google.com/s2/favicons?domain=hulu.com&sz=64',
                'youtube': 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
                'youtube premium': 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
                'apple': 'https://www.google.com/s2/favicons?domain=apple.com&sz=64',
                'apple music': 'https://www.google.com/s2/favicons?domain=music.apple.com&sz=64',
                'apple tv': 'https://www.google.com/s2/favicons?domain=tv.apple.com&sz=64',
                'icloud': 'https://www.google.com/s2/favicons?domain=icloud.com&sz=64',
                'google': 'https://www.google.com/s2/favicons?domain=google.com&sz=64',
                'google one': 'https://www.google.com/s2/favicons?domain=one.google.com&sz=64',
                'microsoft': 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=64',
                'office': 'https://www.google.com/s2/favicons?domain=office.com&sz=64',
                'office 365': 'https://www.google.com/s2/favicons?domain=office.com&sz=64',
                'xbox': 'https://www.google.com/s2/favicons?domain=xbox.com&sz=64',
                'playstation': 'https://www.google.com/s2/favicons?domain=playstation.com&sz=64',
                'nintendo': 'https://www.google.com/s2/favicons?domain=nintendo.com&sz=64',
                'steam': 'https://www.google.com/s2/favicons?domain=steampowered.com&sz=64',
                'epic games': 'https://www.google.com/s2/favicons?domain=epicgames.com&sz=64',
                'dropbox': 'https://www.google.com/s2/favicons?domain=dropbox.com&sz=64',
                'github': 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
                'adobe': 'https://www.google.com/s2/favicons?domain=adobe.com&sz=64',
                'photoshop': 'https://www.google.com/s2/favicons?domain=adobe.com&sz=64',
                'lightroom': 'https://www.google.com/s2/favicons?domain=adobe.com&sz=64',
                'creative cloud': 'https://www.google.com/s2/favicons?domain=adobe.com&sz=64'
            };

            // 检查服务名称是否匹配常见服务
            for (const [key, value] of Object.entries(commonServices)) {
                if (serviceName.includes(key)) {
                    iconsCache[cacheKey] = value;
                    saveIconsCache();
                    console.log(`已匹配常见服务图标: ${serviceName} -> ${value}`);
                    return value;
                }
            }

            // 如果没有匹配到常见服务，尝试使用服务名称的第一个字母作为图标
            const firstLetter = subscription.serviceName.charAt(0).toUpperCase();
            const letterIconUrl = `https://ui-avatars.com/api/?name=${firstLetter}&background=random&color=fff&size=64`;

            iconsCache[cacheKey] = letterIconUrl;
            saveIconsCache();

            console.log(`使用字母图标: ${serviceName} -> ${letterIconUrl}`);
            return letterIconUrl;

        } catch (error) {
            console.error(`获取图标失败: ${subscription.serviceName}`, error);
            return null;
        }
    }

    // 通知设置相关事件处理
    enableNotificationsCheckbox.addEventListener('change', toggleNotificationSettings);

    // 测试通知按钮
    testNotificationButton.addEventListener('click', function() {
        if (Notification.permission !== 'granted') {
            requestNotificationPermission().then(granted => {
                if (granted) {
                    sendTestNotification();
                }
            });
        } else {
            sendTestNotification();
        }
    });

    // --- 数据导入/导出功能 ---

    // 导出为JSON
    exportJsonButton.addEventListener('click', function() {
        exportData('json');
    });

    // 导出为CSV
    exportCsvButton.addEventListener('click', function() {
        exportData('csv');
    });

    // 导出数据
    function exportData(format) {
        if (subscriptions.length === 0) {
            alert('没有可导出的订阅数据。');
            return;
        }

        let dataStr, fileName, mimeType;

        if (format === 'json') {
            // 准备JSON数据
            const exportData = {
                subscriptions: subscriptions,
                exportDate: new Date().toISOString(),
                appVersion: '1.0.0'
            };

            dataStr = JSON.stringify(exportData, null, 2);
            fileName = `subscription_data_${formatDateForFileName(new Date())}.json`;
            mimeType = 'application/json';
        } else if (format === 'csv') {
            // 准备CSV数据
            const headers = ['服务名称', '服务网址', '价格', '币种', '订阅周期', '分类', '首次订阅日期', '到期日期', '备注'];
            const rows = subscriptions.map(sub => [
                sub.serviceName,
                sub.serviceUrl || '',
                sub.price,
                sub.currency,
                getBillingCycleText(sub.billingCycle),
                getCategoryName(sub.category || 'other'),
                sub.startDate || '',
                sub.expiryDate || '',
                sub.notes || ''
            ]);

            // 添加BOM以确保Excel正确识别UTF-8编码
            dataStr = '\uFEFF' + [
                headers.join(','),
                ...rows.map(row => row.map(cell => {
                    // 处理包含逗号、引号或换行符的单元格
                    if (cell && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }).join(','))
            ].join('\n');

            fileName = `subscription_data_${formatDateForFileName(new Date())}.csv`;
            mimeType = 'text/csv;charset=utf-8';
        } else {
            console.error('不支持的导出格式:', format);
            return;
        }

        // 创建下载链接
        const blob = new Blob([dataStr], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // 格式化日期为文件名
    function formatDateForFileName(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // 文件选择事件处理
    importFileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            selectedFileNameSpan.textContent = file.name;
            importButton.disabled = false;

            // 根据文件类型设置导入按钮文本
            if (file.name.endsWith('.json')) {
                importButton.textContent = '导入JSON数据';
            } else if (file.name.endsWith('.csv')) {
                importButton.textContent = '导入CSV数据';
            } else {
                importButton.textContent = '导入数据';
                importButton.disabled = true;
                importStatusDiv.textContent = '不支持的文件格式。请选择.json或.csv文件。';
                importStatusDiv.className = 'import-status error';
            }
        } else {
            selectedFileNameSpan.textContent = '未选择文件';
            importButton.disabled = true;
            importStatusDiv.textContent = '';
            importStatusDiv.className = 'import-status';
        }
    });

    // 导入按钮点击事件
    importButton.addEventListener('click', function() {
        const file = importFileInput.files[0];
        if (!file) {
            importStatusDiv.textContent = '请先选择文件。';
            importStatusDiv.className = 'import-status error';
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const fileContent = e.target.result;

                if (file.name.endsWith('.json')) {
                    importJsonData(fileContent);
                } else if (file.name.endsWith('.csv')) {
                    importCsvData(fileContent);
                } else {
                    throw new Error('不支持的文件格式');
                }

                // 重置文件选择
                importFileInput.value = '';
                selectedFileNameSpan.textContent = '未选择文件';
                importButton.disabled = true;

            } catch (error) {
                console.error('导入数据时出错:', error);
                importStatusDiv.textContent = `导入失败: ${error.message}`;
                importStatusDiv.className = 'import-status error';
            }
        };

        reader.onerror = function() {
            importStatusDiv.textContent = '读取文件时出错。';
            importStatusDiv.className = 'import-status error';
        };

        if (file.name.endsWith('.json')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        }
    });

    // 导入JSON数据
    function importJsonData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.subscriptions || !Array.isArray(data.subscriptions)) {
                throw new Error('无效的JSON格式：缺少订阅数据数组');
            }

            // 验证导入的数据
            const validSubscriptions = data.subscriptions.filter(sub => {
                return sub && typeof sub === 'object' && sub.serviceName && sub.price && sub.currency;
            });

            if (validSubscriptions.length === 0) {
                throw new Error('没有找到有效的订阅数据');
            }

            // 替换或合并数据
            if (importReplaceCheckbox.checked) {
                subscriptions = validSubscriptions;
                importStatusDiv.textContent = `成功导入 ${validSubscriptions.length} 条订阅数据（替换模式）。`;
            } else {
                // 合并数据，避免重复
                const existingIds = new Set(subscriptions.map(sub => sub.id));
                let newCount = 0;

                validSubscriptions.forEach(sub => {
                    // 为导入的订阅生成新ID，避免冲突
                    if (!sub.id || existingIds.has(sub.id)) {
                        sub.id = Date.now() + Math.floor(Math.random() * 1000) + newCount;
                        newCount++;
                    }
                    subscriptions.push(sub);
                });

                importStatusDiv.textContent = `成功导入 ${validSubscriptions.length} 条订阅数据（合并模式）。`;
            }

            importStatusDiv.className = 'import-status success';
            saveSubscriptions();
            renderSubscriptions();
            updateStatistics(); // 更新统计信息

        } catch (error) {
            console.error('解析JSON数据时出错:', error);
            throw new Error(`解析JSON数据时出错: ${error.message}`);
        }
    }

    // 导入CSV数据
    function importCsvData(csvString) {
        try {
            // 移除BOM标记
            if (csvString.charCodeAt(0) === 0xFEFF) {
                csvString = csvString.slice(1);
            }

            // 解析CSV
            const lines = csvString.split('\n');
            if (lines.length < 2) {
                throw new Error('CSV文件格式无效或为空');
            }

            const headers = parseCSVLine(lines[0]);

            // 检查标题行是否包含必要的字段
            if (!headers.includes('服务名称') || !headers.includes('价格') || !headers.includes('币种')) {
                throw new Error('CSV文件缺少必要的列（服务名称、价格、币种）');
            }

            const importedSubscriptions = [];

            // 解析数据行
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // 跳过空行

                const values = parseCSVLine(line);
                if (values.length !== headers.length) {
                    console.warn(`第 ${i+1} 行的列数与标题行不匹配，已跳过`);
                    continue;
                }

                // 创建订阅对象
                const subscription = {};

                // 映射CSV列到订阅属性
                headers.forEach((header, index) => {
                    const value = values[index];

                    switch (header) {
                        case '服务名称':
                            subscription.serviceName = value;
                            break;
                        case '服务网址':
                            subscription.serviceUrl = value;
                            break;
                        case '价格':
                            subscription.price = parseFloat(value) || 0;
                            break;
                        case '币种':
                            subscription.currency = value;
                            break;
                        case '订阅周期':
                            // 将中文周期转换回英文值
                            if (value === '每月') subscription.billingCycle = 'monthly';
                            else if (value === '每年') subscription.billingCycle = 'annually';
                            else if (value === '一次性') subscription.billingCycle = 'one-time';
                            else subscription.billingCycle = value;
                            break;
                        case '分类':
                            // 将中文分类转换回英文值
                            if (value === '娱乐') subscription.category = 'entertainment';
                            else if (value === '工作') subscription.category = 'work';
                            else if (value === '教育') subscription.category = 'education';
                            else if (value === '生活方式') subscription.category = 'lifestyle';
                            else if (value === '实用工具') subscription.category = 'utility';
                            else if (value === '其他') subscription.category = 'other';
                            else subscription.category = 'other';
                            break;
                        case '首次订阅日期':
                            subscription.startDate = value;
                            break;
                        case '到期日期':
                            subscription.expiryDate = value;
                            break;
                        case '备注':
                            subscription.notes = value;
                            break;
                    }
                });

                // 验证必要字段
                if (subscription.serviceName && subscription.price && subscription.currency) {
                    // 设置默认值
                    subscription.id = Date.now() + Math.floor(Math.random() * 1000) + i;
                    subscription.autoCalculate = true;
                    importedSubscriptions.push(subscription);
                }
            }

            if (importedSubscriptions.length === 0) {
                throw new Error('没有找到有效的订阅数据');
            }

            // 替换或合并数据
            if (importReplaceCheckbox.checked) {
                subscriptions = importedSubscriptions;
                importStatusDiv.textContent = `成功导入 ${importedSubscriptions.length} 条订阅数据（替换模式）。`;
            } else {
                // 合并数据
                subscriptions = subscriptions.concat(importedSubscriptions);
                importStatusDiv.textContent = `成功导入 ${importedSubscriptions.length} 条订阅数据（合并模式）。`;
            }

            importStatusDiv.className = 'import-status success';
            saveSubscriptions();
            renderSubscriptions();
            updateStatistics(); // 更新统计信息

        } catch (error) {
            console.error('解析CSV数据时出错:', error);
            throw new Error(`解析CSV数据时出错: ${error.message}`);
        }
    }

    // 解析CSV行，处理引号和逗号
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    // 处理双引号转义 ("" -> ")
                    current += '"';
                    i++; // 跳过下一个引号
                } else {
                    // 切换引号状态
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 遇到逗号且不在引号内，添加当前值并重置
                result.push(current);
                current = '';
            } else {
                // 普通字符，添加到当前值
                current += char;
            }
        }

        // 添加最后一个值
        result.push(current);

        return result;
    }

    // 发送测试通知
    function sendTestNotification() {
        sendNotification(
            '测试通知',
            {
                body: '这是一条测试通知，用于验证浏览器通知功能是否正常工作。',
                requireInteraction: true,
                onClick: () => {
                    alert('通知点击测试成功！');
                }
            }
        );
    }

    // 定期检查订阅到期情况
    function setupNotificationChecker() {
        // 页面加载时检查一次
        if (appSettings.enableNotifications && Notification.permission === 'granted') {
            checkSubscriptionsAndNotify();
        }

        // 设置定时检查（每天检查一次）
        setInterval(() => {
            if (appSettings.enableNotifications && Notification.permission === 'granted') {
                const now = new Date();
                const lastCheck = appSettings.lastNotificationCheck
                    ? new Date(appSettings.lastNotificationCheck)
                    : null;

                // 如果从未检查过，或者上次检查是在昨天或更早，则再次检查
                if (!lastCheck ||
                    now.getDate() !== lastCheck.getDate() ||
                    now.getMonth() !== lastCheck.getMonth() ||
                    now.getFullYear() !== lastCheck.getFullYear()) {

                    checkSubscriptionsAndNotify();
                }
            }
        }, 60 * 60 * 1000); // 每小时检查一次是否需要发送通知
    }

    // --- 分类和统计功能 ---

    // 获取分类的中文名称
    function getCategoryName(categoryValue) {
        const categoryMap = {
            'entertainment': '娱乐',
            'work': '工作',
            'education': '教育',
            'lifestyle': '生活方式',
            'utility': '实用工具',
            'other': '其他'
        };
        return categoryMap[categoryValue] || '其他';
    }

    // 按分类筛选订阅
    function filterSubscriptionsByCategory(category) {
        if (category === 'all') {
            return subscriptions;
        }
        return subscriptions.filter(sub => sub.category === category);
    }

    // 计算订阅的月度费用
    function calculateMonthlyPrice(subscription, rates) {
        const price = parseFloat(subscription.price);
        if (isNaN(price)) return 0;

        let monthlyPrice = 0;

        if (subscription.billingCycle === 'monthly') {
            monthlyPrice = price;
        } else if (subscription.billingCycle === 'annually') {
            monthlyPrice = price / 12;
        } else if (subscription.billingCycle === 'one-time') {
            // 一次性订阅不计入月度费用
            return 0;
        }

        // 转换为本地货币
        if (subscription.currency !== appSettings.localCurrency && rates) {
            const convertedPrice = getConvertedPrice(monthlyPrice, subscription.currency, rates, appSettings.localCurrency);
            return convertedPrice ? parseFloat(convertedPrice) : monthlyPrice;
        }

        return monthlyPrice;
    }

    // 计算订阅的年度费用
    function calculateAnnualPrice(subscription, rates) {
        const price = parseFloat(subscription.price);
        if (isNaN(price)) return 0;

        let annualPrice = 0;

        if (subscription.billingCycle === 'monthly') {
            annualPrice = price * 12;
        } else if (subscription.billingCycle === 'annually') {
            annualPrice = price;
        } else if (subscription.billingCycle === 'one-time') {
            // 一次性订阅不计入年度费用
            return 0;
        }

        // 转换为本地货币
        if (subscription.currency !== appSettings.localCurrency && rates) {
            const convertedPrice = getConvertedPrice(annualPrice, subscription.currency, rates, appSettings.localCurrency);
            return convertedPrice ? parseFloat(convertedPrice) : annualPrice;
        }

        return annualPrice;
    }

    // 更新统计数据
    function updateStatistics() {
        fetchExchangeRates().then(rates => {
            // 总订阅数
            totalSubscriptionsElement.textContent = subscriptions.length;

            // 计算月度和年度总支出
            let monthlyTotal = 0;
            let annualTotal = 0;

            subscriptions.forEach(sub => {
                monthlyTotal += calculateMonthlyPrice(sub, rates);
                annualTotal += calculateAnnualPrice(sub, rates);
            });

            // 更新显示
            monthlyTotalElement.textContent = `${appSettings.localCurrency} ${monthlyTotal.toFixed(2)}`;
            annualTotalElement.textContent = `${appSettings.localCurrency} ${annualTotal.toFixed(2)}`;

            // 更新图表
            updateCategoryChart(rates);
            const selectedTimeRange = trendTimeRangeSelect ? trendTimeRangeSelect.value : '12m'; // 获取当前选定时间范围
            updateTrendChart(rates, selectedTimeRange); // 传递时间范围
        });
    }

    // 更新分类图表
    function updateCategoryChart(rates) {
        // 按分类统计费用
        const categoryData = {};
        const categoryColors = {
            'entertainment': 'rgba(231, 76, 60, 0.7)',
            'work': 'rgba(52, 152, 219, 0.7)',
            'education': 'rgba(155, 89, 182, 0.7)',
            'lifestyle': 'rgba(46, 204, 113, 0.7)',
            'utility': 'rgba(241, 196, 15, 0.7)',
            'other': 'rgba(149, 165, 166, 0.7)'
        };

        subscriptions.forEach(sub => {
            const category = sub.category || 'other';
            const monthlyPrice = calculateMonthlyPrice(sub, rates);

            if (!categoryData[category]) {
                categoryData[category] = 0;
            }

            categoryData[category] += monthlyPrice;
        });

        // 准备图表数据
        const labels = [];
        const data = [];
        const backgroundColor = [];

        for (const [category, amount] of Object.entries(categoryData)) {
            labels.push(getCategoryName(category));
            data.push(amount.toFixed(2));
            backgroundColor.push(categoryColors[category] || 'rgba(149, 165, 166, 0.7)');
        }

        // 创建或更新图表
        if (window.categoryChart) {
            window.categoryChart.data.labels = labels;
            window.categoryChart.data.datasets[0].data = data;
            window.categoryChart.data.datasets[0].backgroundColor = backgroundColor;
            window.categoryChart.update();
        } else {
            window.categoryChart = new Chart(categoryChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColor,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.chart.data.datasets[0].data.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
                                    const percentage = Math.round((value * 100) / total);
                                    return `${label}: ${appSettings.localCurrency} ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // 更新趋势图表
    function updateTrendChart(rates, timeRange = '12m') { // 添加 timeRange 参数，默认为 '12m'
        const data = calculateTrendData(rates, timeRange);

        if (!data) {
            console.warn("无法为趋势图表计算数据，可能原因：无订阅或汇率问题。");
            // 可以选择清空图表或显示提示信息
            if (window.trendChart) {
                window.trendChart.data.labels = [];
                window.trendChart.data.datasets[0].data = [];
                window.trendChart.update();
            }
            return;
        }

        const { labels, dataPoints } = data;

        // 创建或更新图表
        if (window.trendChart) {
            window.trendChart.data.labels = labels;
            window.trendChart.data.datasets[0].data = dataPoints;
            window.trendChart.options.scales.x.title.text = getTimeRangeLabel(timeRange); // 更新X轴标题
            window.trendChart.update();
        } else {
            window.trendChart = new Chart(trendChartCanvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '月度支出',
                        data: dataPoints,
                        borderColor: 'rgba(52, 152, 219, 1)',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: `支出 (${appSettings.localCurrency})`
                            },
                            ticks: {
                                callback: function(value) {
                                    return `${appSettings.localCurrency} ${value.toFixed(0)}`;
                                }
                            }
                        },
                        x: { // X轴配置
                            title: {
                                display: true,
                                text: getTimeRangeLabel(timeRange) // 初始X轴标题
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: function(tooltipItems) {
                                    // 自定义tooltip的标题，显示完整的月份和年份
                                    return tooltipItems[0].label;
                                },
                                label: function(context) {
                                    return `${context.dataset.label}: ${appSettings.localCurrency} ${context.raw.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // 为趋势图表计算数据的辅助函数
    function calculateTrendData(rates, timeRange) {
        if (subscriptions.length === 0) return null;

        const now = new Date();
        let startDate = new Date();
        let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // 当前月的最后一天

        const labels = [];
        const dataPoints = [];

        switch (timeRange) {
            case '6m':
                startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // 过去6个月的开始
                break;
            case '12m':
                startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 过去12个月的开始
                break;
            case 'ytd': // 今年以来
                startDate = new Date(now.getFullYear(), 0, 1); // 今年1月1日
                break;
            case 'last_year':
                startDate = new Date(now.getFullYear() - 1, 0, 1); // 去年1月1日
                endDate = new Date(now.getFullYear() - 1, 11, 31); // 去年12月31日
                break;
            case 'all':
                // 找到所有订阅中最早的开始日期
                if (subscriptions.length > 0) {
                    const earliestSubscriptionDate = subscriptions.reduce((earliest, sub) => {
                        if (sub.startDate) {
                            const subDate = new Date(sub.startDate);
                            return subDate < earliest ? subDate : earliest;
                        }
                        return earliest;
                    }, new Date()); // 初始值为当前日期
                    startDate = new Date(earliestSubscriptionDate.getFullYear(), earliestSubscriptionDate.getMonth(), 1);
                } else {
                    startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 如果没有订阅，默认过去12个月
                }
                break;
            default: // 默认为12m
                startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        }

        // 迭代月份
        let currentMonthIter = new Date(startDate);
        while (currentMonthIter <= endDate) {
            const year = currentMonthIter.getFullYear();
            const month = currentMonthIter.getMonth();
            const monthName = currentMonthIter.toLocaleString('zh-CN', { month: 'short', year: 'numeric' });
            labels.push(monthName);

            let monthlyTotal = 0;
            subscriptions.forEach(sub => {
                if (!sub.startDate) return;

                const subStartDate = new Date(sub.startDate);
                const price = calculateMonthlyPrice(sub, rates); // 使用已有的月度价格计算函数

                // 检查订阅在该月是否有效
                // 订阅开始于该月或之前
                const isStarted = subStartDate <= new Date(year, month + 1, 0); // 月末

                // 订阅结束于该月或之后 (或无结束日期)
                let isNotEnded = true;
                if (sub.expiryDate) {
                    const subExpiryDate = new Date(sub.expiryDate);
                    isNotEnded = subExpiryDate >= new Date(year, month, 1); // 月初
                }
                
                // 如果是一次性订阅，则仅在其开始的那个月计算
                if (sub.billingCycle === 'one-time') {
                    if (subStartDate.getFullYear() === year && subStartDate.getMonth() === month) {
                         // 一次性付款需要转换为等效的"月度"价格进行比较，这里我们直接使用其原始价格
                        const oneTimePrice = parseFloat(sub.price);
                        const convertedOneTimePrice = (sub.currency !== appSettings.localCurrency && rates)
                            ? getConvertedPrice(oneTimePrice, sub.currency, rates, appSettings.localCurrency)
                            : oneTimePrice;
                        monthlyTotal += convertedOneTimePrice ? parseFloat(convertedOneTimePrice) : 0;
                    }
                } else if (isStarted && isNotEnded) {
                    monthlyTotal += price;
                }
            });
            dataPoints.push(parseFloat(monthlyTotal.toFixed(2)));

            // 移动到下一个月
            currentMonthIter.setMonth(currentMonthIter.getMonth() + 1);
            // 如果是去年，并且已经到了12月，则停止
            if (timeRange === 'last_year' && month === 11) break;
        }
        return { labels, dataPoints };
    }

    // 获取时间范围选择器的标签文本
    function getTimeRangeLabel(timeRange) {
        switch (timeRange) {
            case '6m': return '过去 6 个月';
            case '12m': return '过去 12 个月';
            case 'ytd': return '今年以来';
            case 'last_year': return '去年';
            case 'all': return '所有时间';
            default: return '月度支出趋势';
        }
    }

    // 分类筛选事件处理
    categoryFilterSelect.addEventListener('change', function() {
        const selectedCategory = this.value;
        renderSubscriptions(selectedCategory);
    });

    // 新增：趋势图表时间范围选择器事件处理
    if (trendTimeRangeSelect) {
        trendTimeRangeSelect.addEventListener('change', function() {
            // 当时间范围改变时，仅需要更新趋势图表
            fetchExchangeRates().then(rates => {
                updateTrendChart(rates, this.value);
            });
        });
    }

    // --- 预设服务功能 ---
    function renderPresetServices(searchTerm = '') {
        console.log("渲染预设服务列表，搜索词: " + searchTerm);

        if (!presetServiceListDiv) {
            console.error("预设服务列表容器元素不存在");
            return;
        }

        presetServiceListDiv.innerHTML = ''; // 清空现有列表
        const lowerSearchTerm = searchTerm ? searchTerm.toLowerCase() : '';

        // 确保presetServices存在
        if (!presetServices || !Array.isArray(presetServices) || presetServices.length === 0) {
            console.error("预设服务数据不存在或为空");
            presetServiceListDiv.innerHTML = '<p class="no-results">预设服务数据不可用。</p>';
            return;
        }

        const filteredServices = presetServices.filter(service =>
            service.name.toLowerCase().includes(lowerSearchTerm)
        );

        console.log("过滤后的服务数量: " + filteredServices.length);

        if (filteredServices.length === 0) {
            presetServiceListDiv.innerHTML = '<p class="no-results">未找到匹配的服务。</p>';
            return;
        }

        filteredServices.forEach(service => {
            const item = document.createElement('div');
            item.classList.add('preset-service-item');
            item.setAttribute('data-id', service.id);

            let iconHtml = '';
            if (service.defaultIconUrl) {
                iconHtml = `<img src="${service.defaultIconUrl}" alt="${service.name}">`;
            } else {
                // 简单占位符（可以用服务名称首字母，但这里为了简化先只用通用图标）
                iconHtml = `<img src="icons/icon-72x72.png" alt="${service.name}">`; // 使用一个已有的图标作为占位
            }

            item.innerHTML = `
                ${iconHtml}
                <span class="item-name">${service.name}</span>
                <span class="item-category">${getCategoryName(service.category)}</span>
            `;

            // 使用function关键字定义回调函数，而不是箭头函数
            item.addEventListener('click', function() {
                console.log("点击了预设服务: " + service.name);
                fillFormWithPreset(service);
                if (presetServiceModal) {
                    presetServiceModal.classList.add('hidden');
                }
            });

            presetServiceListDiv.appendChild(item);
        });

        console.log("预设服务列表渲染完成");
    }

    function fillFormWithPreset(service) {
        console.log("填充表单，服务: ", service);

        try {
            // 获取表单元素
            const serviceNameInput = document.getElementById('service-name');
            const serviceUrlInput = document.getElementById('service-url');
            const categorySelect = document.getElementById('category');
            const priceInput = document.getElementById('price');
            const currencyInput = document.getElementById('currency');
            const startDateInput = document.getElementById('start-date');
            const expiryDateInput = document.getElementById('expiry-date');
            const notesInput = document.getElementById('notes');

            // 检查元素是否存在
            if (!serviceNameInput || !serviceUrlInput || !categorySelect ||
                !priceInput || !currencyInput || !startDateInput ||
                !expiryDateInput || !notesInput) {
                console.error("表单元素不存在");
                return;
            }

            // 填充服务名称和URL
            serviceNameInput.value = service.name || '';
            serviceUrlInput.value = service.defaultUrl || '';

            // 填充分类
            if (service.category) {
                categorySelect.value = service.category;
            }

            // 清空价格、币种、日期等字段，让用户自行填写
            priceInput.value = '';
            currencyInput.value = '';
            startDateInput.value = '';
            expiryDateInput.value = '';
            notesInput.value = '';

            console.log("表单填充完成");
        } catch (error) {
            console.error("填充表单时出错:", error);
        }
    }

    // 确保预设服务模态框相关元素存在并绑定事件
    if (showPresetModalBtn) {
        console.log("绑定'库'按钮点击事件");
        showPresetModalBtn.addEventListener('click', function() {
            console.log("点击了'库'按钮");
            if (presetServiceModal) {
                // 使用多种方式确保模态框显示
                presetServiceModal.classList.remove('hidden');
                presetServiceModal.style.display = 'flex';
                console.log("模态框显示状态:",
                    "classList包含hidden:", presetServiceModal.classList.contains('hidden'),
                    "style.display:", presetServiceModal.style.display);

                if (searchPresetServiceInput) {
                    searchPresetServiceInput.value = ''; // 清空搜索框
                }

                // 先渲染预设服务列表，再显示模态框
                renderPresetServices(); // 渲染完整列表

                // 使用setTimeout确保DOM更新后再聚焦搜索框
                setTimeout(function() {
                    if (searchPresetServiceInput) {
                        searchPresetServiceInput.style.display = 'block';
                        searchPresetServiceInput.focus();
                        console.log("搜索框聚焦，显示状态:", searchPresetServiceInput.style.display);
                    }
                }, 100);
            } else {
                console.error("预设服务模态框元素不存在");
            }
        });
    } else {
        console.error("'库'按钮元素不存在");
    }

    if (closePresetModalBtn) {
        console.log("绑定关闭按钮点击事件");
        closePresetModalBtn.addEventListener('click', function() {
            console.log("点击了关闭按钮");
            if (presetServiceModal) {
                // 使用多种方式确保模态框隐藏
                presetServiceModal.classList.add('hidden');
                presetServiceModal.style.display = 'none';
                console.log("模态框隐藏状态:",
                    "classList包含hidden:", presetServiceModal.classList.contains('hidden'),
                    "style.display:", presetServiceModal.style.display);
            }
        });
    } else {
        console.error("关闭按钮元素不存在");
    }

    if (presetServiceModal) {
        console.log("绑定模态框背景点击事件");
        presetServiceModal.addEventListener('click', function(event) {
            // 如果点击的是模态框背景（而不是内容区域），则关闭模态框
            if (event.target === presetServiceModal) {
                console.log("点击了模态框背景");
                // 使用多种方式确保模态框隐藏
                presetServiceModal.classList.add('hidden');
                presetServiceModal.style.display = 'none';
                console.log("模态框隐藏状态:",
                    "classList包含hidden:", presetServiceModal.classList.contains('hidden'),
                    "style.display:", presetServiceModal.style.display);
            }
        });
    } else {
        console.error("预设服务模态框元素不存在");
    }

    if (searchPresetServiceInput) {
        console.log("绑定搜索框输入事件");
        searchPresetServiceInput.addEventListener('input', function(event) {
            console.log("搜索框输入: " + event.target.value);
            renderPresetServices(event.target.value);
        });

        // 确保搜索框可见
        searchPresetServiceInput.style.display = 'block';
        searchPresetServiceInput.style.visibility = 'visible';
        searchPresetServiceInput.style.opacity = '1';
    } else {
        console.error("搜索框元素不存在");
    }

    // 初始化时设置模态框和搜索框的样式
    if (presetServiceModal) {
        // 确保模态框初始状态正确
        if (presetServiceModal.classList.contains('hidden')) {
            presetServiceModal.style.display = 'none';
        } else {
            presetServiceModal.style.display = 'flex';
        }
    }

    // --- Initialization ---
    loadSettings();
    loadExchangeRatesCache();
    loadIconsCache();
    loadSubscriptions();
    renderSubscriptions(); // 初始渲染订阅列表
    setupNotificationChecker();
    updateStatistics(); // 初始计算并显示统计数据

    // --- 主题切换功能 ---
    function applyTheme(themeName) {
        document.body.dataset.theme = themeName;
        console.log(`应用主题: ${themeName}`);
    }

    themeSelect.addEventListener('change', function() {
        const selectedTheme = this.value;
        applyTheme(selectedTheme);
        appSettings.theme = selectedTheme;
        // 注意：这里不直接调用saveSettings()，因为用户可能还在修改其他设置
        // 主题的持久化将在点击"保存设置"按钮时统一处理，或者如果希望立即保存，可以单独保存主题设置
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings)); // 立即保存主题，以便下次加载时生效
        console.log(`主题已更改为: ${selectedTheme} 并已保存`);
    });
});