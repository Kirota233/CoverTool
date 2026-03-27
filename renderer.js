const { ipcRenderer } = require('electron'); 
const fs = require('fs');
const path = require('path');
const os = require('os');
const desktopPath = path.join(os.homedir(), 'Desktop', '生成封面图_Output');

function getEl(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`警告: HTML中找不到 ID 为 ${id} 的元素`);
    return el;
}

// 元素获取
const imageInput = getEl('imageInput');
const customFontInput = getEl('customFontInput'); 
const posXInput = getEl('posX');
const posYInput = getEl('posY');
const fontSizeInput = getEl('fontSize');
const letterSpacingInput = getEl('letterSpacing');
const fontColorInput = getEl('fontColor'); 
const totalEpisodesInput = getEl('totalEpisodes');
const generateBtn = getEl('generateBtn');
const statusText = getEl('status');
const canvas = getEl('previewCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const fontFamilyInput = getEl('fontFamily');
const fontWeightInput = getEl('fontWeight');
const shadowColorInput = getEl('shadowColor');
const shadowBlurInput = getEl('shadowBlur');
const shadowOffsetXInput = getEl('shadowOffsetX');
const shadowOffsetYInput = getEl('shadowOffsetY');

const backBtn = getEl('backBtn');
const selectOutputFolderBtn = getEl('selectOutputFolderBtn');
const outputFolderDisplay = getEl('outputFolderDisplay');
const coverNamePrefix = getEl('coverNamePrefix');
const loadSystemFontsBtn = getEl('loadSystemFontsBtn');

let baseImage = new Image();
let selectedOutputFolder = null;
let outputFolderPath = desktopPath;
let systemFontsLoaded = false;

// ==========================================
// 返回菜单
// ==========================================
if (backBtn) {
    backBtn.addEventListener('click', () => {
        ipcRenderer.send('load-feature', 'launcher');
    });
}

// ==========================================
// 用于记录文字包围盒的全局变量，方便鼠标检测
// ==========================================
let currentTextMetrics = { x: 0, y: 0, width: 0, height: 0 };

// 自定义字体上传
if (customFontInput) {
    customFontInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const fontUrl = URL.createObjectURL(file);
            const fontName = 'CustomUserFont_' + Date.now();
            const customFont = new FontFace(fontName, `url(${fontUrl})`);
            await customFont.load();
            document.fonts.add(customFont);

            const option = document.createElement('option');
            option.value = fontName;  // 不带引号
            option.text = `自定义: ${file.name}`;
            fontFamilyInput.appendChild(option);
            fontFamilyInput.value = fontName;
            drawPreview("EP1"); 
        } catch (err) {
            alert("❌ 字体加载失败！请确认上传的是标准的 .ttf 或 .otf 格式字体文件。");
        }
    });
}

// 加载系统字体
if (loadSystemFontsBtn) {
    loadSystemFontsBtn.addEventListener('click', async () => {
        if (systemFontsLoaded) {
            alert('系统字体已加载！');
            return;
        }
        
        loadSystemFontsBtn.innerText = '⏳ 正在加载...';
        loadSystemFontsBtn.style.pointerEvents = 'none';
        
        try {
            const fonts = await ipcRenderer.invoke('get-system-fonts');
            
            fonts.forEach(fontName => {
                const existingOption = Array.from(fontFamilyInput.options).find(
                    opt => opt.value === fontName
                );
                if (!existingOption) {
                    const option = document.createElement('option');
                    option.value = fontName;  // 不带引号
                    option.text = fontName;
                    fontFamilyInput.appendChild(option);
                }
            });
            
            loadSystemFontsBtn.innerText = `✅ 已加载 ${fonts.length} 个字体`;
            systemFontsLoaded = true;
            
            setTimeout(() => {
                loadSystemFontsBtn.innerText = '+ 加载系统字体';
                loadSystemFontsBtn.style.pointerEvents = 'auto';
            }, 2000);
        } catch (err) {
            console.error('加载系统字体失败:', err);
            alert('❌ 加载系统字体失败');
            loadSystemFontsBtn.innerText = '+ 加载系统字体';
            loadSystemFontsBtn.style.pointerEvents = 'auto';
        }
    });
}

// 图片上传
if (imageInput) {
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            baseImage.src = event.target.result;
            baseImage.onload = () => {
                canvas.width = baseImage.width;
                canvas.height = baseImage.height;
                if(posXInput) posXInput.value = Math.round(canvas.width / 2);
                if(posYInput) posYInput.value = Math.round(canvas.height / 2);
                drawPreview("EP1"); 
            };
        };
        reader.readAsDataURL(file);
    });
}

const allInputs = [
    posXInput, posYInput, fontSizeInput, letterSpacingInput, fontColorInput,
    fontFamilyInput, fontWeightInput, 
    shadowColorInput, shadowBlurInput, 
    shadowOffsetXInput, shadowOffsetYInput
];

allInputs.forEach(input => {
    if (input) {
        input.addEventListener('input', () => drawPreview("EP1"));
        input.addEventListener('change', () => drawPreview("EP1"));
    }
});

