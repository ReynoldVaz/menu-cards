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
    const { restaurantId } = req.query;
    if (!restaurantId) {
      return res.status(400).json({ error: "Missing restaurantId" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsDataClient = google.analyticsdata({
      version: "v1beta",
      auth,
    });

    // Filter for event_label starting with restaurantId|
    const response = await analyticsDataClient.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dimensions: [
          { name: "eventName" },
          { name: "customEvent:event_label" },
        ],
        metrics: [
          { name: "eventCount" },
        ],
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensionFilter: {
          filter: {
            stringFilter: {
              matchType: "BEGINS_WITH",
              value: `${restaurantId}|`,
            },
            fieldName: "customEvent:event_label",
          },
        },
      },
    });
    console.log("GA4 Response:", response);
    console.log("GA4 Response data:", response.data);

    // Convert GA4 rows -> { itemName: clicks }
    const rows = response.data.rows || [];
    const itemClicks = {};
    rows.forEach((row) => {
      // event_label is `${restaurantId}|${itemName}`
      const eventLabel = row.dimensionValues[1]?.value || "";
      const [eventRestaurantId, ...itemNameParts] = eventLabel.split("|");
      const itemName = itemNameParts.join("|");
      const count = Number(row.metricValues[0]?.value || 0);
      // Only count events for the requested restaurantId
      if (eventRestaurantId === restaurantId && itemName) {
        if (!itemClicks[itemName]) itemClicks[itemName] = 0;
        itemClicks[itemName] += count;
      }
    });
    return res.status(200).json(itemClicks);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch analytics", details: err });
  }
}
