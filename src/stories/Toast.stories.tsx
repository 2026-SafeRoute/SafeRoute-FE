import { Button } from '@components/Button';
import Toast from '@components/toast/Toast';
import ToastProvider from '@components/toast/ToastProvider';
import useToast from '@components/toast/useToast';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Toast> = {
  title: 'Shared/Toast',
  component: Toast,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Playground: Story = {
  args: {
    id: 'preview',
    title: '건물이 추가되었습니다',
    description: 'A동 본관이 성공적으로 등록되었습니다.',
    variant: 'success',
    onClose: () => {},
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2rem' }}>
      <Toast {...args} />
    </div>
  ),
};

export const ReferenceSet: Story = {
  args: { id: '', title: '', onClose: () => {} },
  render: () => {
    const { show } = useToast();

    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', marginBottom: '3.2rem' }}>
          <Button
            variant="ghost"
            onClick={() =>
              show({ title: '알림', description: '작업이 처리되었습니다.', variant: 'default' })
            }
          >
            Default
          </Button>
          <Button
            onClick={() =>
              show({
                title: '성공',
                description: '건물이 성공적으로 추가되었습니다.',
                variant: 'success',
              })
            }
          >
            Success
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              show({ title: '주의', description: '일부 항목을 확인해 주세요.', variant: 'warning' })
            }
          >
            Warning
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              show({ title: '오류', description: '요청을 처리하지 못했습니다.', variant: 'error' })
            }
          >
            Error
          </Button>
          <Button
            variant="ghost"
            onClick={() => show({ title: '설명 없는 알림', variant: 'default' })}
          >
            설명 없음
          </Button>
        </div>
      </div>
    );
  },
};

export const ExpiredRouteProposal: Story = {
  args: {
    id: 'expired-route-proposal',
    title: '경로 변경 제안이 만료되었어요.',
    description: '혼잡 상황이 바뀌어 이 제안은 더 이상 유효하지 않아요.',
    variant: 'default',
    icon: 'info',
    descriptionNoWrap: true,
    duration: 0,
    onClose: () => {},
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2rem' }}>
      <Toast {...args} />
    </div>
  ),
};
