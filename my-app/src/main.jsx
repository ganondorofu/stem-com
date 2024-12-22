import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // App.jsx をインポート

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App /> {/* App コンポーネントを呼び出す */}
  </React.StrictMode>
);
