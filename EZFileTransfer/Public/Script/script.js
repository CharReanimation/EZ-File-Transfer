document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const dropZone = document.getElementById("dropZone");

  // Button
  const selectFilesBtn = document.getElementById("selectFilesBtn");
  const clearFilesBtn = document.getElementById("clearFilesBtn");
  const uploadBtn = document.getElementById("uploadBtn");

  // Upload
  const uploadQueue = document.getElementById("uploadQueue");
  const fileList = document.getElementById("fileList");
  const uploadStatus = document.getElementById("uploadStatus");

  // Progress
  const overallProgress = document.getElementById("overallProgress");
  const progressLabel = document.getElementById("progressLabel");
  const progressPercent = document.getElementById("progressPercent");
  const progressTrack = document.getElementById("progressTrack");
  const progressBar = document.getElementById("progressBar");

  // Selected Files
  const selectedFiles = new Map();

  // Original File Name
  const useOriginalFilename = document.getElementById(
    "useOriginalFilename"
  );
  
  let isUploading = false;


  // Generate a unique ID for each queued file.
  function createFileId() {
    if (typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    // Fallback for browsers that do not support crypto.randomUUID().
    return "file-" + Date.now() + "-" +
      Math.random().toString(36).substring(2, 11);
  }


  // Format file sizes for display.
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  // Add files to the upload queue.
  function addFiles(files) {
    if (isUploading) return;

    let added = 0;

    for (const file of files) {
      const duplicate = [...selectedFiles.values()].some(item =>
        item.file.name === file.name &&
        item.file.size === file.size &&
        item.file.lastModified === file.lastModified
      );

      if (duplicate) continue;

      selectedFiles.set(createFileId(), {
        file,
        progress: 0,
        status: "Waiting"
      });

      added++;
    }

    renderQueue();

    if (added > 0) {
      uploadStatus.textContent = `Added ${added} file(s) to the queue.`;
    } else if (files.length > 0) {
      uploadStatus.textContent = "These files are already in the queue.";
    }
  }

  // Update the overall upload progress.
  function updateOverallProgress() {
    const items = [...selectedFiles.values()];

    const totalBytes = items.reduce(
      (sum, item) => sum + item.file.size,
      0
    );

    const uploadedBytes = items.reduce(
      (sum, item) => sum + item.file.size * item.progress / 100,
      0
    );

    const percent = totalBytes > 0 
      ? Math.floor(uploadedBytes / totalBytes * 100)
      : 0;

    progressPercent.textContent = `${percent}%`;
    progressBar.style.width = `${percent}%`;
    progressTrack.setAttribute("aria-valuenow", percent);
  }

  // Render the upload queue and individual progress bars.
  function renderQueue() {
    uploadQueue.replaceChildren();

    for (const [id, item] of selectedFiles) {
      const li = document.createElement("li");

      const info = document.createElement("div");
      info.className = "file-info";

      const name = document.createElement("span");
      name.className = "file-name";
      name.textContent = item.file.name;

      const size = document.createElement("span");
      size.className = "file-size";
      size.textContent = formatFileSize(item.file.size);

      info.append(name, size);

      const state = document.createElement("div");
      state.className = "file-state";

      if (item.status === "Success") {
        state.classList.add("success");
        state.textContent = "✅ Upload complete";
      } else if (item.status === "Failed") {
        state.classList.add("error");
        state.textContent = `❌ ${item.error || "Upload failed"}`;
      } else if (item.status === "Uploading") {
        state.textContent = `Uploading... ${Math.floor(item.progress)}%`;
      } else {
        state.textContent = "Waiting for upload";
      }

      const track = document.createElement("div");
      track.className = "file-progress-track";

      const bar = document.createElement("div");
      bar.className = "file-progress-bar";
      bar.style.width = `${item.progress}%`;

      if (item.status === "Success") {
        bar.classList.add("success");
      }

      if (item.status === "Failed") {
        bar.classList.add("error");
      }

      track.appendChild(bar);

      li.append(info, state, track);

      if (!isUploading) {
        const removeButton = document.createElement("button");

        removeButton.type = "button";
        removeButton.className = "text-button";
        removeButton.textContent = "REMOVE";

        removeButton.addEventListener("click", () => {
          selectedFiles.delete(id);
          renderQueue();
        });

        li.appendChild(removeButton);
      }

      uploadQueue.appendChild(li);
    }

    uploadBtn.disabled = isUploading || selectedFiles.size === 0;
    selectFilesBtn.disabled = isUploading;
    clearFilesBtn.disabled = isUploading || selectedFiles.size === 0;
    fileInput.disabled = isUploading;
  }

  // Upload a single file and report its real-time progress
  function uploadSingleFile(item) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      // Use the field name expected by the Express backend
      // Send the filename preference to the server
      formData.append("file", item.file);
      formData.append("useOriginalFilename", String(useOriginalFilename.checked));

      item.status = "Uploading";
      item.progress = 0;

      xhr.open("POST", "/upload");

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          item.progress = Math.min(
            99,
            event.loaded / event.total * 100
          );

          updateOverallProgress();
          renderQueue();
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          item.progress = 100;
          item.status = "Success";

          updateOverallProgress();
          renderQueue();

          resolve();
        } else {
          item.status = "Failed";
          item.error = `Server returned ${xhr.status}`;

          renderQueue();

          reject(new Error(item.error));
        }
      };

      xhr.onerror = () => {
        item.status = "Failed";
        item.error = "Network error";

        renderQueue();

        reject(new Error(item.error));
      };

      xhr.onabort = () => {
        item.status = "Failed";
        item.error = "Upload aborted";

        renderQueue();

        reject(new Error(item.error));
      };

      xhr.send(formData);
    });
  }

  // Open the file picker
  selectFilesBtn.addEventListener("click", () => {
    fileInput.click();
  });

  // Handle file selection
  fileInput.addEventListener("change", () => {
    addFiles(Array.from(fileInput.files || []));
    fileInput.value = "";
  });

  // Prevent the browser from opening dropped files
  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    document.addEventListener(eventName, event => {
      event.preventDefault();
    });
  });

  // Highlight the drop zone while dragging files
  ["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
      if (isUploading) return;

      if (event.dataTransfer?.types.includes("Files")) {
        dropZone.classList.add("drag-over");
      }
    });
  });

  // Remove the drag highlight
  ["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
      if (
        eventName === "drop" ||
        !dropZone.contains(event.relatedTarget)
      ) {
        dropZone.classList.remove("drag-over");
      }
    });
  });

  // Add dropped files to the queue
  dropZone.addEventListener("drop", event => {
    if (isUploading) return;

    addFiles(Array.from(event.dataTransfer?.files || []));
  });

  // Clear the upload queue.
  clearFilesBtn.addEventListener("click", () => {
    if (isUploading) return;

    selectedFiles.clear();

    overallProgress.hidden = true;
    progressBar.classList.remove("success", "error");

    renderQueue();

    uploadStatus.textContent = "Upload queue cleared.";
  });

  // Upload queued files sequentially.
  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (isUploading || selectedFiles.size === 0) return;

    const items = [...selectedFiles.values()].filter(
      item => item.status !== "Success"
    );

    if (items.length === 0) {
      uploadStatus.textContent = "All files have already been uploaded.";
      return;
    }

    isUploading = true;

    overallProgress.hidden = false;
    progressLabel.textContent = "Uploading...";
    progressBar.classList.remove("success", "error");

    uploadStatus.textContent = `Uploading ${items.length} file(s)...`;

    renderQueue();

    let successCount = 0;
    let failedCount = 0;

    try {
      // Upload files one at a time to track each file independently.
      for (const item of items) {
        try {
          await uploadSingleFile(item);
          successCount++;
        } catch (error) {
          failedCount++;
          console.error("Upload failed:", error);
        }
      }

      updateOverallProgress();

      if (failedCount === 0) {
        progressLabel.textContent = "Upload complete";
        progressBar.classList.add("success");

        uploadStatus.textContent =
          `Successfully uploaded ${successCount} file(s).`;
      } else {
        progressLabel.textContent = "Upload finished with errors";
        progressBar.classList.add("error");

        uploadStatus.textContent =
          `${successCount} succeeded, ${failedCount} failed. ` +
          "You can retry failed files.";
      }

      await loadFiles();
    } finally {
      isUploading = false;
      renderQueue();
    }
  });

  // Load the available files from the server.
  async function loadFiles() {
    try {
      const response = await fetch("/files");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const files = await response.json();

      fileList.replaceChildren();

      if (!Array.isArray(files) || files.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No files available.";
        fileList.appendChild(li);
        return;
      }

      files.forEach(file => {
        const filename = typeof file === "string" ? file : file.name;

        const li = document.createElement("li");
        const link = document.createElement("a");

        link.href = `/download/${encodeURIComponent(filename)}`;
        link.textContent = `📄 ${filename}`;
        link.download = filename;

        li.appendChild(link);

        if (typeof file === "object" && file.size != null) {
          const size = document.createElement("span");
          size.className = "file-size";
          size.textContent = formatFileSize(file.size);

          li.appendChild(size);
        }

        fileList.appendChild(li);
      });
    } catch (error) {
      console.error("Failed to load files:", error);

      fileList.replaceChildren();

      const li = document.createElement("li");
      li.textContent = "Cannot load file list.";
      fileList.appendChild(li);
    }
  }

  renderQueue();
  loadFiles();
});