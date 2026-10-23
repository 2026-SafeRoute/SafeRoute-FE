import { useState } from 'react';

import { Button } from '@components/Button';
import Modal from '@components/modal';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Shared/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
  args: {
    open: false,
    onClose: () => {},
    title: '모달 제목',
    description: '모달에 대한 부가 설명을 입력합니다',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['form', 'confirm'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const Required = () => <span style={{ color: '#EF4444' }}>*</span>;

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.6rem',
  fontSize: '1.4rem',
  color: '#101828',
};

const inputStyle = {
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '1rem 1.2rem',
  fontSize: '1.4rem',
  outline: 'none',
};

export const Playground: Story = {
  args: {},
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>모달 열기</Button>
        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button onClick={() => setOpen(false)}>확인</Button>
            </>
          }
        />
      </>
    );
  },
};

export const ReferenceSet: Story = {
  args: {},
  render: () => {
    // 건물 추가
    const AddBuilding = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>건물 추가</Button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="건물 추가"
            description="새 건물 정보를 입력합니다"
            footer={
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button onClick={() => setOpen(false)}>추가 완료</Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
              <label style={fieldStyle}>
                <span>
                  건물명 <Required />
                </span>
                <input placeholder="A동 · 본관" style={inputStyle} />
              </label>
              <label style={fieldStyle}>
                <span>
                  연면적(㎡) <Required />
                </span>
                <input placeholder="12,500" style={inputStyle} />
              </label>
              <label style={fieldStyle}>
                <span>
                  층수 <Required />
                </span>
                <input placeholder="5" style={inputStyle} />
              </label>
            </div>
          </Modal>
        </>
      );
    };

    // 건물 정보 수정
    const EditBuilding = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button variant="outlined" onClick={() => setOpen(true)}>
            건물 정보 수정
          </Button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="건물 정보 수정"
            description="건물명을 수정합니다"
            footer={
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button onClick={() => setOpen(false)}>수정 완료</Button>
              </>
            }
          >
            <label style={fieldStyle}>
              <span>
                건물명 <Required />
              </span>
              <input placeholder="A동 · 본관" style={inputStyle} />
            </label>
          </Modal>
        </>
      );
    };

    // 층별 관리
    const FloorManage = () => {
      const [open, setOpen] = useState(false);
      const floors = [
        { floor: '5F', label: '5층', uploaded: true },
        { floor: '4F', label: '4층', uploaded: true },
        { floor: '3F', label: '3층', uploaded: true },
        { floor: '2F', label: '2층', uploaded: true },
        { floor: '1F', label: '1층', uploaded: false },
      ];
      return (
        <>
          <Button variant="outlined" onClick={() => setOpen(true)}>
            층별 관리
          </Button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="A동 - 본관 층별 관리"
            description="각 층별 도면을 업로드하거나 삭제할 수 있습니다"
            size="lg"
            footer={
              <Button variant="ghost" onClick={() => setOpen(false)}>
                닫기
              </Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {floors.map(({ floor, label, uploaded }) => (
                <div
                  key={floor}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.6rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '1.4rem 1.6rem',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      borderRadius: '6px',
                      backgroundColor: '#F3F4F6',
                      padding: '0.4rem 0.8rem',
                      width: '3.6rem',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#4A5563',
                      textAlign: 'center',
                    }}
                  >
                    {floor}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '1.4rem', fontWeight: 600, color: '#101828' }}>{label}</p>
                    <p style={{ fontSize: '1.2rem', color: uploaded ? '#10B981' : '#99A1AF' }}>
                      {uploaded ? '도면 업로드 완료' : '도면 미업로드'}
                    </p>
                  </div>
                  {uploaded ? (
                    <>
                      <Button size="sm" variant="outlined">
                        재업로드
                      </Button>
                      <Button size="sm" variant="dangerOutlined">
                        삭제
                      </Button>
                    </>
                  ) : (
                    <Button size="sm">업로드</Button>
                  )}
                </div>
              ))}
            </div>
          </Modal>
        </>
      );
    };

    // 건물 삭제
    const DeleteBuilding = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button variant="dangerOutlined" onClick={() => setOpen(true)}>
            건물 삭제
          </Button>
          <Modal
            variant="confirm"
            open={open}
            onClose={() => setOpen(false)}
            title="건물 삭제"
            description="'A동 - 본관' 건물을 삭제하시겠습니까?"
            warning={
              '이 작업은 되돌릴 수 없습니다.\n건물과 관련된 모든 도면 데이터가 영구적으로 삭제됩니다.'
            }
            footer={
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button variant="danger" onClick={() => setOpen(false)}>
                  삭제
                </Button>
              </>
            }
          />
        </>
      );
    };

    return (
      <div
        style={{
          width: '1280px',
          padding: '48px',
          borderRadius: '32px',
          backgroundColor: '#FFFFFF',
          display: 'grid',
          gap: '48px',
        }}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#4A5563' }}>FORM MODAL — 건물 추가</span>
          <AddBuilding />
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#4A5563' }}>FORM MODAL — 건물 정보 수정</span>
          <EditBuilding />
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#4A5563' }}>FORM MODAL — 층별 관리 (Large)</span>
          <FloorManage />
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#4A5563' }}>CONFIRM MODAL — 건물 삭제</span>
          <DeleteBuilding />
        </div>
      </div>
    );
  },
};
