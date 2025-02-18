import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'jotai';
import './index.css'; // index.css 파일을 포함

const queryClient = new QueryClient();
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <QueryClientProvider client={queryClient}>
    <Provider>
      <App />
    </Provider>
  </QueryClientProvider>
);
