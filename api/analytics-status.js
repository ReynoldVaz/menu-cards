export default async function handler(req, res) {
  try {
    const hasProperty = !!process.env.GA4_PROPERTY_ID;
    const hasKey = !!process.env.GA_SERVICE_ACCOUNT_KEY;
    res.status(200).json({
      ok: true,
      route: "/api/analytics/status",
      env: {
        GA4_PROPERTY_ID: hasProperty ? "present" : "missing",
        GA_SERVICE_ACCOUNT_KEY: hasKey ? "present" : "missing",
      },
      hint: "If this works but /api/analytics fails, check GA4 custom dimensions and service account permissions.",
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
