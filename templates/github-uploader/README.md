GitHub image uploader (Apps Script)

Overview

This guide shows how to let the sheet owner upload images directly into a dedicated public GitHub repo and write the raw.githubusercontent.com URL back into the sheet. This produces stable, embeddable raw URLs that will work in your site.

High level

1. Create a public GitHub repo (example: `your-org/menu-card-images`).
2. Create a GitHub Personal Access Token (classic) with the `public_repo` scope (or `repo` for private repos).
3. In the Google Sheet, open Extensions → Apps Script and add the provided `Code.gs` and `UploadDialog.html` files.
4. Set the token (and other settings) in the Script Properties (do not store tokens in the sheet itself).
5. Run the `showUploadDialog()` function from the Apps Script editor once to authorize.
6. Use the dialog to choose an image, upload to GitHub, and the script will write the raw URL into the active cell or a configurable column.

Why use GitHub raw?

- Raw files served from `raw.githubusercontent.com` are embeddable in <img> tags.
- Public repo storage is effectively unlimited for small projects; costs are free but subject to GitHub rate limits and fair-use policies.

Caveats

- This approach requires a GitHub account and a Personal Access Token (PAT). Keep the PAT secret.
- GitHub rate limits apply. For heavy traffic or many uploads, consider a CDN-backed storage (Cloudflare R2 or S3).
- Files are stored in the repo's history; if you want binary-only storage without history growth consider GitHub Releases or an external storage.

Files in this folder

- `Code.gs` – Apps Script server-side code to accept base64 image data and create/update a file in your GitHub repo, then write the raw URL back to the sheet.
- `UploadDialog.html` – A tiny upload dialog UI that converts a file to base64 and sends to Apps Script.

Security

Store your PAT in Script Properties (Project Settings → Script properties). Example keys:
- GITHUB_OWNER
- GITHUB_REPO
- GITHUB_BRANCH (default: main)
- GITHUB_TOKEN (PAT)
- UPLOAD_PATH_PREFIX (optional, default: "images/")

Make sure the repo is the one you control, and never commit your PAT into code or the sheet.

Next steps

- Install the Apps Script into the sheet(s) you use to manage images.
- Test an image upload and paste the returned raw URL into the sheet cell for that item.
- Restart your dev server and confirm the image loads on the site.

If you want, I can: add this uploader into your template CSV/README, create a GitHub Action to resize/optimize images after upload, or implement an automatic PR flow instead of direct-commit uploads.
