// src/pages/ArticleList.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query, where, documentId } from "firebase/firestore"; // 修正: FieldPath → documentId
import { db } from "../lib/firebase";
import { Calendar, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Article } from '../types/Article'; // 型定義のインポート

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<{ [key: string]: { displayName: string; avatarUrl?: string } }>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchArticlesAndUsers = async () => {
      try {
        // 1. 記事を取得
        const articlesQuery = query(collection(db, "articles"), orderBy("created_at", "desc"));
        const articlesSnapshot = await getDocs(articlesQuery);
        const articlesList: Article[] = articlesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Article, 'id'>),
        }));
        setArticles(articlesList);
        console.log("Fetched Articles:", articlesList);

        // 2. ユニークな authorIds を抽出
        const authorIds = Array.from(new Set(articlesList.map(article => article.authorId)));
        console.log("Unique Author IDs:", authorIds);

        // 3. Firestore の 'in' クエリは最大10件までなので、チャンクに分ける
        const chunkSize = 10;
        const userChunks: string[][] = [];
        for (let i = 0; i < authorIds.length; i += chunkSize) {
          userChunks.push(authorIds.slice(i, i + chunkSize));
        }
        console.log("User Chunks:", userChunks);

        const usersMap: { [key: string]: { displayName: string; avatarUrl?: string } } = {};

        // 4. 各チャンクごとにユーザーデータを取得
        for (const chunk of userChunks) {
          const usersQuery = query(
            collection(db, "users"),
            where(documentId(), "in", chunk) // 修正: FieldPath.documentId() → documentId()
          );
          const usersSnapshot = await getDocs(usersQuery);
          console.log(`Fetched Users for Chunk ${chunk}:`, usersSnapshot.docs.map(doc => doc.id));
          usersSnapshot.docs.forEach(userDoc => {
            const data = userDoc.data();
            usersMap[userDoc.id] = {
              displayName: data.displayName || "ユーザー",
              avatarUrl: data.avatarUrl || undefined, // 修正: photoURL → avatarUrl
            };
          });
        }

        console.log("Users Map:", usersMap);

        // 5. ユーザーデータをステートに設定
        setUsers(usersMap);
      } catch (error) {
        console.error("Error fetching articles or users:", error);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/stem-com/articles/${article.id}`}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden dark:bg-gray-800"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {article.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                {article.content.length > 150 ? `${article.content.substring(0, 150)}...` : article.content}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  {users[article.authorId]?.avatarUrl ? ( // 修正: photoURL → avatarUrl
                    <img
                      src={users[article.authorId].avatarUrl} // 修正: photoURL → avatarUrl
                      alt={`${users[article.authorId].displayName}のアバター`}
                      className="h-4 w-4 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span>{users[article.authorId]?.displayName || "ユーザー"}</span>
                </div>
                <div className="flex items-center space-x-2">
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
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ArticleList;