// 💡 核心绘画函数：新增 isExporting 参数
// 当 isExporting 为 true 时，不画控制框！
function drawPreview(episodeText = "EP1", isExporting = false) {
    if (!baseImage.src || !ctx) return;
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    const fontSize = fontSizeInput ? parseInt(fontSizeInput.value) : 80;
    const letterSpacing = letterSpacingInput ? parseInt(letterSpacingInput.value) || 0 : 0;
    const fontWeight = fontWeightInput ? fontWeightInput.value : "bold";
    let fontFamily = fontFamilyInput ? fontFamilyInput.value : "sans-serif";
    const fontColor = fontColorInput ? fontColorInput.value : "#ffffff"; 
    
    // 如果字体名称中有空格，需要加引号
    if (fontFamily && fontFamily.includes(' ') && !fontFamily.startsWith("'")) {
        fontFamily = `'${fontFamily}'`;
    }
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fontColor; 
    ctx.textBaseline = "middle"; 

    if (shadowColorInput) ctx.shadowColor = shadowColorInput.value;
    if (shadowBlurInput) ctx.shadowBlur = parseInt(shadowBlurInput.value) || 0;
    if (shadowOffsetXInput) ctx.shadowOffsetX = parseInt(shadowOffsetXInput.value) || 0;
    if (shadowOffsetYInput) ctx.shadowOffsetY = parseInt(shadowOffsetYInput.value) || 0;

    const x = posXInput ? parseInt(posXInput.value) : canvas.width / 2;
    const y = posYInput ? parseInt(posYInput.value) : canvas.height / 2;
    
    ctx.textAlign = "left"; 

    let totalWidth = 0;
    for (let i = 0; i < episodeText.length; i++) {
        totalWidth += ctx.measureText(episodeText[i]).width;
    }
    totalWidth += (episodeText.length - 1) * letterSpacing;

    let currentX = x - (totalWidth / 2);

    // 记录包围盒，用于鼠标碰撞检测
    currentTextMetrics = {
        x: currentX,
        y: y - (fontSize / 2),
        width: totalWidth,
        height: fontSize
    };

    for (let i = 0; i < episodeText.length; i++) {
        const char = episodeText[i];
        ctx.fillText(char, currentX, y);

        if (fontWeight === "bold" || fontWeight === "900") {
            ctx.lineWidth = fontWeight === "900" ? (fontSize * 0.05) : (fontSize * 0.025);
            ctx.strokeStyle = fontColor; 
            ctx.strokeText(char, currentX, y);
        }
        currentX += ctx.measureText(char).width + letterSpacing;
    }

    // ==========================================
    // 💡 画布UI层：绘制选框和缩放控制点 (仅在预览时显示)
    // ==========================================
    if (!isExporting) {
        ctx.save();
        const pad = 10; // 选框内边距
        
        // 1. 画蓝色虚线包围盒
        ctx.strokeStyle = "rgba(0, 153, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.shadowColor = "transparent"; // 确保UI框没有阴影
        ctx.strokeRect(currentTextMetrics.x - pad, currentTextMetrics.y - pad, currentTextMetrics.width + pad * 2, currentTextMetrics.height + pad * 2);

        // 2. 画右下角的白色控制点 (Handle)
        ctx.setLineDash([]);
        ctx.fillStyle = "white";
        const handleSize = 14;
        const handleX = currentTextMetrics.x + currentTextMetrics.width + pad - handleSize/2;
        const handleY = currentTextMetrics.y + currentTextMetrics.height + pad - handleSize/2;
        
        ctx.fillRect(handleX, handleY, handleSize, handleSize);
        ctx.strokeRect(handleX, handleY, handleSize, handleSize);
        ctx.restore();
    }
}

// ==========================================
// 💡 无极缩放与拖拽引擎
// ==========================================
let isDragging = false;
let isScaling = false;
let dragStartX = 0;
let dragStartY = 0;
let textStartX = 0;
let textStartY = 0;
let startFontSize = 80;
let startDistance = 0;

