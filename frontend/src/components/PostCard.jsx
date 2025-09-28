// src/components/PostCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function PostCard({ post }) {
  const excerpt = post.excerpt || (post.content || "").replace(/<[^>]+>/g, "").slice(0, 140) + (post.excerpt ? "" : "...");
  return (
    <motion.article
      whileHover={{ y: -6 }}
      className="bg-white rounded-2xl shadow-md overflow-hidden"
    >
      {post.cover_image && (
        <Link to={`/posts/${post.slug || post.id}`}>
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-44 object-cover"
            loading="lazy"
          />
        </Link>
      )}

      <div className="p-4">
        <Link to={`/posts/${post.slug || post.id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">{post.title}</h3>
        </Link>

        <p className="text-sm text-gray-600 mt-2">{excerpt}</p>

        <div className="mt-3 text-xs text-gray-400">
          <span>By {post.author}</span> •{" "}
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.article>
  );
}
