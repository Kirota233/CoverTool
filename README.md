# CoverTool 🎬

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)

多功能视频处理工具 - 为内容创作者而生的专业级应用

## ✨ 功能特性

### 🖼️ **批量制作封面**
快速生成高质量的视频封面，完全可自定义
- 上传基础底图（支持 PNG/JPG）
- 自定义文字、字号、颜色、字间距
- 支持加载系统字体和自定义字体上传
- 实时预览与拖拽调整文字位置
- 添加阴影效果增强视觉效果
- 一键批量生成多集封面

### 🎥 **批量嵌入封面**
将封面完美嵌入视频第一帧，创建完整的短视频
- 选择视频文件夹和封面文件夹
- 支持多种分辨率（1920×1080、1080×1920、1080×1080 等）
- 自动适配视频比例，避免拉伸
- 保留原始音频信息
- 快速批量处理

### ✂️ **删除前x帧**
批量删除视频开头的指定帧数，快速处理不需要的片段
- 灵活设置删除的帧数
- 标准化处理（30fps 标准）
- 批量操作多个视频
- 自动输出到 `output_removed_covers` 文件夹
- 保留视频原有质量

## 🛠️ 技术栈

- **[Electron](https://www.electronjs.org/)** - 跨平台桌面应用框架
- **[FFmpeg](https://ffmpeg.org/)** - 强大的视频处理工具
- **[Tailwind CSS](https://tailwindcss.com/)** - 现代UI设计框架
- **[Node.js](https://nodejs.org/)** - JavaScript运行时

## 📋 系统要求

- **macOS 10.13+** / Windows 10+ / Linux
- **4GB RAM** 或更多
- **500MB 磁盘空间** 用于应用安装
- **.NET Framework 4.0+**（Windows）或等效运行时

## 🚀 快速开始

### 安装

1. **克隆仓库**
```bash
git clone https://github.com/Kirota233/CoverTool.git
cd CoverTool
```

2. **安装依赖**
```bash
npm install
```

3. **启动应用**
```bash
npm start
```

### 打包应用

**Mac 打包**
```bash
npm run build
```

生成的应用将保存在 `dist/` 文件夹中。

## 📖 使用教程

### 快速指南

打开应用后，你会看到主菜单。点击顶部的 **"ℹ️ 使用教程"** 查看详细的分步教程。

### 基本流程

#### 生成封面
```
1. 选择基础底图 → 2. 输入文字内容 → 3. 调整字体/颜色 
→ 4. 拖拽调整位置 → 5. 配置输出 → 6. 生成封面
```

#### 嵌入封面到视频
```
1. 选择视频文件夹 → 2. 选择封面文件夹 
→ 3. 设置分辨率 → 4. 开始合成
```

#### 删除视频前帧
```
1. 选择视频文件夹 → 2. 设置删除帧数 
→ 3. 开始处理 → 完成
```

## 📁 项目结构

```
CoverTool/
├── launcher.html              # 应用启动菜单
├── index.html                 # 制作封面 & 嵌入封面
├── embed.html                 # 嵌入封面详细界面
├── remove-frames.html         # 删除前帧界面
├── info.html                  # 交互式使用教程
├── main.js                    # 主进程（IPC通信、文件操作）
├── renderer.js                # 制作封面渲染进程
├── renderer-embed.js          # 嵌入封面渲染进程
├── renderer-remove.js         # 删除前帧渲染进程
├── package.json               # 项目配置
├── LICENSE                    # MIT 许可证
├── README.md                  # 项目文档
└── build/                     # 应用图标和构建文件
```

## 🎨 UI/UX 特性

- ✅ 现代深色主题界面
- ✅ 流畅的动画效果和过渡
- ✅ 实时预览和即时反馈
- ✅ 直观的拖拽操作
- ✅ 响应式设计
- ✅ 清晰的进度提示

## 🔧 高级功能

### 字体管理
- 系统默认字体
- 一键加载所有系统字体
- 上传自定义 TTF/OTF 字体

### 文本效果
- 自定义文字颜色
- 调整字体粗细（正常/加粗/极粗）
- 设置字间距
- 添加阴影效果（颜色、模糊度、偏移量）

### 输出灵活性
- 自定义输出文件夹
- 批量生成多集封面
- 支持多种视频分辨率
- 自动命名和分类

## 📝 许可证

本项目采用 [MIT License](./LICENSE) 开源许可证。

这意味着：
- ✅ 你可以自由使用、修改和分发此项目
- ✅ 可以用于商业和私人项目
- ✅ 只需保留原始许可证和版权声明
- ℹ️ 详细条款请查看 [LICENSE](./LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如有问题或建议，请：
1. 提交 [Issue](https://github.com/Kirota233/CoverTool/issues)
2. Fork 项目并提交 PR
3. 在 GitHub Discussions 中讨论

## 📮 反馈

- 🐛 **报告Bug**：[提交Issue](https://github.com/Kirota233/CoverTool/issues/new)
- 💡 **功能建议**：[讨论功能](https://github.com/Kirota233/CoverTool/discussions)
- 🌟 **喜欢这个项目？** 请给个Star支持！

## 📦 依赖感谢

特别感谢以下开源项目：
- [Electron](https://www.electronjs.org/)
- [FFmpeg](https://ffmpeg.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ffmpeg-static](https://github.com/FFmpeg-static/ffmpeg-static)
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

## 👨‍💻 作者

**Taiki** - 项目创始人

联系方式：[GitHub](https://github.com/Kirota233)

---

## 📄 更新日志

### v2.0.0 (2024/03/27)
- ✨ 新增"批量制作封面"功能（完整重构）
- ✨ 新增"批量嵌入封面"功能
- ✨ 新增"删除前x帧"功能
- ✨ 修复系统字体加载问题
- ✨ 添加交互式教程页面
- ✨ 添加GitHub仓库链接
- 🔧 优化UI界面和用户体验
- 📖 完善项目文档

## 💬 常见问题

**Q: 支持哪些视频格式？**
A: 支持所有FFmpeg支持的格式，主要包括 MP4、MOV、AVI 等。

**Q: 可以批量处理多少个文件？**
A: 理论上无限制，取决于你的计算机性能和磁盘空间。

**Q: 生成的文件保存在哪里？**
A: 默认保存的位置会在各功能页面显示，也可以自定义输出文件夹。

**Q: 字体不显示怎么办？**
A: 尝试加载系统字体库或上传自定义字体文件。

---

**[⬆ 回到顶部](#covertool-)**
