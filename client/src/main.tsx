import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';

// 前端入口仅负责挂载根组件，影响范围为浏览器启动流程。
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
