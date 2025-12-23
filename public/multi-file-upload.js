(function () {
  const ready = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  const isConfigPreviewPage = () =>
    window.location?.pathname?.includes("/viewedit/config/");

  const isPreviewMode = (cfg) => isConfigPreviewPage() || !cfg?.rowId;

  const notify = (opts) => {
    if (typeof window.notifyAlert === "function") window.notifyAlert(opts);
    else if (opts?.text) console.warn(opts.type || "info", opts.text);
  };

  const updateStatus = (root, text) => {
    const target = root.querySelector("[data-mfu-status]");
    if (target) target.textContent = text || "";
  };

  const setBusy = (root, busy, message) => {
    const input = root.querySelector("[data-mfu-input]");
    if (busy) root.classList.add("sc-mfu-uploading");
    else root.classList.remove("sc-mfu-uploading");
    if (input) input.disabled = !!busy;
    updateStatus(root, message || (busy ? root._mfuCfg.uploadingText : ""));
  };

  const fetchJson = async (url, options = {}) => {
    const headers = options.headers || {};
    headers["CSRF-Token"] =
      window._sc_globalCsrf || headers["CSRF-Token"] || "";
    headers["Page-Load-Tag"] =
      window._sc_pageloadtag || headers["Page-Load-Tag"] || "";
    return fetch(url, { ...options, headers }).then((res) => {
      if (!res.ok) throw new Error(res.statusText || "Request failed");
      return res.json();
    });
  };

  const uploadFiles = (root, files) => {
    const cfg = root._mfuCfg;
    if (isPreviewMode(cfg) || !files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) =>
      formData.append("files", file, file.name)
    );
    formData.append("row_id", cfg.rowId);
    root._mfuPending = (root._mfuPending || 0) + 1;
    setBusy(root, true, cfg.uploadingText);
    return fetchJson(`/view/${encodeURIComponent(cfg.viewname)}/upload_files`, {
      method: "POST",
      body: formData,
    })
      .then((json) => handleResponse(root, json))
      .catch((err) => {
        notify({ type: "danger", text: err.message || cfg.errorText });
      })
      .finally(() => {
        root._mfuPending -= 1;
        if (root._mfuPending <= 0) {
          setBusy(root, false, "");
          const input = root.querySelector("[data-mfu-input]");
          if (input) input.value = "";
        }
      });
  };

  const handleResponse = (root, json) => {
    const cfg = root._mfuCfg;
    if (json?.error) {
      notify({ type: "danger", text: json.error });
      return;
    }
    if (cfg.showList && json?.listHtml) {
      const list = root.querySelector("[data-mfu-list]");
      if (list) list.innerHTML = json.listHtml;
    }
    if (json?.uploaded) {
      notify({ type: "success", text: cfg.successText });
    }
  };

  const deleteFile = (root, childId) => {
    const cfg = root._mfuCfg;
    if (isPreviewMode(cfg)) return;
    if (cfg.deleteConfirm && !window.confirm(cfg.deleteConfirm)) return;
    setBusy(root, true, cfg.uploadingText);
    fetchJson(`/view/${encodeURIComponent(cfg.viewname)}/delete_file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_id: childId, row_id: cfg.rowId }),
    })
      .then((json) => handleResponse(root, json))
      .catch((err) =>
        notify({ type: "danger", text: err.message || cfg.errorText })
      )
      .finally(() => setBusy(root, false, ""));
  };

  const wireDropzone = (root, dropzone, input) => {
    if (!dropzone) return;
    const stop = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    ["dragenter", "dragover"].forEach((evt) =>
      dropzone.addEventListener(evt, (ev) => {
        stop(ev);
        dropzone.classList.add("sc-mfu-dropzone--active");
      })
    );
    ["dragleave", "dragend", "drop"].forEach((evt) =>
      dropzone.addEventListener(evt, (ev) => {
        stop(ev);
        if (evt !== "drop")
          dropzone.classList.remove("sc-mfu-dropzone--active");
      })
    );
    dropzone.addEventListener("drop", (ev) => {
      const items = ev.dataTransfer?.files;
      dropzone.classList.remove("sc-mfu-dropzone--active");
      if (items?.length) uploadFiles(root, items);
    });
    dropzone.addEventListener("click", () => input?.click());
  };

  const wireInput = (root, input) => {
    if (!input) return;
    input.addEventListener("change", (ev) => {
      if (ev.target.files?.length) uploadFiles(root, ev.target.files);
    });
  };

  const wireDeletes = (root) => {
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-mfu-delete]");
      if (!btn) return;
      const childId = btn.getAttribute("data-mfu-delete");
      deleteFile(root, childId);
    });
  };

  const initFilePond = (root, input) => {
    const cfg = root._mfuCfg;
    if (!window.FilePond) return;
    const FilePond = window.FilePond;
    const isPreview = isPreviewMode(cfg);
    const disabled = isPreview;
    const pond = FilePond.create(input, {
      allowMultiple: true,
      credits: false,
      labelIdle: cfg.dropLabel,
      allowDrop: !isPreview,
      allowBrowse: !isPreview,
      allowPaste: !isPreview,
      allowProcess: !isPreview,
      disabled,
    });
    pond.setOptions({
      server: {
        process: (
          _fieldName,
          file,
          _metadata,
          load,
          error,
          progress,
          abort
        ) => {
          if (isPreview) {
            error(cfg.disabledText || "Preview only");
            return { abort: () => abort() };
          }
          const controller = new AbortController();
          const formData = new FormData();
          formData.append("files", file, file.name);
          formData.append("row_id", cfg.rowId);
          setBusy(root, true, cfg.uploadingText);
          fetchJson(`/view/${encodeURIComponent(cfg.viewname)}/upload_files`, {
            method: "POST",
            body: formData,
            signal: controller.signal,
          })
            .then((json) => {
              handleResponse(root, json);
              load(Date.now().toString());
            })
            .catch((err) => {
              error(err.message || cfg.errorText);
            })
            .finally(() => setBusy(root, false, ""));
          return {
            abort: () => {
              controller.abort();
              abort();
            },
          };
        },
      },
    });
  };

  const init = (root) => {
    if (!root || root._mfuInitialized) return;
    const cfgText = root.getAttribute("data-mfu-config");
    if (!cfgText) return;
    try {
      const parsedCfg = JSON.parse(cfgText);
      root._mfuCfg = parsedCfg;
    } catch (e) {
      console.error("Invalid MFU config", e);
      return;
    }
    root._mfuInitialized = true;
    const cfg = root._mfuCfg;
    const disabledBanner = root.querySelector("[data-mfu-disabled]");
    const isDisabled = !cfg.rowId;
    if (disabledBanner) {
      if (isDisabled) {
        disabledBanner.classList.remove("d-none");
        disabledBanner.textContent = cfg.disabledText;
      } else {
        disabledBanner.classList.add("d-none");
      }
    }
    root.classList.toggle("sc-mfu-disabled", isDisabled);
    const input = root.querySelector("[data-mfu-input]");
    const dropzone = root.querySelector("[data-mfu-dropzone]");
    if (cfg.mode === "filepond" && input) {
      initFilePond(root, input);
    } else {
      wireInput(root, input);
      wireDropzone(root, dropzone, input);
    }
    wireDeletes(root);
  };

  const initAllRoots = () => {
    document
      .querySelectorAll("[data-mfu-root]")
      .forEach((root) => init(root));
  };

  const observeNewRoots = () => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;
        const added = Array.from(mutation.addedNodes);
        const hasNewRoot = added.some((node) => {
          if (!(node instanceof Element)) return false;
          return (
            node.hasAttribute("data-mfu-root") ||
            node.querySelector?.("[data-mfu-root]")
          );
        });
        if (hasNewRoot) {
          initAllRoots();
          break;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  ready(() => {
    initAllRoots();
    observeNewRoots();
  });
})();
