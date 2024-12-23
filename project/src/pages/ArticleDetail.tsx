// src/pages/ArticleDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom"; // Link を追加
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Article } from '../types/Article'; // 型定義のインポート

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [author, setAuthor] = useState<{ displayName: string; avatarUrl?: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticleAndAuthor = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        // 記事を取得
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        console.log("Fetched Article:", docSnap.exists() ? docSnap.data() : "No Article Found");

        if (docSnap.exists()) {
          const data = docSnap.data() as Article;
          setArticle({
            id: docSnap.id,
            ...data,
          });
          console.log("Article Data:", data);

          // 著者のデータを取得（authorIdが存在する場合のみ）
          if (data.authorId) {
            const userDocRef = doc(db, "users", data.authorId);
            const userDoc = await getDoc(userDocRef);
            console.log(`Fetched User for authorId ${data.authorId}:`, userDoc.exists() ? userDoc.data() : "No User Found");

            if (userDoc.exists()) {
              const userData = userDoc.data();
              setAuthor({
                displayName: userData.displayName || "ユーザー",
                avatarUrl: userData.avatarUrl || undefined,
              });
            } else {
              setAuthor({
                displayName: "ユーザー",
                avatarUrl: undefined,
              });
            }
          } else {
            setAuthor({
              displayName: "ユーザー",
              avatarUrl: undefined,
            });
          }
        } else {
          console.log("記事が存在しません。");
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching article or author:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchArticleAndAuthor();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">記事が見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <article className="bg-white rounded-lg shadow-lg overflow-hidden dark:bg-gray-800">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {article.title}
          </h1>
          
          <div className="flex items-center space-x-6 text-gray-500 dark:text-gray-400 mb-8">
            <div className="flex items-center space-x-3">
              {author?.avatarUrl ? (
                <Link to={`/stem-com/users/${article.authorId}`}>
                  <img
                    src={author.avatarUrl}
                    alt={`${author.displayName}のアバター`}
                    className="h-10 w-10 rounded-full object-cover border-2 border-indigo-600"
                  />
                </Link>
              ) : (
                <User className="h-10 w-10 text-gray-400" />
              )}
              <Link to={`/stem-com/users/${article.authorId}`} className="hover:underline">
                <span className="text-lg font-medium">{author?.displayName || "ユーザー"}</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>
                {article.created_at && article.created_at.seconds
                  ? format(new Date(article.created_at.seconds * 1000), 'PPP', { locale: ja })
                  : "不明な日付"}
              </span>
            </div>
          </div>

          <div className="prose prose-indigo max-w-none dark:prose-dark">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>
        </div>
      </article>
    </div>
  );
};

export default ArticleDetail;
