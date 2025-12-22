const viewtemplate = require("./multi_file_upload");
const { features } = require("@saltcorn/data/db/state");

const verstring = features?.version_plugin_serve_path
  ? "@" + require("./package.json").version
  : "";

const headers = [
  {
    script: `/plugins/public/multi-file-upload${verstring}/js/filepond.min.js`,
    onlyViews: [viewtemplate.name],
  },
  {
    css: `/plugins/public/multi-file-upload${verstring}/css/filepond.min.css`,
    onlyViews: [viewtemplate.name],
  },
  {
    script: `/plugins/public/multi-file-upload${verstring}/multi-file-upload.js`,
    onlyViews: [viewtemplate.name],
  },
  {
    style: `
.sc-mfu { border: 1px solid var(--bs-border-color, #dee2e6); border-radius  : 0.5rem; padding: 1rem; }
.sc-mfu-list { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.35rem; }
.sc-mfu-row { background: rgba(0,0,0,0.02); border-radius: 0.35rem; padding: 0.5rem 0.75rem; }
.sc-mfu-dropzone { border: 2px dashed var(--bs-border-color, #ced4da); border-radius: 0.5rem; padding: 1rem; text-align: center; cursor: pointer; color: var(--bs-secondary-color, #6c757d); transition: background 0.15s ease, border-color 0.15s ease; }
.sc-mfu-dropzone:hover { background: rgba(0,0,0,0.03); border-color: var(--bs-primary, #0d6efd); color: var(--bs-primary, #0d6efd); }
.sc-mfu-dropzone--active { border-color: var(--bs-primary, #0d6efd); color: var(--bs-primary, #0d6efd); background: rgba(13,110,253,0.08); }
.sc-mfu.sc-mfu-disabled, .sc-mfu.sc-mfu-uploading { opacity: 0.6; pointer-events: none; }
    `,
    onlyViews: [viewtemplate.name],
  },
];

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "multi-file-upload",
  viewtemplates: [viewtemplate],
  headers,
};
