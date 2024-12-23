// src/pages/index.tsx
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query, where, documentId } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Calendar, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Article } from '../types/Article';
import Editors from "../components/Editors";

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<{ [key: string]: { displayName: string; avatarUrl?: string } }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticlesAndUsers = async () => {
      try {
        const articlesQuery = query(collection(db, "articles"), orderBy("created_at", "desc"));
        const articlesSnapshot = await getDocs(articlesQuery);
        const articlesList: Article[] = articlesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Article, 'id'>),
        }));
        setArticles(articlesList);

        const authorIds = Array.from(new Set(articlesList.map(article => article.authorId)));
        const editorIds = Array.from(new Set(articlesList.flatMap(article => article.editors || [])));
        const allUserIds = Array.from(new Set([...authorIds, ...editorIds]));

        const chunkSize = 10;
        const userChunks: string[][] = [];
        for (let i = 0; i < allUserIds.length; i += chunkSize) {
          userChunks.push(allUserIds.slice(i, i + chunkSize));
        }

        const usersMap: { [key: string]: { displayName: string; avatarUrl?: string } } = {};

        for (const chunk of userChunks) {
          const usersQuery = query(
            collection(db, "users"),
            where(documentId(), "in", chunk)
          );
          const usersSnapshot = await getDocs(usersQuery);
          usersSnapshot.docs.forEach(userDoc => {
            const data = userDoc.data();
            usersMap[userDoc.id] = {
              displayName: data.displayName || "ユーザー",
              avatarUrl: data.avatarUrl || undefined,
            };
          });
        }

        allUserIds.forEach(uid => {
          if (!usersMap[uid]) {
            usersMap[uid] = {
              displayName: "ユーザー",
              avatarUrl: undefined,
            };
          }
        });

        setUsers(usersMap);
      } catch (error) {
        console.error("Error fetching articles or users:", error);
        setError("記事の取得に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    fetchArticlesAndUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {articles.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">記事がありません。</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.id}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden dark:bg-gray-800"
            >
              <a>
                <div className="p-6 flex flex-col h-full">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow line-clamp-3">
                    {article.content.length > 150 ? `${article.content.substring(0, 150)}...` : article.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      {users[article.authorId]?.avatarUrl ? (
                        <Link href={`/users/${article.authorId}`}>
                          <a>
                            <img
                              src={users[article.authorId].avatarUrl}
                              alt={`${users[article.authorId].displayName}のアバター`}
                              className="h-6 w-6 rounded-full object-cover"
                              loading="lazy"
                            />
                          </a>
                        </Link>
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                      <span>{users[article.authorId]?.displayName || "ユーザー"}</span>
                      <Editors
                        editors={article.editors ? article.editors.map(uid => ({
                          uid,
                          displayName: users[uid]?.displayName || "ユーザー",
                          avatarUrl: users[uid]?.avatarUrl
                        })) : []}
                        showNames={false}
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {article.created_at && article.created_at.seconds
                          ? format(new Date(article.created_at.seconds * 1000), 'PPP', { locale: ja })
                          : "不明な日付"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center text-indigo-600 font-medium">
                    続きを読む
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleList;
