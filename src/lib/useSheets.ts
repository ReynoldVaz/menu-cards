import { useCallback, useEffect, useState } from 'react';
import type { MenuItem, MenuSection, Event } from '../data/menuData';
import {
  menuSections as localMenuSections,
  todaysSpecial as localTodaysSpecial,
  upcomingEvents as localUpcomingEvents,
} from '../data/menuData';

type SheetsHook = {
  menuSections: MenuSection[];
  todaysSpecial: MenuItem;
  upcomingEvents: Event[];
  loading: boolean;
  error?: string;
  refresh: () => void;
  lastFetchedAt?: string | null;
  lastFetchedRaw?: { menuRows?: any[]; eventsRows?: any[] } | null;
  sheetId?: string | null;
  usingApiKey?: boolean;
};

function rowsToObjects(values: any[][]) {
  if (!values || values.length === 0) return [] as Array<Record<string, string>>;
  const headers = values[0].map((h: any) => String(h).trim().toLowerCase());
  return values.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i] !== undefined && row[i] !== null ? String(row[i]) : '';
    }
    return obj;
  });
}

function normalizeImageUrl(raw?: string) {
  if (!raw) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  // If the cell contains a Sheets IMAGE() formula like =IMAGE("https://...") or =IMAGE('https://...'), extract the URL
  const imageFormulaMatch = s.match(/=IMAGE\((?:"|')?(https?:\/\/[^"')]+)(?:"|')?\)/i);
  if (imageFormulaMatch) {
    return imageFormulaMatch[1];
  }
  // Drive shared file link formats:
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  const driveFileMatch = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (driveFileMatch) {
    const id = driveFileMatch[1];
    // prefer export=download which often serves the raw image bytes
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }

  // direct export links (already good)
  if (s.startsWith('http')) {
    // cloudinary: inject basic automatic transformations for better delivery
    const cloudMatch = s.match(/(https?:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)(.*)/i);
    if (cloudMatch) {
      const prefix = cloudMatch[1];
      const rest = cloudMatch[2];
      // add automatic format/quality and a sensible width
      return `${prefix}f_auto,q_auto,w_800/${rest}`;
    }
    return s;
  }

  return s;
}

