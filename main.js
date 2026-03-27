const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const { autoUpdater } = require('electron-updater');
let ffmpegPath = require('ffmpeg-static');

// ==========================================
// 自动更新配置
// ==========================================
autoUpdater.checkForUpdatesAndNotify();

// 【关键修复】：如果是打包后的正式环境，要把路径指向解压后的外部文件夹
if (app.isPackaged) {
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
}

// 告诉应用去哪里找内置的免安装版 FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

let mainWindow = null;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false 
    }
  });
  // 首先加载启动界面
  mainWindow.loadFile('launcher.html');
}

app.whenReady().then(createWindow);

// ==========================================
// 多功能页面加载系统
// ==========================================
ipcMain.on('load-feature', (event, feature) => {
  if (!mainWindow) return;
  
  switch(feature) {
    case 'launcher':
      mainWindow.loadFile('launcher.html');
      break;
    case 'cover':
      mainWindow.loadFile('index.html');
      break;
    case 'embed':
      mainWindow.loadFile('embed.html');
      break;
    case 'remove':
      mainWindow.loadFile('remove-frames.html');
      break;
    case 'info':
      mainWindow.loadFile('info.html');
      break;
    default:
      mainWindow.loadFile('launcher.html');
  }
});

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

// 获取系统字体列表
ipcMain.handle('get-system-fonts', async () => {
  const systemFonts = [];
  
  // 在 macOS 上获取系统字体
  if (process.platform === 'darwin') {
    try {
      const fontDir = path.join(os.homedir(), 'Library', 'Fonts');
      const files = fs.readdirSync(fontDir);
      
      files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (['.ttf', '.otf', '.ttc', '.dfont'].includes(ext)) {
          // 移除扩展名作为字体名
          const fontName = path.basename(file, ext);
          if (!systemFonts.includes(fontName)) {
            systemFonts.push(fontName);
          }
        }
      });
    } catch (err) {
      console.log('读取系统字体文件夹出错:', err);
    }
  } 
  // Windows 上的字体路径
  else if (process.platform === 'win32') {
    try {
      const fontDir = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts');
      const files = fs.readdirSync(fontDir);
      
      files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (['.ttf', '.otf', '.ttc'].includes(ext)) {
          const fontName = path.basename(file, ext);
          if (!systemFonts.includes(fontName)) {
            systemFonts.push(fontName);
          }
        }
      });
    } catch (err) {
      console.log('读取系统字体文件夹出错:', err);
    }
  }
  // Linux 上的字体路径
  else if (process.platform === 'linux') {
    try {
      const fontDirs = [
        path.join(os.homedir(), '.fonts'),
        '/usr/share/fonts',
        '/usr/local/share/fonts'
      ];
      
      fontDirs.forEach(fontDir => {
        if (fs.existsSync(fontDir)) {
          const files = fs.readdirSync(fontDir, { recursive: true });
          files.forEach(file => {
            if (typeof file === 'string') {
              const ext = path.extname(file).toLowerCase();
              if (['.ttf', '.otf', '.ttc'].includes(ext)) {
                const fontName = path.basename(file, ext);
                if (!systemFonts.includes(fontName)) {
                  systemFonts.push(fontName);
                }
              }
            }
          });
        }
      });
    } catch (err) {
      console.log('读取系统字体文件夹出错:', err);
    }
  }
  
  return systemFonts.sort();
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

// 2.5 灵活命名的视频合成逻辑
ipcMain.on('start-synthesis-flexible', async (event, data) => {
    const { videoFolder, coverFolder, projectName, resolution, videoFiles, coverFiles } = data;
    
    const [targetW, targetH] = resolution.split('x');
    const outputFolder = path.join(videoFolder, 'output');
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < videoFiles.length; i++) {
        const videoFile = videoFiles[i];
        const coverFile = coverFiles[i] || null;
        
        if (!coverFile) {
            console.log(`跳过第 ${i + 1} 个视频：找不到对应的封面`);
            failCount++;
            continue;
        }

        const videoPath = path.join(videoFolder, videoFile);
        const coverPath = path.join(coverFolder, coverFile);
        const outputName = `${projectName}_${i + 1}.mp4`;
        const outputPath = path.join(outputFolder, outputName);

        event.reply('synthesis-progress', `正在合成第 ${i + 1} / ${videoFiles.length} 个...\n${videoFile} + ${coverFile}\n[格式: ${targetW}×${targetH}] 🚀`);
        
        try {
            await processVideo(coverPath, videoPath, outputPath, targetW, targetH);
            console.log(`第 ${i + 1} 个完成: ${outputName}`);
            successCount++;
        } catch (err) {
            console.error(`合成第${i + 1}个失败:`, err);
            failCount++;
            event.reply('synthesis-progress', `⚠️ 第 ${i + 1} 个处理失败，继续处理下一个...`);
        }
    }
    
    if (failCount === 0) {
        event.reply('synthesis-complete', `🎉 大功告成！\n成功合成了 ${successCount} 个视频。\n保存在: ${path.basename(outputFolder)} 文件夹`);
    } else {
        event.reply('synthesis-complete', `⚠️ 处理结束！\n成功: ${successCount} 个，失败: ${failCount} 个。\n保存在: ${path.basename(outputFolder)} 文件夹`);
    }
});

// 3. 删除前x帧逻辑
ipcMain.on('start-remove-frames', async (event, data) => {
    const { videoFolder, framesToRemove } = data;
    
    const files = fs.readdirSync(videoFolder)
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ext === '.mp4' || ext === '.mov';
        })
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (files.length === 0) {
        event.reply('remove-frames-error', '错误：所选文件夹中没有找到 mp4 或 mov 视频文件！');
        return;
    }

    const outputFolder = path.join(videoFolder, 'output_removed_covers');
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputPath = path.join(videoFolder, file);
        const outputPath = path.join(outputFolder, `[无封面]_${file}`);

        event.reply('remove-frames-progress', `正在处理第 ${i + 1} / ${files.length} 个视频: \n${file} (削去前 ${framesToRemove} 帧) ✂️`);
        
        try {
            const actualCutFrames = framesToRemove + 1; 
            await processRemoveVideo(inputPath, outputPath, actualCutFrames);
            
            console.log(`${file} 处理完成`);
            successCount++;
        } catch (err) {
            console.error(`处理 ${file} 失败:`, err);
            failCount++;
            continue; 
        }
    }
    
    if (failCount === 0) {
        event.reply('remove-frames-complete', `🎉 大功告成！\n成功处理了所有 ${successCount} 个视频。\n保存在: output_removed_covers 文件夹`);
    } else {
        event.reply('remove-frames-complete', `⚠️ 处理结束！\n成功: ${successCount} 个，失败跳过: ${failCount} 个。\n(失败的视频可能文件损坏，请在终端查看报错记录)`);
    }
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

// 删除前x帧的 FFmpeg 处理函数
function processRemoveVideo(inputPath, outputPath, frames) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoFilters([
                `select='gte(n,${frames})'`,
                'setpts=PTS-STARTPTS'
            ])
            .outputOptions([
                '-vsync 0',
                '-c:v libx264',
                '-preset superfast',
                '-crf 18',
                '-c:a copy'
            ])
            .save(outputPath)
            .on('end', () => {
                resolve();
            })
            .on('error', (err, stdout, stderr) => {
                const errorMsg = stderr ? stderr.split('\n').slice(-5).join('\n') : err.message;
                reject(errorMsg);
            });
    });
}