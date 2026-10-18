import { Outlet } from 'react-router';

import { useGetScenariosQuery } from '@apis/scenarios/useScenariosQuery';

import * as styles from './AppLayout.css';
import AppHeader from './components/AppHeader';
import AppSidebar from './components/AppSidebar';
import TrainingNotifications from './components/TrainingNotifications';

const AppLayout = () => {
  // 다른 화면에 머무는 동안에도 목록 캐시를 유지하고 상태 변경을 백그라운드에서 반영한다.
  useGetScenariosQuery();

  return (
    <div className={styles.container}>
      <AppSidebar />
      <TrainingNotifications />

      <main className={styles.main}>
        <AppHeader />
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
