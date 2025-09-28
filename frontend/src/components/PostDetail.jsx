// src/components/PostDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import DOMPurify from "dompurify";

export default function PostDetail() {
  const { slugOrId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/posts/${slugOrId}/`);
        setPost(res.data);
      } catch (err) {
        console.error("Failed to load post:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slugOrId]);

  if (loading) return <div className="max-w-4xl mx-auto p-4">Loading…</div>;
  if (!post) return <div className="max-w-4xl mx-auto p-4">Post not found</div>;

  return (
    <article className="max-w-4xl mx-auto bg-white rounded p-6 shadow">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <div className="text-sm text-gray-500 mb-4">By {post.author} • {new Date(post.created_at).toLocaleString()}</div>

      {post.cover_image && (
        <img src={post.cover_image} alt={post.title} className="w-full h-72 object-cover rounded mb-6" />
      )}

      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || "") }} />
    </article>
  );
}
