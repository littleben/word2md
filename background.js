chrome.tabs.onCreated.addListener(async (newTab) => {
  // 检查新标签页是否有 ID，这是移动所必需的
  if (newTab.id === undefined) {
    console.error("New tab created without an ID.");
    return;
  }

  // 从存储中获取用户设置的位置偏好
  // 在文件顶部添加
  // 添加 service worker 激活监听
  chrome.runtime.onInstalled.addListener(() => {
    chrome.action.enable();  // 确保扩展图标可用
    chrome.action.setIcon({
      path: {
        16: "images/icon16.png",
        32: "images/icon32.png",
        48: "images/icon48.png",
        128: "images/icon128.png"
      }
    });
    // 添加点击事件监听
    chrome.action.onClicked.addListener((tab) => {
      // 打开选项页面
      chrome.runtime.openOptionsPage();
    });
  });
  
  // 原有的事件监听保持不变...
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'changeLanguage') {
      chrome.storage.sync.set({ language: request.language }, () => {
        sendResponse({ success: true });
      });
      return true;
    }
  });
  
  // 在chrome.tabs.onCreated监听器顶部添加
  const items = await chrome.storage.sync.get({
    position: 'right', // <-- 修改这里：将 newTabPosition 修改为 position
    language: 'en'  // 添加默认语言
  });
  const positionSetting = items.position; // <-- 修改这里：使用 items.position

  // 如果设置为 'end' (浏览器默认)，则无需执行任何操作
  if (positionSetting === 'end') {
    return;
  }

  let sourceTab = null;

  // 优先尝试使用 openerTabId 查找源标签页
  if (newTab.openerTabId) {
    try {
      sourceTab = await chrome.tabs.get(newTab.openerTabId);
      // 确保 openerTab 仍然在同一个窗口
      if (sourceTab && sourceTab.windowId !== newTab.windowId) {
        sourceTab = null; // 如果不在同一个窗口，则忽略 openerTabId
      }
    } catch (error) {
      // 如果获取 openerTab 失败（例如它已被关闭），则忽略错误并继续
      console.log(`Could not get opener tab ${newTab.openerTabId}, likely closed.`);
      sourceTab = null;
    }
  }

  // 如果没有有效的 openerTab，则回退到查找当前窗口的活动标签页
  if (!sourceTab) {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      windowId: newTab.windowId
    });
    sourceTab = activeTab;
  }

  // 检查是否找到了有效的源标签页
  if (sourceTab) {
    let targetIndex = -1; // 默认值 -1 表示移动到末尾

    // 根据设置计算目标索引
    switch (positionSetting) {
      case 'right':
        targetIndex = sourceTab.index + 1;
        break;
      case 'left':
        targetIndex = sourceTab.index;
        break;
      case 'start':
        targetIndex = 0;
        break;
      // 'end' 的情况已经在前面处理过了
    }

    // 只有当计算出的 targetIndex 有效且新标签页不在目标位置时才移动
    // 注意: chrome.tabs.move 的 index 为 -1 表示移动到最后
    if (targetIndex !== -1 && newTab.index !== targetIndex) {
      // 将新标签页移动到计算出的位置
      try {
        await chrome.tabs.move(newTab.id, { index: targetIndex });
        // console.log(`Moved tab ${newTab.id} to index ${targetIndex} based on setting '${positionSetting}'`);
      } catch (error) {
        // 记录错误，例如标签页在移动前被关闭
        if (!error.message.includes("No tab with id") && !error.message.includes("Cannot move a tab to the window it is already in")) {
            console.error(`Failed to move tab ${newTab.id} to index ${targetIndex}:`, error);
        }
      }
    } else if (targetIndex === -1 && positionSetting === 'end') {
        // 如果设置是 'end'，理论上不应该到这里，但作为保险
        // 不移动标签页，让浏览器处理
    } else if (newTab.index === targetIndex) {
        // 如果标签页已经在目标位置，则无需移动
        // console.log(`Tab ${newTab.id} is already at target index ${targetIndex}.`);
    }

  } else {
    // 如果两种方法都找不到源标签页，记录一个警告
    console.warn("Could not determine the source tab to calculate the new tab position.");
  }
});

// 添加消息监听
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'reloadLanguage') {
    // 强制重新加载语言包
    chrome.i18n.getAcceptLanguages(languages => {
      chrome.i18n.getUILanguage(); // 强制刷新
      sendResponse();
    });
    return true;
  }
});