import { Link, useNavigate } from 'react-router';

import ArrowRightIcon from '@assets/icons/ic-arrow-right.svg?react';
import logoImg from '@assets/icons/logo.webp';

import { Button } from '@components/Button';

import { ROUTES } from '@constants/path';

import { LANDING_FEATURES } from './constants/landing';
import * as styles from './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to={ROUTES.LANDING} aria-label="SAFE ROUTE 홈">
          <img src={logoImg} className={styles.logoIcon} alt="" aria-hidden="true" />
          <span>SAFE ROUTE</span>
        </Link>

        <div className={styles.authActions}>
          <Button
            className={styles.loginButton}
            size="md"
            variant="ghost"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            로그인
          </Button>
          <Button size="md" variant="primary" onClick={() => navigate(ROUTES.SIGNUP)}>
            회원가입
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.badge}>AI · IoT · 화재 대피 훈련</span>
          <h1 className={styles.title}>
            AI 기반
            <br />
            실시간 화재 대피 훈련 관리
          </h1>
          <p className={styles.description}>
            CCTV AI 비전 분석으로 실시간 군중 밀집도를 확인하고,
            <br />
            IoT 유도등과 연동한 대피 경로 안내로 효과적인 훈련을 지원합니다.
          </p>

          <div className={styles.ctaGroup}>
            <Link className={styles.primaryCta} to={ROUTES.HOME}>
              시작하기
              <ArrowRightIcon />
            </Link>
          </div>
        </section>

        <section className={styles.featureGrid} aria-label="주요 기능">
          {LANDING_FEATURES.map(({ Icon, ...feature }) => (
            <article className={styles.featureCard} key={feature.title}>
              <span className={styles.iconBox[feature.tone]}>
                <Icon />
              </span>
              <div className={styles.featureText}>
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 Safe Route Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
