// // api/analytics.js
// import { google } from "googleapis";

// console.log("GA4_PROPERTY_ID:", process.env.GA4_PROPERTY_ID);
// console.log("GA_SERVICE_ACCOUNT_KEY:", process.env.GA_SERVICE_ACCOUNT_KEY ? "Loaded" : "Missing");


// const propertyId = process.env.GA4_PROPERTY_ID; // GA4 Property ID
// const keyFile = JSON.parse(process.env.GA_SERVICE_ACCOUNT_KEY); // Service account JSON stored as env variable

// export default async function handler(req, res) {
//   try {
//     const auth = new google.auth.GoogleAuth({
//       credentials: keyFile,
//       scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
//     });

//     const analyticsDataClient = google.analyticsdata({
//       version: "v1beta",
//       auth,
//     });

//     const response = await analyticsDataClient.properties.runReport({
//       property: `properties/${propertyId}`,
//       requestBody: {
//         dimensions: [{ name: "eventName" }],
//         metrics: [{ name: "eventCount" }],
//         dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
//         dimensionFilter: {
//           filter: {
//             stringFilter: {
//               matchType: "EXACT",
//               value: "Click Item", // Example, can fetch multiple events if needed
//             },
//             fieldName: "eventName",
//           },
//         },
//       },
//     });

//     res.status(200).json(response.data);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch analytics data" });
//   }
// }


// api/analytics.js


import { google } from "googleapis";

console.log("GA4_PROPERTY_ID:", process.env.GA4_PROPERTY_ID);
console.log(
  "GA_SERVICE_ACCOUNT_KEY:",
  process.env.GA_SERVICE_ACCOUNT_KEY ? "Loaded" : "Missing"
);

const propertyId = process.env.GA4_PROPERTY_ID; // GA4 Property ID
const keyFile = JSON.parse(process.env.GA_SERVICE_ACCOUNT_KEY); // Service account JSON stored as env variable

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsDataClient = google.analyticsdata({
      version: "v1beta",
      auth,
    });

    const response = await analyticsDataClient.properties.runReport({
    // const response = await analyticsDataClient.properties.runRealtimeReport({
      property: `properties/${propertyId}`,
      requestBody: {
        // dimensions: [{ name: "eventName" }], // grouping by event name
        dimensions: [
          { name: "eventName" },    // Top-level event
            // { name: "menu_item" },   // Nested parameter, e.g., menu item name
          //  { name: "customEvent:menu_item" }  // API name from GA4 Custom Dimension
          { name: "customEvent:event_label" },   // Nested parameter, e.g., menu item name
        // { name: "eventParameter:event_label" }
        ],
        metrics: [
            { name: "eventCount" },

        ],   // count of each event
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        // Removed dimensionFilter to fetch all events
      },
    });

    // return res.status(200).json(response.data);

    // ⭐ Convert GA4 rows -> { itemName: clicks }
    const rows = response.data.rows || [];

    const itemClicks = {};

    rows.forEach((row) => {
      const eventName = row.dimensionValues[0]?.value || "";
      const itemName = row.dimensionValues[1]?.value || "";
      const count = Number(row.metricValues[0]?.value || 0);

      if (eventName === "Click Item" && itemName) {
        if (!itemClicks[itemName]) itemClicks[itemName] = 0;
        itemClicks[itemName] += count;
      }
    });

    return res.status(200).json(itemClicks);

  } catch (err) {
    console.error(err);
    // res.status(500).json({ error: "Failed to fetch analytics data", details: err });

     return res.status(500).json({ error: "Failed to fetch analytics", details: err });
  }
}
