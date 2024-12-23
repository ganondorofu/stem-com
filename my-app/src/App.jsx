import React, { useState } from "react"; // useStateをインポート
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ArticleList from "./pages/ArticleList.jsx";
import ArticleDetail from "./pages/ArticleDetail.jsx";
import AddArticle from "./pages/AddArticle.jsx";
import { getAuth, signInWithPopup, GithubAuthProvider } from "firebase/auth"; // Firebase Auth

const App = () => {
  const [user, setUser] = useState(null); // ユーザー状態を管理
  const [errorMessage, setErrorMessage] = useState(null); // エラーメッセージ状態を管理

  const handleGitHubLogin = async () => {
    try {
      const auth = getAuth(); // Firebase認証を初期化
      const provider = new GithubAuthProvider();
      provider.addScope("read:org"); // 組織情報へのスコープを追加

      const result = await signInWithPopup(auth, provider); // GitHubでログイン
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential.accessToken; // アクセストークン取得

      console.log("アクセストークン:", token);

      // GitHub APIでユーザーの組織情報を取得
      const response = await fetch("https://api.github.com/user/orgs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("GitHub APIへのリクエストが失敗しました");
      }

      const organizations = await response.json();

      console.log("取得した組織:", organizations);

      // 特定の組織に所属しているか確認
      const isInOrganization = organizations.some(
        (org) => org.login === "ganon-test" // チェックする組織名
      );

      // テスト用にいったん組織の指定はなし
      // if (isInOrganization) {
      //   setUser(result.user); // ログインしたユーザー情報を保存
      // } else {
      //   throw new Error("指定された組織に所属していません");
      // }
      setUser(result.user);

    } catch (error) {
      console.error("GitHubログインエラー:", error);
      setErrorMessage(error.message || "ログインに失敗しました。もう一度試してください。");
    }
  };

  return (
    <div>
      {!user ? (
        <div>
          <button onClick={handleGitHubLogin}>GitHubでログイン</button>
          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </div>
      ) : (
        <div>
          <p>こんにちは、{user.displayName} さん！</p>
          <Router>
            <Routes>
              <Route path="/" element={<ArticleList />} />
              <Route path="/articles/:id" element={<ArticleDetail />} />
              <Route path="/add-article" element={<AddArticle />} />
            </Routes>
          </Router>
        </div>
      )}
    </div>
  );
};

export default App;
