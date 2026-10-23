import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

import logoImg from '@assets/icons/logo.webp';

import { Button } from '@components/Button';
import TextField from '@components/inputField/TextField';
import useToast from '@components/toast/useToast';

import { ROUTES } from '@constants/path';

import { setTokens } from '@shared/auth/tokenStorage';

import { useLoginMutation } from './api/useLoginMutation';
import { LOGIN_FEATURES } from './constants/login';
import * as styles from './LoginPage.css';
import { loginFormSchema } from './schemas/loginFormSchema';

import type { LoginFormValues } from './schemas/loginFormSchema';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isAutoLogin, setIsAutoLogin] = useState(true);
  const loginMutation = useLoginMutation();
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleLogin = handleSubmit(async (values) => {
    try {
      const { accessToken, refreshToken } = await loginMutation.mutateAsync(values);

      setTokens(accessToken, refreshToken, isAutoLogin);
      show({ title: '로그인되었습니다.', variant: 'success' });
      navigate(ROUTES.HOME, { replace: true });
    } catch {
      show({
        title: '로그인에 실패했습니다.',
        variant: 'error',
      });
    }
  });

  return (
    <main className={styles.page}>
      <section className={styles.content} aria-label="로그인">
        <div className={styles.intro}>
          <Link className={styles.brand} to={ROUTES.LANDING} aria-label="SAFE ROUTE 홈">
            <img src={logoImg} className={styles.logoIcon} alt="" aria-hidden="true" />
            <span>SAFE ROUTE</span>
          </Link>

          <h1 className={styles.title}>
            실시간 데이터 기반
            <br />
            화재 대피 훈련 및
            <br />
            평가 시스템
          </h1>

          <p className={styles.description}>
            AI 비전과 IoT 유도등으로 대피 훈련을 지원하고,
            <br />
            훈련 결과에 대한 자동 평가와 개선 권고사항을 확인하세요.
          </p>

          <ul className={styles.featureList} aria-label="주요 기능">
            {LOGIN_FEATURES.map(({ Icon, title }) => (
              <li className={styles.featureItem} key={title}>
                <span className={styles.featureIcon}>
                  <Icon className={styles.featureIconSvg} />
                </span>
                <span>{title}</span>
              </li>
            ))}
          </ul>
        </div>

        <form noValidate className={styles.loginCard} onSubmit={handleLogin}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>로그인</h2>
          </div>

          <div className={styles.fieldGroup}>
            <TextField
              required
              label="이메일"
              type="email"
              autoComplete="username"
              errorMessage={errors.email?.message}
              disabled={loginMutation.isPending}
              {...register('email')}
            />
            <TextField
              required
              label="비밀번호"
              type="password"
              autoComplete="current-password"
              errorMessage={errors.password?.message}
              disabled={loginMutation.isPending}
              {...register('password')}
            />
          </div>

          <div className={styles.formOptions}>
            <label className={styles.checkboxLabel}>
              <input
                checked={isAutoLogin}
                className={styles.checkbox}
                type="checkbox"
                disabled={loginMutation.isPending}
                onChange={(event) => setIsAutoLogin(event.target.checked)}
              />
              자동 로그인
            </label>
          </div>

          <Button
            fullWidth
            size="lg"
            type="submit"
            variant="primary"
            isLoading={loginMutation.isPending}
          >
            로그인
          </Button>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <p>또는</p>
            <span className={styles.dividerLine} />
          </div>

          <p className={styles.signupGuide}>
            계정이 없으신가요?
            <button
              className={styles.signupButton}
              type="button"
              onClick={() => navigate(ROUTES.SIGNUP)}
            >
              회원가입
            </button>
          </p>
        </form>
      </section>
    </main>
  );
};

export default LoginPage;
