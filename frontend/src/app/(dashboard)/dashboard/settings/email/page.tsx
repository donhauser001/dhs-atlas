'use client';

import { useState, useMemo } from 'react';
import {
  Mail,
  Server,
  Lock,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateEmailSettingRequest } from '@/api/emailSettings';
import {
  useEmailSetting,
  useSaveEmailSetting,
  useUpdateEmailSetting,
  useSendTestEmail,
} from '@/hooks/queries/use-email-settings';

// 获取初始表单数据
function getInitialFormData(setting?: ReturnType<typeof useEmailSetting>['data']): CreateEmailSettingRequest {
  if (setting) {
    return {
      enableEmail: setting.enableEmail,
      smtpHost: setting.smtpHost,
      smtpPort: setting.smtpPort,
      securityType: setting.securityType,
      requireAuth: setting.requireAuth,
      username: setting.username,
      password: '', // 密码不从服务器返回
      senderName: setting.senderName,
      senderEmail: setting.senderEmail,
      replyEmail: setting.replyEmail || '',
      enableRateLimit: setting.enableRateLimit,
      maxEmailsPerHour: setting.maxEmailsPerHour,
      sendInterval: setting.sendInterval,
    };
  }
  return {
    enableEmail: false,
    smtpHost: '',
    smtpPort: 587,
    securityType: 'tls',
    requireAuth: true,
    username: '',
    password: '',
    senderName: '',
    senderEmail: '',
    replyEmail: '',
    enableRateLimit: false,
    maxEmailsPerHour: 100,
    sendInterval: 1000,
  };
}

export default function EmailSettingsPage() {
  const { data: setting, isLoading } = useEmailSetting();
  
  // 使用 key 来在 setting 加载后重新挂载表单组件
  if (isLoading) {
    return <PageLoading />;
  }

  return <EmailSettingsForm setting={setting} />;
}

function EmailSettingsForm({ setting }: { setting: ReturnType<typeof useEmailSetting>['data'] }) {
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  
  // 使用 useMemo 计算初始值，只在 setting 变化时重新计算
  const initialFormData = useMemo(() => getInitialFormData(setting), [setting]);
  const [formData, setFormData] = useState<CreateEmailSettingRequest>(initialFormData);

  const saveSetting = useSaveEmailSetting();
  const updateSetting = useUpdateEmailSetting();
  const sendTest = useSendTestEmail();

  const handleSave = () => {
    if (setting?._id) {
      // 更新
      const updateData = { ...formData };
      if (!updateData.password) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rest } = updateData;
        updateSetting.mutate(rest);
      } else {
        updateSetting.mutate(updateData);
      }
    } else {
      // 创建
      saveSetting.mutate(formData);
    }
  };

  const handleSendTest = () => {
    if (!testEmail) return;
    sendTest.mutate(
      {
        ...formData,
        testEmail,
        testSubject: '测试邮件',
        testContent: '这是一封测试邮件，用于验证邮件配置是否正确。',
      },
      {
        onSuccess: () => setTestDialogOpen(false),
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="邮件设置" description="配置系统邮件发送服务">
        <div className="flex items-center gap-2">
          {setting?.enableEmail ? (
            <Badge className="bg-green-500/10 text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              已启用
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="h-3 w-3 mr-1" />
              未启用
            </Badge>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6">
        {/* 基本设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              SMTP 服务器配置
            </CardTitle>
            <CardDescription>配置邮件发送服务器信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>启用邮件服务</Label>
                <p className="text-sm text-muted-foreground">
                  开启后系统可以发送邮件通知
                </p>
              </div>
              <Switch
                checked={formData.enableEmail}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableEmail: checked })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP 服务器</Label>
                <Input
                  id="smtpHost"
                  value={formData.smtpHost}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpHost: e.target.value })
                  }
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">端口</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpPort: parseInt(e.target.value) })
                  }
                  placeholder="587"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>安全类型</Label>
              <Select
                value={formData.securityType}
                onValueChange={(value: 'none' | 'tls' | 'ssl') =>
                  setFormData({ ...formData, securityType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 身份验证 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              身份验证
            </CardTitle>
            <CardDescription>配置邮件服务器登录凭据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>需要身份验证</Label>
                <p className="text-sm text-muted-foreground">
                  大多数邮件服务器需要验证
                </p>
              </div>
              <Switch
                checked={formData.requireAuth}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireAuth: checked })
                }
              />
            </div>

            {formData.requireAuth && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={setting?._id ? '留空保持不变' : '输入密码'}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 发件人信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              发件人信息
            </CardTitle>
            <CardDescription>配置邮件发送者显示信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="senderName">发件人名称</Label>
                <Input
                  id="senderName"
                  value={formData.senderName}
                  onChange={(e) =>
                    setFormData({ ...formData, senderName: e.target.value })
                  }
                  placeholder="系统通知"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderEmail">发件人邮箱</Label>
                <Input
                  id="senderEmail"
                  type="email"
                  value={formData.senderEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, senderEmail: e.target.value })
                  }
                  placeholder="noreply@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="replyEmail">回复邮箱（可选）</Label>
              <Input
                id="replyEmail"
                type="email"
                value={formData.replyEmail}
                onChange={(e) =>
                  setFormData({ ...formData, replyEmail: e.target.value })
                }
                placeholder="support@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* 发送限制 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              发送限制
            </CardTitle>
            <CardDescription>配置邮件发送频率限制</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>启用发送限制</Label>
                <p className="text-sm text-muted-foreground">
                  限制邮件发送频率，避免被标记为垃圾邮件
                </p>
              </div>
              <Switch
                checked={formData.enableRateLimit}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableRateLimit: checked })
                }
              />
            </div>

            {formData.enableRateLimit && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxEmailsPerHour">每小时最大发送数</Label>
                  <Input
                    id="maxEmailsPerHour"
                    type="number"
                    value={formData.maxEmailsPerHour}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxEmailsPerHour: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sendInterval">发送间隔（毫秒）</Label>
                  <Input
                    id="sendInterval"
                    type="number"
                    value={formData.sendInterval}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sendInterval: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setTestDialogOpen(true)}
            disabled={!formData.smtpHost || !formData.senderEmail}
          >
            <Send className="mr-2 h-4 w-4" />
            发送测试邮件
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveSetting.isPending || updateSetting.isPending}
          >
            {saveSetting.isPending || updateSetting.isPending
              ? '保存中...'
              : '保存设置'}
          </Button>
        </div>
      </div>

      {/* 测试邮件弹窗 */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发送测试邮件</DialogTitle>
            <DialogDescription>
              输入收件人邮箱地址，系统将发送一封测试邮件
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                测试邮件将使用当前表单中的配置发送
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="testEmail">收件人邮箱</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!testEmail || sendTest.isPending}
            >
              {sendTest.isPending ? '发送中...' : '发送'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
