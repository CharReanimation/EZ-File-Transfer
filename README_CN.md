# EZ File Transfer（简易文件传输）

[English](README.md) | [简体中文](README_CN.md)

一个轻量的自托管 Web 应用，用于在同一网络内的设备之间互传文件——用手机上传、在电脑上下载，或反过来。没有云端、没有账号、客户端也无需安装：在浏览器里打开一个网址即可开始传输。

它在你自己的机器上以一个 Node 服务运行。凡是能通过 Wi‑Fi / 局域网访问到这台机器的设备，都会打开同一个上传 + 下载页面。

## 功能特性

- **拖拽上传或多选** — 一次性把多个文件加入队列。
- **实时进度** — 上传时显示每个文件的进度条，以及一个总体进度条。
- **自动文件名处理** — 默认给上传文件生成唯一的随机名，也可选择保留原名，重名时自动加后缀。
- **一键下载** — 页面会列出服务器上的所有文件，单击即可下载。
- **客户端零配置** — 前端是纯 HTML/CSS/JS，没有构建步骤，也不用框架。
- **友好于局域网** — 启动时自动检测并打印局域网访问地址（优先使用 Wi‑Fi 网卡）。

## 环境要求

- [Node.js](https://nodejs.org/) 18 或更新版本（服务端使用了内置的 `crypto.randomUUID`）。
- 所有设备处于**同一网络**（Wi‑Fi 或局域网）。

## 快速开始

```bash
# 1. 安装依赖
cd EZFileTransfer
npm install

# 2. 启动服务
node ./Server/server.js
```

控制台会打印需要打开的地址：

```
Access URL: http://192.168.1.20:3000
```

在同一网络的任意设备——手机、笔记本、平板——上打开该地址即可开始传输。在终端按 <kbd>Ctrl</kbd>+<kbd>C</kbd> 停止服务。

### Windows 辅助脚本

在 `EZFileTransfer` 目录下：

- `start.bat` — 在后台启动服务并记录其进程 ID。
- `stop.bat` — 停止该已记录的服务进程。

## 使用方法

1. **上传** — 把文件拖到页面上（或点击 *Select Files* 选择文件），然后点击 *Upload All*。
2. **文件名** — *Use Original Filename* 关闭时使用随机唯一名；打开时保留真实文件名（重名会自动加后缀）。
3. **下载** — *Download* 区域列出服务器上当前的所有文件，点击即可保存到该设备。
4. **清理** — 上传的文件存放在 `EZFileTransfer/Server/uploads/`。删除其中的文件即可清理。

## 项目结构

```
EZFileTransfer/
├── Server/
│   ├── server.js          # Express 应用：上传、列表、下载、静态资源服务
│   └── uploads/           # 存储的文件（上传过程中使用 .temp/）
├── Public/
│   ├── index.html         # 单页 UI
│   ├── css/style.css      # 样式
│   └── Script/script.js   # 前端的上传/队列/进度逻辑
├── start.bat / stop.bat   # Windows 便捷脚本
└── package.json
```

## HTTP 接口

| 方法 | 路由 | 说明 |
| ---- | ---- | ---- |
| `POST` | `/upload` | 上传文件。表单字段为 `file`；可选 `useOriginalFilename`（值为 `"true"` 时保留原名）。 |
| `GET` | `/files` | 以 JSON 返回已上传文件列表。 |
| `GET` | `/download/:filename` | 下载指定的已存储文件。 |
| `GET` | `/` | 返回 Web UI 页面。 |

## 说明

- **这是开发工具，不是加固过的服务。** 没有任何身份验证，因此网络内的任何人都可以向服务器上传并下载文件。请在可信网络中使用。
- **端口** 在 `Server/server.js` 中设为 `3000`；如有冲突可修改该常量。
- 文件名在保存与提供下载时都会做净化处理（去除目录部分）。

## 许可证

基于 [MIT 许可证](LICENSE) 发布。
