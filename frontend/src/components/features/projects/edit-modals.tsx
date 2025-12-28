'use client';

import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '@/components/common/rich-text-editor';

// 通用文本编辑模态窗
interface TextEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  placeholder?: string;
  multiline?: boolean;
  richText?: boolean;
}

export function TextEditModal({
  open,
  onOpenChange,
  title,
  description,
  value,
  onValueChange,
  onSubmit,
  loading = false,
  placeholder = '请输入内容',
  multiline = false,
  richText = false,
}: TextEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={richText ? 'max-w-2xl max-h-[85vh] flex flex-col' : undefined}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className={richText ? 'py-4 flex-1 overflow-auto min-h-0' : 'py-4'}>
          {richText ? (
            <RichTextEditor
              value={value}
              onChange={onValueChange}
              placeholder={placeholder}
              minHeight="200px"
            />
          ) : multiline ? (
            <Textarea
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={placeholder}
              className="min-h-[100px]"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={placeholder}
            />
          )}
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 联系人选择模态窗
interface Contact {
  _id: string;
  realName: string;
  phone: string;
  company?: string;
}

interface ContactSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
  onSubmit: () => void;
  loading?: boolean;
  clientName: string;
}

export function ContactSelectModal({
  open,
  onOpenChange,
  contacts,
  selectedIds,
  onSelectedChange,
  onSubmit,
  loading = false,
  clientName,
}: ContactSelectModalProps) {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectedChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectedChange([...selectedIds, id]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑联系人</DialogTitle>
          <DialogDescription>
            选择 {clientName} 的联系人
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                暂无可选联系人
              </p>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    id={contact._id}
                    checked={selectedIds.includes(contact._id)}
                    onCheckedChange={() => handleToggle(contact._id)}
                  />
                  <label
                    htmlFor={contact._id}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-medium">{contact.realName}</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.phone}
                    </p>
                  </label>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 团队选择模态窗
interface Enterprise {
  _id: string;
  enterpriseName: string;
}

interface TeamSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enterprises: Enterprise[];
  selectedId: string;
  onSelectedChange: (id: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function TeamSelectModal({
  open,
  onOpenChange,
  enterprises,
  selectedId,
  onSelectedChange,
  onSubmit,
  loading = false,
}: TeamSelectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑承接团队</DialogTitle>
          <DialogDescription>
            选择负责该项目的团队
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedId} onValueChange={onSelectedChange}>
            <SelectTrigger>
              <SelectValue placeholder="请选择团队" />
            </SelectTrigger>
            <SelectContent>
              {enterprises.map((enterprise) => (
                <SelectItem key={enterprise._id} value={enterprise._id}>
                  {enterprise.enterpriseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 设计师分配模态窗
interface User {
  _id: string;
  realName: string;
  role: string;
}

interface AssignDesignersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  taskName: string;
  mainDesigners: string[];
  assistantDesigners: string[];
  onMainDesignersChange: (ids: string[]) => void;
  onAssistantDesignersChange: (ids: string[]) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function AssignDesignersModal({
  open,
  onOpenChange,
  users,
  taskName,
  mainDesigners,
  assistantDesigners,
  onMainDesignersChange,
  onAssistantDesignersChange,
  onSubmit,
  loading = false,
}: AssignDesignersModalProps) {
  const handleMainToggle = (id: string) => {
    if (mainDesigners.includes(id)) {
      onMainDesignersChange(mainDesigners.filter((i) => i !== id));
    } else {
      onMainDesignersChange([...mainDesigners, id]);
      // 从助理设计师中移除
      if (assistantDesigners.includes(id)) {
        onAssistantDesignersChange(assistantDesigners.filter((i) => i !== id));
      }
    }
  };

  const handleAssistantToggle = (id: string) => {
    if (assistantDesigners.includes(id)) {
      onAssistantDesignersChange(assistantDesigners.filter((i) => i !== id));
    } else {
      onAssistantDesignersChange([...assistantDesigners, id]);
      // 从主创设计师中移除
      if (mainDesigners.includes(id)) {
        onMainDesignersChange(mainDesigners.filter((i) => i !== id));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>分配设计师</DialogTitle>
          <DialogDescription>
            为任务「{taskName}」分配设计师
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          {/* 主创设计师 */}
          <div>
            <Label className="mb-2 block">主创设计师</Label>
            <ScrollArea className="h-[250px] border rounded-md p-2">
              <div className="space-y-1">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`main-${user._id}`}
                      checked={mainDesigners.includes(user._id)}
                      onCheckedChange={() => handleMainToggle(user._id)}
                    />
                    <label
                      htmlFor={`main-${user._id}`}
                      className="text-sm cursor-pointer"
                    >
                      {user.realName}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 助理设计师 */}
          <div>
            <Label className="mb-2 block">助理设计师</Label>
            <ScrollArea className="h-[250px] border rounded-md p-2">
              <div className="space-y-1">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`assistant-${user._id}`}
                      checked={assistantDesigners.includes(user._id)}
                      onCheckedChange={() => handleAssistantToggle(user._id)}
                    />
                    <label
                      htmlFor={`assistant-${user._id}`}
                      className="text-sm cursor-pointer"
                    >
                      {user.realName}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

