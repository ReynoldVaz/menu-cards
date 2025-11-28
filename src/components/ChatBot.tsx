import { useState, useEffect, useRef  } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown'; // <-- ADD THIS

interface ChatBotProps {
  menuSections: any[];
  todaysSpecial: any;
  events: any[];
}

export default function ChatBot({ menuSections, todaysSpecial, events }: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // const messagesEndRef = useRef(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};

const suggestionPrompts = [
  "What's today's special?",
  "Recommend a mocktail or dessert.",
  "Show me vegetarian dishes.",
  "Any ongoing events or offers?",
  "Suggest something popular from the menu."
];
const [showPrompts, setShowPrompts] = useState(true);

useEffect(() => {
  scrollToBottom();
}, [messages]);


    // 🔥 FIX SCROLL ISSUE
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }


    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  async function sendMessagex() {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { from: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
You are an AI restaurant assistant.

FORMAT RULES (IMPORTANT):
• ALWAYS respond using clean restaurant-style formatting.
• Group items by category using an emoji heading (e.g., 🥤 Mocktails).
• Use bullet points (•).
• Dish names MUST be bold.
• Prices MUST be bold (e.g., **₹150**).
• Include descriptions when available.
• Leave a blank line between sections.
• Do NOT write long paragraphs.
• Do NOT dump JSON.
• Be short, neat, and beautifully organized.

Here is the restaurant menu:

Today's Special:
${JSON.stringify(todaysSpecial)}

Menu Sections:
${JSON.stringify(menuSections)}

Events:
${JSON.stringify(events)}

User asked: "${userMsg}"

Now respond ONLY using the menu information.
      `;

      const result = await model.generateContent(prompt);

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: result.response.text() }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Sorry, something went wrong. Try again." }
      ]);
    }

    setLoading(false);
  }

async function sendMessage() {
  if (!input.trim()) return;

    // Hide prompts after first message
  if (showPrompts) setShowPrompts(false);

  const userMsg = input;
  setMessages(prev => [...prev, { from: "user", text: userMsg }]);
  setInput("");
  setLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg,
        menuSections,
        todaysSpecial,
        events
      })
    });

    const data = await res.json();

    setMessages(prev => [...prev, { from: "bot", text: data.reply }]);

  } catch (err) {
    setMessages(prev => [
      ...prev,
      { from: "bot", text: "Something went wrong. Try again." }
    ]);
  }

  setLoading(false);
}



  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(true)}
        // className="fixed bottom-20 right-4 bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition z-50"
        className="fixed bottom-20 right-4 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition z-50"
        // style={{ backgroundColor: 'rgba(249, 115, 22, 0.55)' }}
        style={{ backgroundColor: 'rgba(247, 107, 7, 0.81)' }}
      >
        💬
      </button>

      {/* Chat Popup */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-end z-50">
          <div className="bg-white w-full sm:w-96 h-[70vh] rounded-t-2xl shadow-xl flex flex-col">

            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-orange-50">
              <h2 className="text-lg font-semibold text-orange-700">AI Assistant</h2>
              <button onClick={() => setOpen(false)} className="text-gray-600 text-xl">✕</button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg max-w-[80%] whitespace-pre-line break-words ${
                    msg.from === "user" ? "bg-orange-100 ml-auto" : "bg-gray-100"
                  }`}
                >
                  {/* {msg.text} */}
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ))}

              {loading && <p className="text-sm text-gray-500">Thinking...</p>}

                {/* Dummy div to scroll to */}
  <div ref={messagesEndRef}></div>
            </div>


{showPrompts && (
  <div className="flex flex-wrap gap-2 p-2 border-t bg-orange-50">
    {suggestionPrompts.map((prompt, idx) => (
      <button
        key={idx}
        onClick={() => setInput(prompt)}
        className="bg-orange-100 hover:bg-orange-200 text-sm px-3 py-1 rounded-full"
      >
        {prompt}
      </button>
    ))}
  </div>
)}



            {/* Input Area */}
            <div className="p-3 border-t flex gap-2 bg-orange-50">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                placeholder="Ask about dishes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ------------

// import { useState, useEffect, useRef } from "react";
// import ReactMarkdown from "react-markdown";

// interface ChatBotProps {
//   menuSections: any[];
//   todaysSpecial: any;
//   events: any[];
// }

// export default function ChatBot({ menuSections, todaysSpecial, events }: ChatBotProps) {
//   const [open, setOpen] = useState(false);
//   const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // Auto-scroll
//   useEffect(() => {
//     const container = containerRef.current;
//     if (container) {
//       container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
//     }
//   }, [messages]);

//   // Prevent background scroll when chat is open
//   useEffect(() => {
//     document.body.style.overflow = open ? "hidden" : "auto";
//     return () => { document.body.style.overflow = "auto"; };
//   }, [open]);

//   async function sendMessage() {
//     if (!input.trim()) return;

//     const userMsg = input;
//     setMessages(prev => [...prev, { from: "user", text: userMsg }]);
//     setInput("");
//     setLoading(true);

//     try {
//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: userMsg, menuSections, todaysSpecial, events })
//       });
//       const data = await res.json();

//       // Fake streaming effect: append chars gradually
//       let botText = "";
//       for (const char of data.reply) {
//         botText += char;
//         setMessages(prev => [...prev.filter(m => m.from !== "bot"), { from: "bot", text: botText }]);
//         await new Promise(r => setTimeout(r, 5)); // adjust speed
//       }
//     } catch {
//       setMessages(prev => [...prev, { from: "bot", text: "Something went wrong. Try again." }]);
//     }

//     setLoading(false);
//   }

//   return (
//     <>
//       <button onClick={() => setOpen(true)}
//         className="fixed bottom-20 right-4 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition z-50"
//         style={{ backgroundColor: 'rgba(247, 107, 7, 0.81)' }}>💬</button>

//       {open && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-end z-50">
//           <div className="bg-white w-full sm:w-96 h-[70vh] rounded-t-2xl shadow-xl flex flex-col">

//             <div className="p-4 border-b flex justify-between items-center bg-orange-50">
//               <h2 className="text-lg font-semibold text-orange-700">AI Assistant</h2>
//               <button onClick={() => setOpen(false)} className="text-gray-600 text-xl">✕</button>
//             </div>

//             <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
//               {messages.map((msg, i) => (
//                 <div key={i} className={`p-2 rounded-lg max-w-[80%] whitespace-pre-line break-words ${msg.from === "user" ? "bg-orange-100 ml-auto" : "bg-gray-100"}`}>
//                   <ReactMarkdown>{msg.text}</ReactMarkdown>
//                 </div>
//               ))}
//               {loading && <p className="text-sm text-gray-500">Thinking...</p>}
//             </div>

//             <div className="p-3 border-t flex gap-2 bg-orange-50">
//               <input
//                 className="flex-1 border rounded-lg px-3 py-2 text-sm"
//                 placeholder="Ask about dishes..."
//                 value={input}
//                 onChange={e => setInput(e.target.value)}
//                 onKeyDown={e => e.key === "Enter" && sendMessage()}
//               />
//               <button onClick={sendMessage} className="bg-orange-600 text-white px-4 py-2 rounded-lg">➤</button>
//             </div>

//           </div>
//         </div>
//       )}
//     </>
//   );
// }
