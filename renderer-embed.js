const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

function getEl(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`警告: HTML中找不到 ID 为 ${id} 的元素`);
    return el;
}

// 元素获取
const backBtn = getEl('backBtn');
const selectFolderBtn = getEl('selectFolderBtn');
const videoFolderDisplay = getEl('videoFolderDisplay');
const selectCoverFolderBtn = getEl('selectCoverFolderBtn');
const coverFolderDisplay = getEl('coverFolderDisplay');
const projectNameInput = getEl('projectName');
const startSynthesisBtn = getEl('startSynthesisBtn');
const synthesisStatus = getEl('synthesisStatus');
const videoResolutionInput = getEl('videoResolution');
const synthesisStatusBox = getEl('synthesisStatusBox');
const previewBox = getEl('previewBox');
const previewList = getEl('previewList');

let selectedVideoFolder = null;
let selectedCoverFolder = null;
let fileMapping = {}; // 用于存储文件配对关系

// ==========================================
// 文件处理工具函数
// ==========================================

// 从文件名中提取数字（用于排序）
function extractNumbers(filename) {
    const matches = filename.match(/\d+/g) || [];
    return matches.map(m => parseInt(m));
}

// 自然排序比较
function naturalCompare(a, b) {
    const numA = extractNumbers(a);
    const numB = extractNumbers(b);
    
    for (let i = 0; i < Math.max(numA.length, numB.length); i++) {
        const na = numA[i] || 0;
        const nb = numB[i] || 0;
        if (na !== nb) return na - nb;
    }
    return a.localeCompare(b);
}

// 获取文件夹中的媒体文件并排序
function getMediaFiles(folderPath, extensions) {
    try {
        const files = fs.readdirSync(folderPath)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return extensions.includes(ext) && !file.startsWith('.');
            })
            .sort(naturalCompare);
        return files;
    } catch (err) {
        console.error('读取文件夹出错:', err);
        return [];
    }
}

// 生成预览列表
function generatePreview() {
    if (!selectedVideoFolder || !selectedCoverFolder) return;
    
    const videoFiles = getMediaFiles(selectedVideoFolder, ['.mp4', '.mov']);
    const coverFiles = getMediaFiles(selectedCoverFolder, ['.png', '.jpg', '.jpeg']);
    
    if (videoFiles.length === 0 || coverFiles.length === 0) {
        previewBox.classList.add('hidden');
        return;
    }
    
    // 配对文件
    fileMapping = {};
    const previewItems = [];
    
    // 显示全部文件，不限制数量
    for (let i = 0; i < videoFiles.length; i++) {
        const videoFile = videoFiles[i];
        const coverFile = coverFiles[i] || '❌ 未找到对应封面';
        
        fileMapping[videoFile] = coverFile;
        
        const projectName = projectNameInput.value || '项目名';
        const outputName = `${projectName}_${i + 1}.mp4`;
        const outputLocation = path.join(selectedVideoFolder, 'output', outputName);
        
        const preview = document.createElement('div');
        preview.className = 'bg-white p-2 rounded border border-blue-100 text-xs';
        preview.innerHTML = `
            <div class="font-mono text-slate-700">
                <span class="text-blue-600 font-bold">[${i + 1}]</span>
                <span>🎬 ${videoFile}</span>
                <span class="text-slate-400">+</span>
                <span>🖼️ ${coverFile}</span>
            </div>
            <div class="text-slate-500 mt-1 ml-6">→ 输出: <span class="font-mono text-slate-600">${outputName}</span></div>
        `;
        previewItems.push(preview);
    }
    
    previewList.innerHTML = '';
    previewItems.forEach(item => previewList.appendChild(item));
    
    // 更新计数
    const previewCountEl = document.getElementById('previewCount');
    if (previewCountEl) {
        const matchCount = videoFiles.filter((_, i) => coverFiles[i]).length;
        previewCountEl.innerText = `${matchCount} / ${videoFiles.length} 文件`;
    }
    
    previewBox.classList.remove('hidden');
}

// 返回菜单
if (backBtn) {
    backBtn.addEventListener('click', () => {
        ipcRenderer.send('load-feature', 'launcher');
    });
}

// 选择视频文件夹
if (selectFolderBtn) {
    selectFolderBtn.addEventListener('click', async () => {
        const folder = await ipcRenderer.invoke('select-folder');
        if (folder) {
            selectedVideoFolder = folder;
            videoFolderDisplay.value = folder;
            generatePreview();
        }
    });
}

// 选择封面文件夹
if (selectCoverFolderBtn) {
    selectCoverFolderBtn.addEventListener('click', async () => {
        const folder = await ipcRenderer.invoke('select-folder');
        if (folder) {
            selectedCoverFolder = folder;
            coverFolderDisplay.value = folder;
            generatePreview();
        }
    });
}

// 当项目名改变时，更新预览
if (projectNameInput) {
    projectNameInput.addEventListener('input', () => {
        generatePreview();
    });
}

// 开始合成
if (startSynthesisBtn) {
    startSynthesisBtn.addEventListener('click', () => {
        if (!selectedVideoFolder) {
            alert('请先选择原视频所在的文件夹！');
            return;
        }

        if (!selectedCoverFolder) {
            alert('请先选择封面文件夹！');
            return;
        }

        // 自动检测视频文件数
        const videoFiles = getMediaFiles(selectedVideoFolder, ['.mp4', '.mov']);
        
        if (videoFiles.length === 0) {
            alert('所选视频文件夹中没有找到 .mp4 或 .mov 文件！');
            return;
        }

        const projectName = projectNameInput ? projectNameInput.value : '我的项目';
        const resolution = videoResolutionInput ? videoResolutionInput.value : '1080x1920';
        const total = videoFiles.length; // 自动根据检测到的文件数

        if (synthesisStatusBox) {
            synthesisStatusBox.classList.remove('hidden');
            synthesisStatusBox.className = "mt-4 p-3 rounded bg-blue-50 border border-blue-200";
        }
        
        synthesisStatus.innerText = "准备启动 FFmpeg 引擎...";
        synthesisStatus.className = "text-sm text-center text-blue-600 font-bold break-all";
        startSynthesisBtn.disabled = true;

        ipcRenderer.send('start-synthesis-flexible', {
            videoFolder: selectedVideoFolder,
            coverFolder: selectedCoverFolder,
            projectName: projectName,
            resolution: resolution,
            videoFiles: videoFiles, // 传递排序好的视频文件列表
            coverFiles: getMediaFiles(selectedCoverFolder, ['.png', '.jpg', '.jpeg']) // 也传递封面文件列表
        });
    });
}

// 监听进度
ipcRenderer.on('synthesis-progress', (event, msg) => {
    synthesisStatus.innerText = msg;
});

// 监听完成
ipcRenderer.on('synthesis-complete', (event, msg) => {
    if (synthesisStatusBox) synthesisStatusBox.className = "mt-4 p-3 rounded bg-green-50 border border-green-200";
    synthesisStatus.innerText = msg;
    synthesisStatus.className = "text-sm text-center text-green-600 font-bold";
    startSynthesisBtn.disabled = false;
});

// 监听错误
ipcRenderer.on('synthesis-error', (event, msg) => {
    if (synthesisStatusBox) synthesisStatusBox.className = "mt-4 p-3 rounded bg-red-50 border border-red-200 max-h-40 overflow-y-auto";
    synthesisStatus.innerText = msg;
    synthesisStatus.className = "text-sm text-center text-red-600 font-bold break-all";
    startSynthesisBtn.disabled = false;
});
