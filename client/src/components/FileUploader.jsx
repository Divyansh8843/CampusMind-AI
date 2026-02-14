export default function FileUploader() {
  const upload = async (e) => {
    const file = e.target.files[0];
    const data = new FormData();
    data.append("file", file);

    await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      body: data,
    });
    alert("Uploaded & Indexed");
  };

  return <input type="file" onChange={upload} />;
}
