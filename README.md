# Multi File Upload View Template

This plugin provides a **Multi file upload** view template for Saltcorn. It lets users upload several files into a child table linked to the current record, show existing files, and optionally delete both the child rows and the stored files.

## Requirements

1. **Parent table** – the view belongs to the table that holds the main record (e.g. `projects`).
2. **Child table** – a table that stores files (e.g. `project_files`) with:
   - a foreign-key field pointing to the parent table
   - a `File` or `File[]` field for the uploaded file(s)

Once this relation exists, it will be selectable when configuring the view.

## Configure the view

Key options in the view configuration:

- **Child relation** – which foreign key links to the parent record.
- **File field** – which `File`/`File[]` column stores the uploads.
- **Upload folder** – optional subfolder in the Files area.
- **Minimum role to read files** – access level for uploaded files.
- **Upload UI** – choose between multiple file input, drag & drop, or FilePond.
- **Show existing files** – list current child rows above the uploader.
- **Allow deleting files** – show a delete icon next to each file.
- **Remove stored file when deleting** – also delete the underlying file from storage.

## How to use

1. Create the parent and child tables and their relation.
2. Create a new view of type **Multi file upload** on the parent table and configure it.
3. Embed this **Multi file upload** view into the parent table's **Show** or **Edit** view where users should upload files.
4. Save a parent record, then upload files; check that the list updates and deletion behaves as expected.