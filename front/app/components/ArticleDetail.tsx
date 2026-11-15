"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, Heart, MessageCircle, Send, Share2, Trash2, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import Breadcrumbs from "./Breadcrumbs";
import { useAppSelector } from "@/lib/store";
import {
  useCommentArticleMutation,
  useDeleteCommentMutation,
  useGetArticleBySlugQuery,
  useLikeArticleMutation,
} from "@/redux/api";
import { useToast } from "./Toast";

interface ArticleComment {
  _id: string;
  user?: string | { _id?: string } | null;
  username?: string;
  text: string;
  createdAt?: string;
}

interface Article {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  category?: string;
  image?: { url?: string } | null;
  authorName?: string;
  author?: {
    _id?: string;
    username?: string;
    storeName?: string;
    brandName?: string;
  } | null;
  createdAt?: string;
  publishedAt?: string;
  readTime?: number;
  views?: number;
  likes?: string[];
  comments?: ArticleComment[];
}

function getArticleContent(content: string): ReactNode[] {
  return content
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const heading = block.match(/^#{1,3}\s+(.+)$/);
      if (heading) {
        return (
          <h2 key={index} className="font-serif text-2xl font-medium leading-tight text-foreground sm:text-3xl">
            {heading[1]}
          </h2>
        );
      }

      const lines = block.split(/\r?\n/);
      if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
        return (
          <ul key={index} className="list-disc space-y-3 pl-6 text-base leading-8 text-muted marker:text-gold">
            {lines.map((line, lineIndex) => (
              <li key={lineIndex}>{line.replace(/^\s*[-*]\s+/, "")}</li>
            ))}
          </ul>
        );
      }

      if (lines.every((line) => /^\s*>\s?/.test(line))) {
        return (
          <blockquote key={index} className="border-l-2 border-gold pl-6 font-serif text-xl italic leading-8 text-foreground">
            {lines.map((line) => line.replace(/^\s*>\s?/, "")).join(" ")}
          </blockquote>
        );
      }

      return (
        <p key={index} className="text-base leading-8 text-muted sm:text-lg sm:leading-9">
          {lines.map((line, lineIndex) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    });
}

export default function ArticleDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [commentText, setCommentText] = useState("");

  const { data, isLoading, isError, refetch } = useGetArticleBySlugQuery(id, { skip: !id });
  const [likeArticle, { isLoading: isLiking }] = useLikeArticleMutation();
  const [commentArticle, { isLoading: isCommenting }] = useCommentArticleMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const article = data?.article as Article | undefined;
  const comments = article?.comments || [];
  const dateFormatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: "long" });

  const handleLike = async () => {
    if (!isAuthenticated) {
      showToast(t("articles.login_to_like"), "error");
      return;
    }
    if (!article) return;

    try {
      const response = await likeArticle(article._id).unwrap();
      showToast(response.isLiked ? t("articles.liked_success") : t("articles.unliked_success"), "success");
      refetch();
    } catch (error) {
      console.error("Could not update article like:", error);
      showToast(t("articles.like_error"), "error");
    }
  };

  const handleAddComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      showToast(t("articles.login_to_comment"), "error");
      return;
    }
    if (!commentText.trim() || !article) return;

    try {
      await commentArticle({ id: article._id, text: commentText.trim() }).unwrap();
      showToast(t("articles.comment_success"), "success");
      setCommentText("");
      refetch();
    } catch (error) {
      console.error("Could not publish article comment:", error);
      showToast(t("articles.comment_error"), "error");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!article || !window.confirm(t("articles.confirm_delete_comment"))) return;

    try {
      await deleteComment({ articleId: article._id, commentId }).unwrap();
      showToast(t("articles.comment_deleted"), "success");
      refetch();
    } catch (error) {
      console.error("Could not delete article comment:", error);
      showToast(t("articles.delete_comment_error"), "error");
    }
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.subtitle || t("articles.share_description"),
          url: window.location.href,
        });
        showToast(t("articles.share_success"), "success");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast(t("articles.link_copied"), "success");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Could not share article:", error);
      showToast(t("articles.share_error"), "error");
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl animate-pulse">
          <div className="mx-auto h-3 w-28 bg-muted-light" />
          <div className="mx-auto mt-8 h-12 w-4/5 bg-muted-light" />
          <div className="mx-auto mt-4 h-4 w-2/3 bg-muted-light" />
          <div className="mt-10 aspect-[16/8] bg-muted-light" />
          <div className="mx-auto mt-12 max-w-2xl space-y-4">
            <div className="h-4 w-full bg-muted-light" />
            <div className="h-4 w-full bg-muted-light" />
            <div className="h-4 w-4/5 bg-muted-light" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !article) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-24 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold">{t("articles.not_found_eyebrow")}</p>
        <h1 className="mt-4 font-serif text-3xl font-medium">{t("articles.not_found_title")}</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted">{t("articles.not_found_description")}</p>
        <Link
          href="/blog"
          className="mt-8 inline-flex min-h-11 items-center gap-2 bg-foreground px-5 text-xs font-medium uppercase tracking-[0.14em] text-background transition-colors hover:bg-gold"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {t("articles.back_to_blog")}
        </Link>
      </main>
    );
  }

  const authorName =
    article.author?.storeName ||
    article.author?.brandName ||
    article.authorName ||
    article.author?.username ||
    t("articles.editorial_team");
  const isLikedByUser = Boolean(user?.id && article.likes?.includes(user.id));
  const readTime =
    article.readTime || Math.max(1, Math.ceil(article.content.trim().split(/\s+/).length / 200));

  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-8 sm:px-8 sm:pt-10 lg:px-12">
        <Breadcrumbs
          items={[
            { label: t("articles.blog"), url: "/blog" },
            { label: article.title, url: `/blog/${id}` },
          ]}
        />

        <article className="mt-8">
          <header className="mx-auto max-w-4xl py-8 text-center sm:py-12">
            <span className="inline-flex border border-gold/40 px-3 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-gold">
              {article.category || t("articles.editorial")}
            </span>
            <h1 className="mt-6 font-serif text-4xl font-medium leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                {article.subtitle}
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              <span className="inline-flex items-center gap-2">
                <UserRound aria-hidden="true" className="h-4 w-4 text-gold" />
                {t("articles.by")} {authorName}
              </span>
              {(article.publishedAt || article.createdAt) && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="h-4 w-4 text-gold" />
                  {dateFormatter.format(new Date(article.publishedAt || article.createdAt!))}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <Clock3 aria-hidden="true" className="h-4 w-4 text-gold" />
                {t("articles.read_time", { count: readTime })}
              </span>
              <span>{t("articles.views", { count: article.views || 0 })}</span>
            </div>
          </header>

          <div className="relative mx-auto aspect-[16/8] max-h-[620px] max-w-6xl overflow-hidden bg-muted-light">
            {article.image?.url ? (
              <Image
                src={article.image.url}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1200px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#d8c6aa] to-[#89765f]" />
            )}
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-10 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-16">
            <aside className="flex flex-row items-center gap-3 border-b border-card-border pb-5 lg:sticky lg:top-8 lg:h-fit lg:flex-col lg:items-stretch lg:border-b-0 lg:pb-0">
              <p className="hidden text-[9px] font-medium uppercase tracking-[0.2em] text-muted lg:block">
                {t("articles.share_article")}
              </p>
              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex min-h-10 items-center justify-center gap-2 border border-card-border px-4 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors hover:border-gold hover:text-gold"
              >
                <Share2 aria-hidden="true" className="h-4 w-4" /> {t("articles.share")}
              </button>
              <button
                type="button"
                onClick={() => void handleLike()}
                disabled={isLiking}
                aria-pressed={isLikedByUser}
                className={`inline-flex min-h-10 items-center justify-center gap-2 border px-4 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors disabled:opacity-60 ${
                  isLikedByUser ? "border-error/40 text-error" : "border-card-border hover:border-gold hover:text-gold"
                }`}
              >
                <Heart aria-hidden="true" className={`h-4 w-4 ${isLikedByUser ? "fill-current" : ""}`} />
                {isLikedByUser ? t("articles.liked") : t("articles.like")} ({article.likes?.length || 0})
              </button>
              <Link
                href="/blog"
                className="inline-flex min-h-10 items-center justify-center gap-2 px-4 text-[10px] font-medium uppercase tracking-[0.12em] text-muted transition-colors hover:text-gold"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {t("articles.back_to_blog")}
              </Link>
            </aside>

            <div className="min-w-0">
              <div className="space-y-7">{getArticleContent(article.content)}</div>
              <div className="mt-12 border-y border-card-border py-5">
                <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted">{t("articles.written_by")}</p>
                <p className="mt-2 font-serif text-lg">{authorName}</p>
              </div>
            </div>
          </div>
        </article>

        <section className="mx-auto mt-20 max-w-4xl border-t border-card-border pt-10 sm:mt-24" aria-labelledby="article-comments-title">
          <div className="flex items-center gap-3">
            <MessageCircle aria-hidden="true" className="h-5 w-5 text-gold" />
            <h2 id="article-comments-title" className="font-serif text-2xl font-medium">
              {t("articles.discussion")} <span className="text-muted">({comments.length})</span>
            </h2>
          </div>

          <form onSubmit={handleAddComment} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="article-comment" className="sr-only">
              {isAuthenticated ? t("articles.comment_placeholder") : t("articles.login_to_comment")}
            </label>
            <input
              id="article-comment"
              type="text"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={isAuthenticated ? t("articles.comment_placeholder") : t("articles.login_to_comment")}
              disabled={!isAuthenticated || isCommenting}
              className="min-h-12 flex-1 border border-card-border bg-card-bg px-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!isAuthenticated || isCommenting || !commentText.trim()}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-foreground px-5 text-xs font-medium uppercase tracking-[0.14em] text-background transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send aria-hidden="true" className="h-4 w-4" /> {t("articles.publish_comment")}
            </button>
          </form>

          <div className="mt-8 divide-y divide-card-border">
            {comments.length === 0 ? (
              <p className="py-7 text-sm text-muted">{t("articles.no_comments")}</p>
            ) : (
              comments.map((comment) => {
                const commentUserId = typeof comment.user === "string" ? comment.user : comment.user?._id;
                const canDelete = Boolean(
                  user &&
                    (commentUserId === user.id ||
                      article.author?._id === user.id ||
                      user.role === "admin" ||
                      user.role === "moderator")
                );

                return (
                  <article key={comment._id} className="flex items-start justify-between gap-5 py-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="text-sm font-medium">{comment.username || t("articles.reader")}</p>
                        {comment.createdAt && (
                          <time className="text-[10px] uppercase tracking-[0.1em] text-muted">
                            {dateFormatter.format(new Date(comment.createdAt))}
                          </time>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{comment.text}</p>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteComment(comment._id)}
                        aria-label={t("articles.delete_comment")}
                        className="shrink-0 p-2 text-muted transition-colors hover:text-error"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
