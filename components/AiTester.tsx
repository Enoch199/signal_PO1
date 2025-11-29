import { useState } from "react";
import { askAI } from "../services/aiService";

export default function AiTester() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  async function handleAsk() {
    const result = await askAI(input);
    setResponse(JSON.stringify(result, null, 2));
  }

  return (
    <div className="p-4 space-y-4">
      <input
        className="border p-2 w-full"
        placeholder="Écris un prompt"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        className="bg-blue-600 text-white p-2 rounded"
        onClick={handleAsk}
      >
        Envoyer à l’IA
      </button>

      <pre className="bg-black text-green-400 p-4 rounded">
        {response}
      </pre>
    </div>
  );
}
