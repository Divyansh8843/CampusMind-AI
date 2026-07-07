export default function FileUploader() {
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: data,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    alert("Uploaded and indexed successfully");
  };

  return <input type="file" accept=".pdf,.docx,.txt,.md,.csv,.json" onChange={upload} />;
}
