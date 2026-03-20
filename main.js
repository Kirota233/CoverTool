const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
let ffmpegPath = require('ffmpeg-static');

// 【关键修复】：如果是打包后的正式环境，要把路径指向解压后的外部文件夹
if (app.isPackaged) {
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
}

// 告诉应用去哪里找内置的免安装版 FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

function createWindow () {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false 
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// 1. 响应前端请求：打开文件夹选择框
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (!result.canceled) {
    return result.filePaths[0]; // 返回用户选择的路径
  }
  return null;
});

// 2. 核心视频合成逻辑
ipcMain.on('start-synthesis', async (event, data) => {
    const { videoFolder, imageFolder, totalEpisodes, projectName, resolution } = data;
    
    // 解析分辨率 (例如把 "1080x1920" 拆成 w=1080, h=1920)
    const [targetW, targetH] = resolution.split('x');

    const outputFolder = path.join(videoFolder, 'output');
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

    for (let i = 1; i <= totalEpisodes; i++) {
        const imgPath = path.join(imageFolder, `cover_EP${i}.png`);
        const videoPath = path.join(videoFolder, `EP${i}.mp4`);
        const outputPath = path.join(outputFolder, `${projectName}_${i}.mp4`);

        if (fs.existsSync(imgPath) && fs.existsSync(videoPath)) {
            event.reply('synthesis-progress', `正在合成第 ${i} / ${totalEpisodes} 集...\n[格式: ${targetW}×${targetH}] 🚀`);
            try {
                await processVideo(imgPath, videoPath, outputPath, targetW, targetH);
                console.log(`第 ${i} 集完成`);
            } catch (err) {
                console.error(`合成第${i}集失败:`, err);
                // 把详细的错误信息发回给前端
                event.reply('synthesis-error', `第 ${i} 集处理失败。\n原因: ${err}`);
                return; // 一旦出错就中断整个队列，防止电脑白费力气
            }
        } else {
            console.log(`跳过第 ${i} 集：找不到对应的 mp4 或 png`);
        }
    }
    
    event.reply('synthesis-complete', `🎉 大功告成！\n所有视频已使用 ${resolution} 比例合成完毕。\n保存在: output 文件夹`);
});

// 封装 FFmpeg 处理过程（动态参数 + 增强报错抓取）
function processVideo(imgPath, videoPath, outputPath, w, h) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(imgPath)
            .input(videoPath)
            .complexFilter([
                // 1. 处理图片封面：等比缩放并填充黑边居中，防止图片变形
                `[0:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,loop=loop=1:size=1:start=0[v0]`,
                // 2. 处理原视频：同样使用等比缩放填充黑边（这是增强项，防止原视频比例不对被拉伸）
                `[1:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1[v1]`,
                // 3. 拼接在一起
                `[v0][v1]concat=n=2:v=1:a=0[v]`
            ])
            .outputOptions([
                '-map [v]',
                '-map 1:a?',      // 映射音频 (如果有音频的话)
                '-c:v libx264',
                '-pix_fmt yuv420p', 
                '-r 30',
                '-preset superfast',
                '-crf 18'
            ])
            .save(outputPath)
            .on('end', () => {
                resolve();
            })
            // 这里是报错增强捕获机制！获取 FFmpeg 的底层报错日志 (stderr)
            .on('error', (err, stdout, stderr) => {
                const errorMsg = stderr ? stderr.split('\n').slice(-5).join('\n') : err.message;
                reject(errorMsg);
            });
    });
}