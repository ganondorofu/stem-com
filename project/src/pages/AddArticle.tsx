// src/pages/AddArticle
import React, { useState, useRef, useEffect, FormEvent } from "react";
import { doc, setDoc, serverTimestamp, arrayUnion, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { nanoid } from "nanoid"; // 短いユニークID生成用
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import { useNavigate } from "react-router-dom";

import colorSyntax from "@toast-ui/editor-plugin-color-syntax";
import "@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css"; // 必要に応じてCSSをインポート

// Import Firebase Authentication
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

// Import custom CSS for editor styling
import "../AddArticle.css";

const AddArticle: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null); // ユーザーIDを保持するステート
  const [userAvatar, setUserAvatar] = useState<string | null>(null); // ユーザーのアバターURLを保持するステート
  const [contributors, setContributors] = useState<string[]>([]); // 編集者リスト
  const [newContributor, setNewContributor] = useState<string>(""); // 新しい編集者
  const [searchResults, setSearchResults] = useState<{ uid: string; displayName: string }[]>([]); // 検索結果
  const editorRef = useRef<Editor>(null);
  const navigate = useNavigate();
  const auth = getAuth();

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // ダークモードの状態を管理

  useEffect(() => {
    // 初期のダークモード状態を設定
    const checkDarkMode = () => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDarkMode(dark);
    };

    checkDarkMode();

    // ダークモードの変更を監視するためのMutationObserverを設定
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    // クリーンアップ関数
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // 認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        // ユーザーがログインしている場合、UIDとアバターURLを取得
        setUserId(user.uid);
        setUserAvatar(user.photoURL || null);
        setContributors([user.uid]); // 自動的に投稿者をcontributorsに追加
      } else {
        // ユーザーがログアウトしている場合、適切な処理を行う
        setUserId(null);
        setUserAvatar(null);
      }
    });

    // クリーンアップ関数
    return () => unsubscribe();
  }, [auth]);

  const handleSearchContributor = async () => {
    if (!newContributor) return;
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("displayName", ">=", newContributor),
        where("displayName", "<", newContributor + "\uf8ff")
      );
      const querySnapshot = await getDocs(usersQuery);
      const results = querySnapshot.docs.map((doc) => ({
        uid: doc.id,
        displayName: doc.data().displayName,
      }));
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching contributors:", error);
    }
  };

  const handleAddContributor = (uid: string) => {
    if (!contributors.includes(uid)) {
      setContributors((prev) => [...prev, uid]);
    }
    setNewContributor("");
    setSearchResults([]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert("記事を投稿するにはログインが必要です。");
      navigate("/stem-com/login"); // ログインページにリダイレクト
      return;
    }

    try {
      const editorInstance = editorRef.current?.getInstance();
      let markdownContent = editorInstance?.getMarkdown() || "";

      // Firestoreに保存
      const articleId = nanoid(10); // ユニークな記事IDを生成
      const articleRef = doc(db, "articles", articleId);
      await setDoc(articleRef, {
        title,
        content: markdownContent,
        created_at: serverTimestamp(),
        authorId: userId, // 正しいユーザーIDを設定
        authorAvatarUrl: userAvatar,
        contributors, // 編集者リストを追加
      });

      alert("記事を追加しました！");
      setTitle("");
      editorInstance?.setMarkdown("");
      navigate("/stem-com"); // 投稿後にリダイレクト
    } catch (error) {
      console.error("エラー:", error);
      alert("記事の投稿に失敗しました。");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-lightBackground dark:bg-darkBackground min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        記事を追加
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-group">
          <label
            htmlFor="title"
            className="block text-gray-700 dark:text-gray-300"
          >
            タイトル
          </label>
          <input
            type="text"
            id="title"
            placeholder="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="form-group">
          <label
            htmlFor="content"
            className="block text-gray-700 dark:text-gray-300"
          >
            内容 (Markdown)
          </label>
          <Editor
            ref={editorRef}
            initialValue="ここにMarkdownを入力"
            previewStyle="vertical"
            height="400px"
            initialEditType="wysiwyg" // WYSIWYGモードに設定
            useCommandShortcut
            plugins={[colorSyntax]}
            theme={isDarkMode ? "dark" : "light"} // ダークモードに応じてテーマを設定
          />
        </div>

        <div className="form-group">
          <label
            htmlFor="contributors"
            className="block text-gray-700 dark:text-gray-300"
          >
            編集者を検索
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="contributors"
              placeholder="表示名を入力"
              value={newContributor}
              onChange={(e) => setNewContributor(e.target.value)}
              className="flex-grow px-3 py-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleSearchContributor}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              検索
            </button>
          </div>
          <ul className="mt-2 list-disc pl-5 text-gray-700 dark:text-gray-300">
            {searchResults.map((result) => (
              <li
                key={result.uid}
                className="cursor-pointer hover:underline"
                onClick={() => handleAddContributor(result.uid)}
              >
                {result.displayName}
              </li>
            ))}
          </ul>
        </div>

        <div className="form-group">
          <label className="block text-gray-700 dark:text-gray-300">
            現在の編集者
          </label>
          <ul className="mt-2 list-disc pl-5 text-gray-700 dark:text-gray-300">
            {contributors.map((contributor) => (
              <li key={contributor}>{contributor}</li>
            ))}
          </ul>
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          投稿
        </button>
      </form>
    </div>
  );
};

export default AddArticle;