if (canvas) {
    // 处理鼠标移动，改变指针样式 (Hover效果)
    canvas.addEventListener('mousemove', (e) => {
        if (!baseImage.src) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        const pad = 10;
        const handleX = currentTextMetrics.x + currentTextMetrics.width + pad;
        const handleY = currentTextMetrics.y + currentTextMetrics.height + pad;

        if (isScaling) {
            // ----- 执行缩放逻辑 -----
            // 计算当前鼠标距离文字中心的距离，与初始距离做比例换算，实现完美缩放
            const centerX = parseInt(posXInput.value);
            const centerY = parseInt(posYInput.value);
            const currentDistance = Math.hypot(mouseX - centerX, mouseY - centerY);
            
            let newFontSize = Math.round(startFontSize * (currentDistance / startDistance));
            if (newFontSize < 10) newFontSize = 10; // 限制最小字号
            
            if (fontSizeInput) fontSizeInput.value = newFontSize;
            drawPreview("EP1");
            return;
        }

        if (isDragging) {
            // ----- 执行拖拽逻辑 -----
            const deltaX = mouseX - dragStartX;
            const deltaY = mouseY - dragStartY;
            if (posXInput) posXInput.value = Math.round(textStartX + deltaX);
            if (posYInput) posYInput.value = Math.round(textStartY + deltaY);
            drawPreview("EP1");
            return;
        }

        // ----- Hover 检测 (判断鼠标在什么位置) -----
        // 1. 判断是否在右下角缩放控制点上 (给 25px 的宽容判定范围)
        if (Math.abs(mouseX - handleX) < 25 && Math.abs(mouseY - handleY) < 25) {
            canvas.style.cursor = 'nwse-resize'; // 倾斜双箭头
        } 
        // 2. 判断是否在文字包围盒内部
        else if (mouseX > currentTextMetrics.x - pad && mouseX < currentTextMetrics.x + currentTextMetrics.width + pad &&
                 mouseY > currentTextMetrics.y - pad && mouseY < currentTextMetrics.y + currentTextMetrics.height + pad) {
            canvas.style.cursor = 'grab'; // 抓取手势
        } else {
            canvas.style.cursor = 'default';
        }
    });

    // 鼠标按下：判定是开始缩放还是开始拖拽
    canvas.addEventListener('mousedown', (e) => {
        if (!baseImage.src) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        const pad = 10;
        const handleX = currentTextMetrics.x + currentTextMetrics.width + pad;
        const handleY = currentTextMetrics.y + currentTextMetrics.height + pad;

        // 1. 优先判定：是否按住了缩放点？
        if (Math.abs(mouseX - handleX) < 25 && Math.abs(mouseY - handleY) < 25) {
            isScaling = true;
            startFontSize = parseInt(fontSizeInput.value) || 80;
            const centerX = parseInt(posXInput.value);
            const centerY = parseInt(posYInput.value);
            // 记录最初始的对角线距离
            startDistance = Math.hypot(mouseX - centerX, mouseY - centerY);
            return;
        }

        // 2. 次级判定：是否按住了文字区域？
        if (mouseX > currentTextMetrics.x - pad && mouseX < currentTextMetrics.x + currentTextMetrics.width + pad &&
            mouseY > currentTextMetrics.y - pad && mouseY < currentTextMetrics.y + currentTextMetrics.height + pad) {
            isDragging = true;
            dragStartX = mouseX;
            dragStartY = mouseY;
            textStartX = parseInt(posXInput.value) || canvas.width / 2;
            textStartY = parseInt(posYInput.value) || canvas.height / 2;
            canvas.style.cursor = 'grabbing';
        }
    });

    // 鼠标松开或移出：释放所有动作
    canvas.addEventListener('mouseup', () => { isDragging = false; isScaling = false; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; isScaling = false; });
}

// ==========================================
// 💡 一键生成图片：开启隐身模式 (isExporting = true)
// ==========================================
if (generateBtn) {
    generateBtn.addEventListener('click', () => {
        if (!baseImage.src) {
            alert("请先选择一张底图！");
            return;
        }
        
        const outputPath = selectedOutputFolder || desktopPath;
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }

        const total = totalEpisodesInput ? parseInt(totalEpisodesInput.value) : 1;
        const prefix = coverNamePrefix && coverNamePrefix.value.trim() ? coverNamePrefix.value.trim() : 'cover';
        
        if (statusText) {
            statusText.innerText = "正在疯狂生成中...";
            statusText.className = "text-sm text-center mt-3 text-blue-500 font-bold";
        }
        generateBtn.disabled = true;

        setTimeout(() => {
            for (let i = 1; i <= total; i++) {
                // 【重点】这里传入 true，让它不要画出蓝色的控制框！
                drawPreview(`EP${i}`, true); 
                const dataURL = canvas.toDataURL('image/png');
                const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");
                const fileName = `${prefix}_EP${i}.png`;
                const filePath = path.join(outputPath, fileName);
                fs.writeFileSync(filePath, base64Data, 'base64');
            }

            // 生成完毕后，把蓝色控制框画回来
            drawPreview("EP1", false);
            if (statusText) {
                statusText.innerText = `✅ 成功生成 ${total} 张！已存放到：${outputPath}`;
                statusText.className = "text-sm text-center mt-3 text-green-600 font-bold";
            }
            generateBtn.disabled = false;
        }, 100);
    });
}

// 确保字体加载后再渲染
document.fonts.ready.then(() => {
    if (baseImage.src) drawPreview("EP1");
}).catch(err => console.log("字体加载警告:", err));

// ==========================================
// 第 2 步：视频合成交互逻辑 
// ==========================================
if (selectOutputFolderBtn) {
    selectOutputFolderBtn.addEventListener('click', async () => {
        const folder = await ipcRenderer.invoke('select-folder');
        if (folder) {
            selectedOutputFolder = folder;
            outputFolderPath = folder;
            outputFolderDisplay.value = folder;
        }
    });
}