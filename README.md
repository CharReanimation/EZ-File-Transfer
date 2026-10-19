# EZ File Transfer

[English](README.md) | [简体中文](README_CN.md)

A tiny self-hosted web app for moving files between devices on the same network — push a file from your phone and grab it on your PC, or vice versa. No cloud, no account, no install on the client: open a URL in any browser and you are transferring.

It runs as a single Node server on your machine. Every device that can reach that machine over Wi‑Fi / LAN gets the same upload + download page.

## Features

- **Drag & drop or multi-select** — queue several files at once.
- **Live progress** — per-file bars plus an overall progress bar while uploading.
- **Automatic filename handling** — uploads get a unique random name by default, or keep their original name with an option to auto-suffix duplicates.
- **Instant downloads** — the page lists everything on the server, one click to pull it down.
- **Zero client setup** — the front end is plain HTML/CSS/JS, no build step, no framework.
- **Network-friendly** — detects and prints the LAN URL (prefers the Wi‑Fi adapter) on startup.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer (the server uses built-in `crypto.randomUUID`).
- All devices on the **same network** (Wi‑Fi or LAN).

## Quick start

```bash
# 1. Install dependencies
cd EZFileTransfer
npm install

# 2. Start the server
node ./Server/server.js
```

The console prints the address to open:

```
Access URL: http://192.168.1.20:3000
```

Open that URL on any device on the same network — phone, laptop, tablet — and start transferring. Press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the terminal to stop the server.

### Windows helper scripts

From the `EZFileTransfer` folder:

- `start.bat` — launches the server in the background and records its process id.
- `stop.bat` — stops that recorded server process.

## Usage

1. **Upload** — drop files onto the page (or click *Select Files*), then click *Upload All*.
2. **Filename** — leave *Use Original Filename* off for random unique names, or turn it on to keep the real name (duplicates are suffixed automatically).
3. **Download** — the *Download* section lists every file currently on the server; click one to save it to that device.
4. **Cleanup** — uploaded files live in `EZFileTransfer/Server/uploads/`. Delete anything there to remove it.

## Project structure

```
EZFileTransfer/
├── Server/
│   ├── server.js          # Express app: upload, list, download, static serving
│   └── uploads/           # Stored files (.temp/ is used during upload)
├── Public/
│   ├── index.html         # Single-page UI
│   ├── css/style.css      # Styling
│   └── Script/script.js   # Front-end upload/queue/progress logic
├── start.bat / stop.bat   # Windows convenience scripts
└── package.json
```

## HTTP API

| Method | Route | Description |
| ------ | ----- | ----------- |
| `POST` | `/upload` | Upload a file. Form field `file`; optional `useOriginalFilename` (`"true"` to keep the original name). |
| `GET` | `/files` | List uploaded files as JSON. |
| `GET` | `/download/:filename` | Download a stored file. |
| `GET` | `/` | Serve the web UI. |

## Notes

- **Development tool, not a hardened service.** There is no authentication, so anyone on the network can upload to and download from the server. Use it on a trusted network.
- **Port** is set to `3000` in `Server/server.js`; edit that constant if it conflicts.
- Filenames are sanitized (directory components are stripped) when saved and served.

## License

Released under the [MIT License](LICENSE).
