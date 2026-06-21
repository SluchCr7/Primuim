"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useAppSelector } from "../../../lib/store";
import {
  useGetArticleBySlugQuery,
  useLikeArticleMutation,
  useCommentArticleMutation,
  useDeleteCommentMutation
} from "../../../lib/api";
import { useToast } from "../../components/Toast";
import { Calendar, User, ArrowLeft, Heart, Sparkles, Send, Trash2, Clock, Share2 } from "lucide-react";

export default function ArticleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [commentText, setCommentText] = useState("");

  const { data, isLoading, refetch } = useGetArticleBySlugQuery(id as string);
  const [likeArticle, { isLoading: isLiking }] = useLikeArticleMutation();
  const [commentArticle, { isLoading: isCommenting }] = useCommentArticleMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const article = data?.article;

  const handleLike = async () => {
    if (!isAuthenticated) {
      showToast("Please log in to like this article.", "error");
      return;
    }
    if (!article) return;

    try {
      const res = await likeArticle(article._id).unwrap();
      showToast(res.isLiked ? "Added to your favorites!" : "Removed from favorites.", "success");
      refetch();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to like article.", "error");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Please log in to leave a comment.", "error");
      return;
    }
    if (!commentText.trim() || !article) return;

    try {
      await commentArticle({ id: article._id, text: commentText }).unwrap();
      showToast("Comment published!", "success");
      setCommentText("");
      refetch();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to post comment.", "error");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!article) return;
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment({ articleId: article._id, commentId }).unwrap();
        showToast("Comment removed.", "success");
        refetch();
      } catch (err: any) {
        showToast("Failed to delete comment.", "error");
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.subtitle || "Read this interesting editorial piece on Shop Premium",
        url: window.location.href,
      }).then(() => {
        showToast("Article shared successfully!", "success");
      }).catch(err => {
        console.warn("Share cancelled or failed:", err);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", "success");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-4">
          <h2 className="font-serif text-2xl font-bold">Editorial Not Found</h2>
          <button
            onClick={() => router.push("/blog")}
            className="inline-flex h-11 items-center gap-2 rounded border border-card-border px-5 text-sm font-semibold hover:border-gold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const isLikedByUser = user && article.likes?.includes(user.id);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-3xl w-full px-6 py-12">
        <Breadcrumbs
          items={[
            { label: "Blog", url: "/blog" },
            { label: article.title.substring(0, 25) + "...", url: `/article/${id}` },
          ]}
        />

        {/* Post Meta */}
        <div className="mb-8 mt-4">
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted font-semibold uppercase tracking-wider mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gold" /> 
              {new Date(article.publishedAt || article.createdAt).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric"
              })}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-gold" /> 
              By {article.author?.storeName || article.authorName || "Editorial Staff"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gold" /> 
              {article.readTime || 1} min read
            </span>
            <span className="rounded-full bg-gold/10 text-gold px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-gold/10">
              {article.category}
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold leading-tight text-foreground">{article.title}</h1>
          {article.subtitle && (
            <p className="text-base font-light text-muted mt-2 leading-relaxed">{article.subtitle}</p>
          )}
        </div>

        {/* Post Cover */}
        <div className="h-[350px] rounded-3xl overflow-hidden border border-card-border mb-10 relative">
          <img
            src={article.image?.url || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800"}
            alt={article.title}
            className="h-full w-full object-cover saturate-50 hover:saturate-100 transition-all duration-500"
          />
        </div>

        {/* Post Content */}
        <div className="prose dark:prose-invert max-w-none text-sm font-light leading-relaxed text-muted flex flex-col gap-6">
          {article.content.split("\n\n").map((para: string, idx: number) => (
            <p key={idx} className="whitespace-pre-line">{para}</p>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-card-border pt-8 mt-12 flex justify-between items-center">
          <button
            onClick={() => router.push("/blog")}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-card-border px-5 text-xs font-semibold uppercase tracking-wider hover:border-gold transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-gold transition-colors cursor-pointer"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                isLikedByUser ? "text-error" : "text-muted hover:text-error"
              }`}
            >
              <Heart className={`h-4 w-4 ${isLikedByUser ? "fill-current" : ""}`} /> 
              {isLikedByUser ? "Liked" : "Like"} ({article.likes?.length || 0})
            </button>
          </div>
        </div>

        {/* Dynamic Comment Section */}
        <div className="mt-16 border-t border-card-border pt-10">
          <h3 className="font-serif font-bold text-lg mb-6">Thoughts ({article.comments?.length || 0})</h3>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-3 mb-8">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={isAuthenticated ? "Share your thoughts on this editorial..." : "Please login to join the discussion."}
              disabled={!isAuthenticated || isCommenting}
              className="flex-grow bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-gold"
            />
            <button
              type="submit"
              disabled={!isAuthenticated || isCommenting || !commentText.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 hover:bg-gold hover:text-luxury-white transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Comment list */}
          <div className="flex flex-col gap-6">
            {!article.comments || article.comments.length === 0 ? (
              <p className="text-xs text-muted font-light italic">No comments posted yet. Start the conversation!</p>
            ) : (
              article.comments.map((comment: any) => {
                const commentUser = comment.user;
                const isCommentOwner = user && (commentUser === user.id || commentUser?._id === user.id);
                const isArticleAuthor = user && article.author?._id === user.id;
                const isStaff = user && (user.role === "admin" || user.role === "moderator");
                const canDelete = isCommentOwner || isArticleAuthor || isStaff;

                return (
                  <div key={comment._id} className="bg-card-bg border border-card-border/50 p-4 rounded-2xl flex justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-foreground">{comment.username}</span>
                        <span className="text-[9px] text-muted font-light">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted font-light leading-relaxed">{comment.text}</p>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-muted hover:text-error self-start p-1 transition-colors cursor-pointer"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
