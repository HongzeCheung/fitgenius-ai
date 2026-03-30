import React, { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { AppStoreProvider } from './store/useAppStore';
import { authService } from './services/auth';
import './app.scss';

const App: React.FC<React.PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    const currentRoute = Taro.getCurrentInstance().router?.path;
    if (authService.hasToken() && currentRoute === 'pages/auth/index') {
      Taro.reLaunch({ url: '/pages/dashboard/index' });
    }
  }, []);

  return <AppStoreProvider>{children}</AppStoreProvider>;
};

export default App;
