import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateEmailSettingRequest,
  TestEmailRequest,
  getEmailSetting,
  saveEmailSetting,
  updateEmailSetting,
  sendTestEmail,
  checkEmailStatus,
} from '@/api/emailSettings';
import { toast } from 'sonner';

// 查询 key
export const emailSettingKeys = {
  all: ['email-settings'] as const,
  setting: () => [...emailSettingKeys.all, 'setting'] as const,
  status: () => [...emailSettingKeys.all, 'status'] as const,
};

// 获取邮件设置
export function useEmailSetting() {
  return useQuery({
    queryKey: emailSettingKeys.setting(),
    queryFn: getEmailSetting,
  });
}

// 获取邮件状态
export function useEmailStatus() {
  return useQuery({
    queryKey: emailSettingKeys.status(),
    queryFn: checkEmailStatus,
  });
}

// 保存邮件设置
export function useSaveEmailSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmailSettingRequest) => saveEmailSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailSettingKeys.all });
      toast.success('邮件设置保存成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '保存失败');
    },
  });
}

// 更新邮件设置
export function useUpdateEmailSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateEmailSettingRequest>) => updateEmailSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailSettingKeys.all });
      toast.success('邮件设置更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 发送测试邮件
export function useSendTestEmail() {
  return useMutation({
    mutationFn: (data: TestEmailRequest) => sendTestEmail(data),
    onSuccess: () => {
      toast.success('测试邮件已发送');
    },
    onError: (error: Error) => {
      toast.error(error.message || '发送失败');
    },
  });
}
