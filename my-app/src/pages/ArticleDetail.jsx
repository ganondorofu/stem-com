import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import ReactMarkdown from "react-markdown";

const ArticleDetail = () => {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const docRef = doc(db, "articles", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setArticle(docSnap.data());
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching article:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [id]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!article) {
        return <p>記事が見つかりません。</p>;
    }

    return (
        <div>
            <h1>{article.title}</h1>
            <ReactMarkdown>{article.content}</ReactMarkdown>
            <p>作成日: {new Date(article.created_at.seconds * 1000).toLocaleString()}</p>
        </div>
    );
};

export default ArticleDetail;
