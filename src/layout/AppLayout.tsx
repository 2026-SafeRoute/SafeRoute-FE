import { Outlet } from 'react-router';

import * as styles from './AppLayout.css';
import AppHeader from './components/AppHeader';
import AppSidebar from './components/AppSidebar';
import TrainingNotifications from './components/TrainingNotifications';

const AppLayout = () => {
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
