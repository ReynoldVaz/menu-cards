// Apps Script server-side code for uploading base64 images to a GitHub repo
// Configure via Project -> Project Properties -> Script properties:
// GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH (default main), GITHUB_TOKEN, UPLOAD_PATH_PREFIX (default images/)

function showUploadDialog() {
  const html = HtmlService.createHtmlOutputFromFile('UploadDialog')
    .setWidth(400)
    .setHeight(200);
  SpreadsheetApp.getUi().showModalDialog(html, 'Upload image to GitHub');
}

function uploadImageToGitHub(base64Data, filename) {
  // read config from script properties
  const props = PropertiesService.getScriptProperties();
  const owner = props.getProperty('GITHUB_OWNER');
  const repo = props.getProperty('GITHUB_REPO');
  const branch = props.getProperty('GITHUB_BRANCH') || 'main';
  const token = props.getProperty('GITHUB_TOKEN');
  const prefix = props.getProperty('UPLOAD_PATH_PREFIX') || 'images/';

  if (!owner || !repo || !token) {
    throw new Error('Missing GITHUB_OWNER, GITHUB_REPO or GITHUB_TOKEN in Script Properties');
  }

  // strip data: prefix if present
  const content = base64Data.replace(/^data:[^;]+;base64,/, '');
  const path = prefix + filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

  const payload = {
    message: `Add image ${filename}`,
    content: content,
    branch: branch
  };

  const options = {
    method: 'put',
    contentType: 'application/json',
    headers: {
      Authorization: 'token ' + token,
      'User-Agent': 'Google-Apps-Script'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const resp = UrlFetchApp.fetch(url, options);
  const code = resp.getResponseCode();
  const body = resp.getContentText();
  let json = {};
  try { json = JSON.parse(body); } catch (e) { /* fallthrough */ }
  if (code >= 400) {
    throw new Error(`GitHub upload failed: ${json.message || body}`);
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

  // Optionally write the URL back to the active cell in the active sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const cell = sheet.getActiveCell();
  if (cell) cell.setValue(rawUrl);

  return rawUrl;
}
