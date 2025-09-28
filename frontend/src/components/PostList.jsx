// src/components/PostList.jsx
import React, { useEffect, useState } from "react";
import { api } from "../api";
import PostCard from "./PostCard"; // make sure PostCard.jsx exists in same folder

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [next, setNext] = useState(null);
  const [prev, setPrev] = useState(null);
  const [page, setPage] = useState(1);

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/posts/", { params: { page: p } });
      const data = res.data;
      if (Array.isArray(data)) {
        setPosts(data);
        setNext(null);
        setPrev(null);
      } else {
        setPosts(data.results || []);
        setNext(data.next);
        setPrev(data.previous);
      }
      setPage(p);
    } catch (err) {
      console.error("Error loading posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Latest posts</h2>
      </div>

      {loading ? (
        <div>Loading posts…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button onClick={() => load(page - 1)} disabled={!prev} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50">Previous</button>
        <div>Page {page}</div>
        <button onClick={() => load(page + 1)} disabled={!next} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
