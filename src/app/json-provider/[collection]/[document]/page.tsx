"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function JsonEditorPage() {
  const params = useParams();
  const collection = params.collection as string;
  const document = params.document as string;

  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch JSON
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/json-provider/${collection}/${document}`
        );

        const data = await res.json();

        setJsonText(JSON.stringify(data, null, 2));
      } catch (err) {
        setMessage("Failed to load JSON");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [collection, document]);

  // Save JSON
  async function handleSave() {
    try {
      const parsed = JSON.parse(jsonText);

      const res = await fetch(
        `/api/json-provider/${collection}/${document}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        }
      );

      if (!res.ok) throw new Error("Save failed");

      setMessage("✅ Saved successfully");
    } catch (err) {
      setMessage("❌ Invalid JSON or save failed");
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>
        JSON Editor: {collection}/{document}
      </h1>

      <textarea
        style={{
          width: "100%",
          height: "500px",
          fontFamily: "monospace",
          fontSize: 14,
        }}
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
      />

      <br />

      <button
        onClick={handleSave}
        style={{
          marginTop: 10,
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        Save
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}
