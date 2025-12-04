Google Sheets template for menu-cards project

This folder contains two CSV files you can import into Google Sheets to provide live menu and events data compatible with the app's `useSheets` hook.

Files:
- `menu_items.csv` — menu rows with these headers (case-insensitive):
  - id — optional unique id
  - section — grouping (e.g., "Vegetarian Starters", "Mocktails")
  - name — item name
  - description — short description
  - price — price text (e.g., ₹150)
  - ingredients — optional comma-separated list of ingredients
  - image — optional thumbnail image URL
  - images — optional comma-separated image URLs (used by modal)
  - is_todays_special — optional boolean; set TRUE for the item that should appear as Today's Special

- `events.csv` — events rows with headers:
  - id, title, date, time, description, image

How to use (quick):
1. Open Google Sheets and create a new spreadsheet.
2. File → Import → Upload and choose `menu_items.csv`. Import into a new sheet and name the tab `menu_items` (or whatever you set in `VITE_MENU_SHEET_NAME`).
3. Repeat for `events.csv`, name the tab `events` (or set `VITE_EVENTS_SHEET_NAME` accordingly).
4. Copy the spreadsheet ID from the URL and set it in `.env` (VITE_SHEET_ID).
   - Example sheet URL: https://docs.google.com/spreadsheets/d/1AbCdEFghIJkLmnoPqRstUVWxyz12345/edit
   - Spreadsheet ID is the long token between `/d/` and `/edit` (e.g., `1AbCdEFghIJkLmnoPqRstUVWxyz12345`).
5. If the sheet is "Published to web" (File → Publish to web) you don't need an API key. Otherwise create a Google API key and set `VITE_SHEETS_API_KEY`.
6. Start the dev server: `npm run dev` and the app will poll the sheet by default every 30 seconds.

Tips & notes:
- Keep images hosted on a CDN or a static hosting service (S3, Cloudinary) for reliability. Put full URLs in `image`/`images` columns.
- Use the `is_todays_special` column (TRUE) to mark the special row. If multiple rows have TRUE the first match is used.
- If you need private data: do not put secrets in the sheet; use Apps Script to push to a backend instead.

If you'd like, I can also add a server-side proxy and caching layer (recommended for production) — tell me if you want that next.