async function fetchSheetValues(spreadsheetId: string, sheetName: string, apiKey?: string) {
  if (!spreadsheetId) throw new Error('Missing spreadsheet id');
  // If no apiKey provided, try the public published CSV endpoint later (not implemented here).
  if (apiKey) {
    const range = encodeURIComponent(`${sheetName}!A:Z`);
    const keyPart = `?key=${apiKey}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}${keyPart}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sheets API error (${res.status})`);
    const json = await res.json();
    return json.values as any[][];
  }

  // No API key: try the "Publish to web" CSV endpoint.
  // Format: https://docs.google.com/spreadsheets/d/{id}/gviz/tq?tqx=out:csv&sheet={sheetName}
  const sheetParam = encodeURIComponent(sheetName);
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetParam}`;
  const resCsv = await fetch(csvUrl);
  if (!resCsv.ok) throw new Error(`Published CSV fetch error (${resCsv.status})`);
  const text = await resCsv.text();
  // parse CSV text to 2D array
  return parseCsvToRows(text);
}

function parseCsvToRows(text: string): string[][] {
  // Simple CSV parser that handles quoted fields and newlines.
  const rows: string[][] = [];
  let cur = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        // escaped quote
        cur += '"';
        i++; // skip next
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      // handle CRLF
      if (cur !== '' || row.length > 0) {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      }
      // if CRLF skip the LF after CR
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else {
      cur += ch;
    }
  }
  // push remaining
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  // trim potential empty trailing row caused by newline
  if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
  return rows;
}

export function useSheetsData(): SheetsHook {
  const sheetId = (import.meta.env.VITE_SHEET_ID as string) || '';
  const apiKey = (import.meta.env.VITE_SHEETS_API_KEY as string) || '';
  const menuSheet = (import.meta.env.VITE_MENU_SHEET_NAME as string) || 'menu_items';
  const eventsSheet = (import.meta.env.VITE_EVENTS_SHEET_NAME as string) || 'events';
  const pollMs = Number(import.meta.env.VITE_SHEETS_POLL_INTERVAL_MS || '30000');

  const [menuSections, setMenuSections] = useState<MenuSection[]>(localMenuSections);
  const [todaysSpecial, setTodaysSpecial] = useState<MenuItem>(localTodaysSpecial);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>(localUpcomingEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [lastFetchedRaw, setLastFetchedRaw] = useState<{ menuRows?: any[]; eventsRows?: any[] } | null>(null);

  const parseMenu = useCallback((rows: any[][]) => {
    const objs = rowsToObjects(rows);
    // expected columns: id, section, name, description, price, ingredients, image, images, is_todays_special
    const items: MenuItem[] = objs.map((o) => {
      const imgs = o.images ? String(o.images).split(',').map((s) => normalizeImageUrl(s)).filter(Boolean) : undefined;
      const thumb = normalizeImageUrl(o.image);
      return {
        name: o.name || 'Unnamed',
        description: o.description || '',
        price: o.price || '',
        ingredients: o.ingredients ? String(o.ingredients).split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        image: thumb || (imgs && imgs.length > 0 ? imgs[0] : undefined),
        images: imgs,
      } as MenuItem;
    });

    // group by section
    const sectionsMap: Record<string, MenuItem[]> = {};
    objs.forEach((o, idx) => {
      const section = (o.section && o.section.trim()) || 'Menu';
      if (!sectionsMap[section]) sectionsMap[section] = [];
      sectionsMap[section].push(items[idx]);
    });

    const sections: MenuSection[] = Object.keys(sectionsMap).map((k, i) => ({
      id: `sheet-${i}-${k.replace(/\s+/g, '-')}`,
      title: k,
      items: sectionsMap[k],
    }));

    // find today's special
    const specialRow = objs.find((o) => String(o.is_todays_special || '').toLowerCase() === 'true');
    const special = specialRow
      ? {
          name: specialRow.name || 'Special',
          description: specialRow.description || '',
          price: specialRow.price || '',
          ingredients: specialRow.ingredients ? specialRow.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
          image: normalizeImageUrl(specialRow.image) || undefined,
          images: specialRow.images ? String(specialRow.images).split(',').map((s) => normalizeImageUrl(s)).filter(Boolean) : undefined,
        }
      : undefined;

    return { sections, special };
  }, []);

  const parseEvents = useCallback((rows: any[][]) => {
    const objs = rowsToObjects(rows);
    const evts: Event[] = objs.map((o) => ({
      id: o.id || `${o.title || 'evt'}-${Math.random().toString(36).slice(2, 7)}`,
      title: o.title || 'Event',
      date: o.date || '',
      time: o.time || '',
      description: o.description || '',
      image: o.image || undefined,
    }));
    return evts;
  }, []);

  const fetchAll = useCallback(async () => {
    if (!sheetId) {
        // no sheet configured, keep local data
        // eslint-disable-next-line no-console
        console.log('[useSheets] no VITE_SHEET_ID configured; using local data fallback');
        return;
      }

    setLoading(true);
    setError(undefined);
    try {
      // fetch menu and events in parallel
  // eslint-disable-next-line no-console
  console.log('[useSheets] fetching sheets', { sheetId, menuSheet, eventsSheet, usingApiKey: !!apiKey });
      const [menuRows, eventsRows] = await Promise.all([
        fetchSheetValues(sheetId, menuSheet, apiKey).catch((err) => {
          throw new Error(`Menu fetch failed: ${err.message}`);
        }),
        fetchSheetValues(sheetId, eventsSheet, apiKey).catch((err) => {
          throw new Error(`Events fetch failed: ${err.message}`);
        }),
      ]);

  // eslint-disable-next-line no-console
  console.log('[useSheets] fetched rows', { menuRowsLength: menuRows?.length, eventsRowsLength: eventsRows?.length });

  const { sections, special } = parseMenu(menuRows);
  const evts = parseEvents(eventsRows);

  // store debug info
  setLastFetchedAt(new Date().toISOString());
  setLastFetchedRaw({ menuRows: menuRows?.slice?.(0, 6) || [], eventsRows: eventsRows?.slice?.(0, 6) || [] });

      if (sections && sections.length > 0) setMenuSections(sections);
      if (special) setTodaysSpecial(special as MenuItem);
      setUpcomingEvents(evts);
    } catch (err: any) {
      const msg = String(err?.message || err);
      setError(msg);
      // log error for debugging
      // eslint-disable-next-line no-console
      console.error('[useSheets] fetchAll error:', msg, err);
      // keep previous data as fallback
    } finally {
      setLoading(false);
    }
  }, [sheetId, apiKey, menuSheet, eventsSheet, parseMenu, parseEvents]);

  // initial fetch and polling
  useEffect(() => {
    let mounted = true;
    if (!sheetId) return;
    fetchAll();
    const id = setInterval(() => {
      if (!mounted) return;
      fetchAll();
    }, pollMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [sheetId, fetchAll, pollMs]);

  return {
    menuSections,
    todaysSpecial,
    upcomingEvents,
    loading,
    error,
    refresh: fetchAll,
    lastFetchedAt,
    lastFetchedRaw,
    sheetId,
    usingApiKey: !!apiKey,
  };
}
