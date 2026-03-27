const { ipcRenderer } = require('electron');

const selectFolderBtn = document.getElementById('selectFolderBtn');
const videoFolderDisplay = document.getElementById('videoFolderDisplay');
const framesToRemoveInput = document.getElementById('framesToRemove');
const startBtn = document.getElementById('startBtn');
const statusBox = document.getElementById('statusBox');
const statusText = document.getElementById('statusText');
const backBtn = document.getElementById('backBtn');

let selectedFolder = null;

// 返回菜单
backBtn.addEventListener('click', () => {
    ipcRenderer.send('load-feature', 'launcher');
});

// 点击选择文件夹
selectFolderBtn.addEventListener('click', async () => {
    const folder = await ipcRenderer.invoke('select-folder');
    if (folder) {
        selectedFolder = folder;
        videoFolderDisplay.value = folder;
    }
});

// 点击开始处理
startBtn.addEventListener('click', () => {
    if (!selectedFolder) {
        alert('请先选择视频所在的文件夹！');
        return;
    }

    const frames = parseInt(framesToRemoveInput.value) || 1;

    statusBox.classList.remove('hidden');
    statusBox.className = "mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200";
    statusText.innerText = "正在唤醒 FFmpeg 引擎...";
    statusText.className = "text-sm text-center text-blue-600 font-bold";
    startBtn.disabled = true;

    ipcRenderer.send('start-remove-frames', {
        videoFolder: selectedFolder,
        framesToRemove: frames
    });
});

// 监听进度
ipcRenderer.on('remove-frames-progress', (event, msg) => {
    statusText.innerText = msg;
});

// 监听完成
ipcRenderer.on('remove-frames-complete', (event, msg) => {
    statusBox.className = "mt-4 p-4 rounded-lg bg-green-50 border border-green-200";
    statusText.innerText = msg;
    statusText.className = "text-sm text-center text-green-600 font-bold";
    startBtn.disabled = false;
});

// 监听报错
ipcRenderer.on('remove-frames-error', (event, msg) => {
    statusBox.className = "mt-4 p-4 rounded-lg bg-red-50 border border-red-200 max-h-40 overflow-y-auto text-left";
    statusText.innerText = `❌ 发生错误:\n${msg}`;
    statusText.className = "text-xs text-red-600 font-mono whitespace-pre-wrap break-all";
    startBtn.disabled = false;
});
