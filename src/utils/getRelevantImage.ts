// Always returns a valid image for dish name
export async function getRelevantImage(dishName: string): Promise<string> {
  const q = encodeURIComponent(dishName.trim());

  // --- STEP 1: DuckDuckGo Image Search ---
  try {
    const res = await fetch(`https://duckduckgo.com/i.js?q=${q}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results?.length > 0 && data.results[0].image) {
        return data.results[0].image;
      }
    }
  } catch (e) {
    console.log("DuckDuckGo failed, trying Wikipedia...");
  }

  // --- STEP 2: Wikipedia thumbnail ---
  try {
    const wiki = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=400&titles=${q}`
    );
    const data = await wiki.json();
    const pages = data.query.pages;
    const page = pages[Object.keys(pages)[0]];

    if (page?.thumbnail?.source) {
      return page.thumbnail.source;
    }
  } catch (e) {
    console.log("Wikipedia failed, using placeholder...");
  }

  // --- STEP 3: Guaranteed fallback ---
  return `https://dummyimage.com/600x400/000/fff&text=${q}`;
}
