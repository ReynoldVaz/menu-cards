// src/lib/ga.ts
export const trackPageview = (path: string) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', { page_path: path });
  }
};

export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
};
