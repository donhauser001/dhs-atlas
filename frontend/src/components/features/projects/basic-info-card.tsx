'use client';

import { Pencil, Building2, Phone, Briefcase, Star, UserCircle, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Project } from '@/api/projects';

interface BasicInfoCardProps {
  project: Project;
  teamName?: string;
  taskCount: number;
  totalAmount: number;
  projectProgress: number;
  totalMembers: number;
  mainDesignerNames: string[];
  assistantDesignerNames: string[];
  onProjectNameEdit: () => void;
  onContactEdit: () => void;
  onTeamEdit: () => void;
}

// 信息项组件
function InfoItem({
  label,
  value,
  icon: Icon,
  onEdit
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  onEdit?: () => void;
}) {
  return (
    <div className={`flex items-start gap-3 ${onEdit ? 'group cursor-pointer' : ''}`} onClick={onEdit}>
      <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-sm font-medium truncate ${onEdit ? 'group-hover:text-primary transition-colors' : ''}`}>
          {value || '—'}
          {onEdit && (
            <Pencil className="inline-block h-3 w-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </p>
      </div>
    </div>
  );
}

export function BasicInfoCard({
  project,
  teamName,
  taskCount,
  totalAmount,
  projectProgress,
  totalMembers,
  mainDesignerNames,
  assistantDesignerNames,
  onProjectNameEdit: _onProjectNameEdit,
  onContactEdit,
  onTeamEdit,
}: BasicInfoCardProps) {
  // 格式化联系人显示
  const contactDisplay = project.contactNames && project.contactNames.length > 0
    ? project.contactNames.map((name, index) => {
      const phone = project.contactPhones?.[index];
      return phone ? `${name} ${phone}` : name;
    }).join('、')
    : '';

  return (
    <Card>
      <CardContent className="p-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{taskCount}</p>
            <p className="text-xs text-muted-foreground">任务数</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">项目金额</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="mb-1">
              <span className="text-2xl font-bold">{projectProgress}</span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <Progress value={projectProgress} className="h-1.5" />
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{totalMembers}</p>
            <p className="text-xs text-muted-foreground">参与成员</p>
          </div>
        </div>

        <Separator className="my-[35px]" />

        {/* 详细信息 - 单行五列 */}
        <div className="grid grid-cols-5 gap-4">
          <InfoItem label="客户" value={project.clientName} icon={Building2} />
          <InfoItem label="联系人" value={contactDisplay} icon={Phone} onEdit={onContactEdit} />
          <InfoItem label="承接团队" value={teamName || ''} icon={Briefcase} onEdit={onTeamEdit} />
          <InfoItem
            label="主创设计师"
            value={mainDesignerNames.length > 0 ? mainDesignerNames.join('、') : ''}
            icon={Star}
          />
          <InfoItem
            label="助理设计师"
            value={assistantDesignerNames.length > 0 ? assistantDesignerNames.join('、') : ''}
            icon={UserCircle}
          />
        </div>
      </CardContent>
    </Card>
  );
}

