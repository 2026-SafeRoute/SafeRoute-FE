import type * as React from 'react';
import { useState } from 'react';

import { useLocation, useNavigate } from 'react-router';

import LogoutIcon from '@assets/icons/ic-logout.svg?react';
import PanelLeftIcon from '@assets/icons/ic-panel-left.svg?react';
import logoImg from '@assets/icons/logo.webp';

import Tooltip from '@components/tooltip/Tooltip';

import { ROUTES } from '@constants/path';

import * as styles from './Sidebar.css';

const SIDEBAR_COLLAPSED_KEY = 'saferoute:sidebar-collapsed';

interface SidebarProps {
  brand: string;
  menuItems: Array<{
    label: string;
    icon: React.ComponentType<React.ComponentProps<'svg'>>;
    path?: string;
    items?: Array<{
      label: string;
      icon: React.ComponentType<React.ComponentProps<'svg'>>;
      path: string;
    }>;
  }>;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

const Sidebar = ({ brand, menuItems, onLogout, isLoggingOut = false }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      void navigate(path);
    }
  };

  const handleToggle = () => {
    const nextIsCollapsed = !isCollapsed;
    setIsCollapsed(nextIsCollapsed);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextIsCollapsed));
    } catch {
      // 저장소를 사용할 수 없어도 현재 화면에서는 접기·펼치기가 동작합니다.
    }
  };

  return (
    <aside className={styles.container({ collapsed: isCollapsed })}>
      <header className={styles.header({ collapsed: isCollapsed })}>
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => handleNavigate(ROUTES.HOME)}
            aria-label="홈으로 이동"
            className={styles.brandLink}
          >
            <img src={logoImg} className={styles.logo} alt="" aria-hidden="true" />
            <strong className={styles.brand}>{brand}</strong>
          </button>
        )}
        <Tooltip
          content="사이드바 펼치기"
          placement="right"
          enabled={isCollapsed}
          describeTrigger={false}
        >
          <button
            type="button"
            onClick={handleToggle}
            className={styles.collapseButton}
            aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <>
                <img src={logoImg} className={styles.toggleLogo} alt="" aria-hidden="true" />
                <PanelLeftIcon
                  className={styles.togglePanelIcon}
                  aria-hidden="true"
                  focusable="false"
                />
              </>
            ) : (
              <PanelLeftIcon aria-hidden="true" focusable="false" />
            )}
          </button>
        </Tooltip>
      </header>

      <nav aria-label="사이드바 메뉴" className={styles.navigation}>
        <ul className={styles.list}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const subItems = item.items;

            if (subItems) {
              return (
                <li key={item.label} className={styles.group({ collapsed: isCollapsed })}>
                  <div
                    className={styles.groupLabel({ collapsed: isCollapsed })}
                    aria-hidden={isCollapsed}
                  >
                    <Icon className={styles.icon} aria-hidden="true" focusable="false" />
                    <span>{item.label}</span>
                  </div>

                  <ul className={styles.groupList({ collapsed: isCollapsed })}>
                    {subItems.map((child) => {
                      const ChildIcon = child.icon;
                      const isActive =
                        child.path === '/'
                          ? location.pathname === child.path
                          : location.pathname === child.path ||
                            location.pathname.startsWith(`${child.path}/`);

                      return (
                        <li key={child.label}>
                          <Tooltip
                            content={child.label}
                            placement="right"
                            enabled={isCollapsed}
                            fullWidth
                            describeTrigger={false}
                          >
                            <button
                              type="button"
                              onClick={() => handleNavigate(child.path)}
                              className={styles.item({ active: isActive, collapsed: isCollapsed })}
                              aria-current={isActive ? 'page' : undefined}
                              aria-label={child.label}
                            >
                              <ChildIcon
                                className={styles.icon}
                                aria-hidden="true"
                                focusable="false"
                              />
                              {!isCollapsed && <span>{child.label}</span>}
                            </button>
                          </Tooltip>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }

            const isActive =
              item.path === '/'
                ? location.pathname === item.path
                : location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path ?? ''}/`);

            return (
              <li key={item.label}>
                <Tooltip
                  content={item.label}
                  placement="right"
                  enabled={isCollapsed}
                  fullWidth
                  describeTrigger={false}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (item.path) {
                        handleNavigate(item.path);
                      }
                    }}
                    className={styles.item({ active: isActive, collapsed: isCollapsed })}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                  >
                    <Icon className={styles.icon} aria-hidden="true" focusable="false" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className={styles.footer({ collapsed: isCollapsed })}>
        <Tooltip
          content="로그아웃"
          placement="right"
          enabled={isCollapsed}
          fullWidth
          describeTrigger={false}
        >
          <button
            type="button"
            onClick={onLogout}
            className={styles.item({ collapsed: isCollapsed })}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            aria-label="로그아웃"
          >
            <LogoutIcon className={styles.icon} aria-hidden="true" focusable="false" />
            {!isCollapsed && <span>로그아웃</span>}
          </button>
        </Tooltip>
      </footer>
    </aside>
  );
};

export default Sidebar;
