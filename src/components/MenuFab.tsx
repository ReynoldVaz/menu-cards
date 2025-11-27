export function MenuFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      // className="fixed right-4 bottom-6 z-40 bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700"
      className="fixed right-4 bottom-6 z-40 text-white p-3 rounded-full shadow-lg hover:bg-orange-700"
      // style={{ backgroundColor: 'rgba(247, 107, 7, 0.81)' }}
      style={{ backgroundColor: 'rgba(247, 107, 7, 0.81)' }}
      title="Open navigation"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
