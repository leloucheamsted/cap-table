import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { router } from './router';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#23555a',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          fontFamily: 'Ubuntu, sans-serif',
          colorBgContainer: '#FFFFFF',
          colorBgLayout: '#e1decf',
          colorText: '#000000',
          colorTextSecondary: '#6B7280',
          colorBorder: '#E5E7EB',
          colorBorderSecondary: '#E5E7EB',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
