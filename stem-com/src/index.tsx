import React from "react";
import ReactDOM from "react-dom";
import App from "./App.tsx"; // App コンポーネントをインポート
import "./index.css"; // 必要なら CSS をインポート

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
