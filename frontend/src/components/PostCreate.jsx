// src/components/PostCreate.jsx
import React, { useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
// centralized axios instance (must be exported from src/api.js)
import { api } from "../api";
// keep axios for Cloudinary multipart upload (we don't use it for backend POST)
import axios from "axios";

const CLOUD_NAME = (process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "").trim();
const UPLOAD_PRESET = (process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "").trim();
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/upload`;

async function uploadToCloudinary(file, onProgress) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary config missing. Set REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET in .env");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);

  try {
    // let axios/browser set the Content-Type boundary automatically
    const resp = await axios.post(CLOUDINARY_URL, form, {
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          const percent = Math.round((evt.loaded * 100) / evt.total);
          onProgress(percent);
        }
      },
    });
    return resp.data.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err.response?.status, err.response?.data || err.message);
    throw new Error("Cloudinary upload failed: " + (err.response?.data?.error?.message || err.message));
  }
}

export default function PostCreate({ onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Upload image first (optional)
      let cover_image = "";
      if (file) {
        setUploadPct(1);
        cover_image = await uploadToCloudinary(file, (pct) => setUploadPct(pct));
        setUploadPct(100);
        console.debug("Cloudinary secure_url:", cover_image);
      }

      const payload = { title, content, excerpt, cover_image, category_ids: [], tag_ids: [] };

      // DEBUG: show token value from localStorage (remove in production)
      console.debug("localStorage accessToken:", localStorage.getItem("accessToken"));

      // IMPORTANT: use the centralized `api` instance so Authorization header and interceptors are applied
      const res = await api.post("/api/v1/posts/", payload);

      setTitle("");
      setContent("");
      setExcerpt("");
      setFile(null);
      setUploadPct(0);
      setLoading(false);

      alert("Post created!");
      onCreated?.(res.data);
    } catch (err) {
      setLoading(false);
      setUploadPct(0);
      console.error("Create post error:", err);
      if (err.response) {
        // server responded with JSON (400/401/500 etc)
        alert("Server error: " + JSON.stringify(err.response.data));
      } else if (err.message) {
        // network or other error
        alert("Upload/Create error: " + err.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 800, margin: "20px auto" }}>
      <h2>Create Post</h2>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
        style={{ width: "100%", margin: "8px 0", padding: 8 }}
      />

      <div style={{ margin: "8px 0" }}>
        <ReactQuill value={content} onChange={setContent} />
      </div>

      <input
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="Excerpt"
        style={{ width: "100%", margin: "8px 0", padding: 8 }}
      />

      <div style={{ margin: "8px 0" }}>
        <label>Cover image (optional)</label>
        <br />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        {file && <div>File: {file.name} ({Math.round(file.size / 1024)} KB)</div>}
        {uploadPct > 0 && uploadPct < 100 && <div>Uploading: {uploadPct}%</div>}
      </div>

      <button type="submit" disabled={loading} style={{ marginTop: 12 }}>{loading ? "Publishing..." : "Publish"}</button>

      <div style={{ marginTop: 12, color: "#666" }}>
        Tip: if you see token errors check that you've logged in and that the correct token is stored in localStorage.
      </div>
    </form>
  );
}
