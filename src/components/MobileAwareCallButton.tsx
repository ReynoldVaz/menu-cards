import { useEffect, useState } from "react";

function MobileAwareCallButton() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobileCheck = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
  }, []);

  return isMobile ? (
    <a
      href="tel:+919233456789"
      className="inline-block bg-orange-600 text-white mt-4 px-5 py-2 rounded-full text-sm font-medium shadow-md hover:bg-orange-700 transition-all"
    >
      📞 +91 9233456789
    </a>
  ) : (
    <button
      disabled
      className="inline-block bg-gray-300 text-gray-600 mt-4 px-5 py-2 rounded-full text-sm font-medium shadow-md cursor-not-allowed opacity-70"
    >
      📞 +91 9233456789
    </button>
  );
}
