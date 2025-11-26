export function SideDrawer({ open, onClose, sections }: { open: boolean; onClose: () => void; sections: { id: string; title: string; icon?: string }[] }) {
  if (!open) return (
    <div aria-hidden />
  );

  function goTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const topOffset = 64; // small default; TopTabs will compute exact offset on desktop
    const rect = el.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - topOffset - 8;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-lg p-4 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Navigate</div>
          <button onClick={onClose} aria-label="Close" className="text-gray-600">✕</button>
        </div>
        <div className="space-y-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => goTo(s.id)}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-3"
            >
              {s.icon ? <span className="text-xl">{s.icon}</span> : null}
              <span className="font-medium">{s.title}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
