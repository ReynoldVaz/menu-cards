import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, menuSections, todaysSpecial, events } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // Shrink the menu before sending (makes AI more stable)
    const compressedMenu = JSON.stringify({
      specials: todaysSpecial,
      sections: menuSections.map(s => ({
        name: s.name,
        items: s.items?.map(i => ({
          name: i.name,
          price: i.price,
          desc: i.description
        }))
      })),
      events
    }).slice(0, 15000); // limit prompt size


    // const query = message.toLowerCase();

    // // Filter relevant sections
    // const filteredSections = menuSections.filter(section => {
    //   if (!section.title) return false; // skip if title missing
    //   return query.includes(section.title.toLowerCase());
    // });

    // const sectionsToSend = filteredSections.length ? filteredSections : menuSections;

    // // Shrink the menu
    // const compressedMenu = JSON.stringify({
    //   specials: todaysSpecial,
    //   sections: sectionsToSend.map(s => ({
    //     title: s.title,
    //     items: s.items?.map(i => ({
    //       name: i.name,
    //       price: i.price,
    //       desc: i.description
    //     }))
    //   })),
    //   events
    // }).slice(0, 15000); // limit prompt size


    const prompt = `
You are an AI restaurant assistant. Follow formatting rules strictly.

User asked: "${message}"

Use ONLY the menu data below:
${compressedMenu}
`;

    // 2 retries for stability
    let reply = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        reply = result.response.text();
        break;
      } catch (err) {
        if (attempt === 1) throw err;
      }
    }

    return res.status(200).json({ reply: reply || "Sorry, please try again." });

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// -----------------

// import { GoogleGenerativeAI } from "@google/generative-ai";

// function compressMenu(todaysSpecial, menuSections, events) {
//   // fallback to empty array if not provided
//   const specials = Array.isArray(todaysSpecial) ? todaysSpecial : [];
//   const sections = Array.isArray(menuSections) ? menuSections : [];
//   const evts = Array.isArray(events) ? events : [];

//   return JSON.stringify({
//     specials: specials.map(i => ({
//       name: i.name,
//       price: i.price
//     })),
//     sections: sections.map(s => ({
//       name: s.name,
//       items: s.items?.map(i => ({
//         name: i.name,
//         price: i.price
//       }))
//     })),
//     events: evts.map(e => ({ title: e.title, date: e.date }))
//   });
// }

// export default async function handler(req, res) {
//   if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

//   try {
//     const { message, menuSections, todaysSpecial, events } = req.body;
//     if (!message) return res.status(400).json({ error: "Message is required" });

//     const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
//     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//     // Compress menu before sending
//     const compressedMenu = compressMenu(todaysSpecial, menuSections, events).slice(0, 15000);

//     const prompt = `
// You are an AI restaurant assistant.

// User asked: "${message}"

// Use ONLY the menu data below:
// ${compressedMenu}

// Format:
// - Group items by section
// - Bold dish names & prices
// - Include descriptions when available
// - Short, clean, bullet style
// `;

//     // Single attempt only; faster
//     const result = await model.generateContent(prompt);
//     const reply = result.response.text();

//     res.status(200).json({ reply: reply || "Sorry, please try again." });

//   } catch (err) {
//     console.error("API ERROR:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }
