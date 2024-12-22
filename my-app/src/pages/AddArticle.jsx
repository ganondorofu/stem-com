import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid"; // UUID生成用ライブラリ

const AddArticle = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let imageUrlPlaceholder = "";
      if (image) {
        // UUIDを生成して画像ファイル名に使用
        const uuid = uuidv4();
        const fileName = `${uuid}.png`;

        // GitHubに画像をアップロード
        imageUrlPlaceholder = `![画像](https://github.com/ganondorofu/Img_save/raw/main/static/images/${fileName})`;
        await uploadImageToGitHub(image, fileName);
      }

      // Firebase Firestoreに記事を保存
      const articleRef = doc(db, "articles", title.replace(/\s+/g, "-"));
      await setDoc(articleRef, {
        title,
        content: `${content}\n\n${imageUrlPlaceholder}`, // Markdownに画像リンクを追加
        created_at: serverTimestamp(),
      });

      alert("記事を追加しました！");
      setTitle("");
      setContent("");
      setImage(null);
    } catch (error) {
      console.error("エラー:", error);
      alert("記事の投稿に失敗しました。");
    }
  };

  const uploadImageToGitHub = async (file, fileName) => {
    const GITHUB_API_URL = `https://api.github.com/repos/ganondorofu/Img_save/contents/static/images/${fileName}`;
    const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    const base64Content = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result.split(",")[1]);
    });

    const response = await fetch(GITHUB_API_URL, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Add image: ${fileName}`,
        content: base64Content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
  };

  return (
    <div>
      <h1>記事を追加</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="内容 (Markdown)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <button type="submit">投稿</button>
      </form>
    </div>
  );
};

export default AddArticle;
