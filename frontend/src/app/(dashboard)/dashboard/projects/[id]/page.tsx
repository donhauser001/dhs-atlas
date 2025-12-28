'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
} from 'lucide-react';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/axios';

import { useProject } from '@/hooks/queries/use-projects';
import { useProjectTasks, useUpdateTask } from '@/hooks/queries/use-tasks';
import { useEmployees, useClientUsers } from '@/hooks/queries/use-users';
import { ProgressStatus, SettlementStatus } from '@/api/projects';
import { Task, TaskPriority } from '@/api/tasks';

import {
  BasicInfoCard,
  TaskList,
  AdditionalInfoCard,
  TextEditModal,
  ContactSelectModal,
  TeamSelectModal,
  AssignDesignersModal,
  TaskModal,
} from '@/components/features/projects';

// 状态映射
const progressStatusMap: Record<ProgressStatus, { label: string; color: string }> = {
  consulting: { label: '咨询中', color: 'bg-gray-500' },
  'in-progress': { label: '进行中', color: 'bg-blue-500' },
  'partial-delivery': { label: '部分交付', color: 'bg-yellow-500' },
  completed: { label: '已完成', color: 'bg-green-500' },
  'on-hold': { label: '已暂停', color: 'bg-orange-500' },
  cancelled: { label: '已取消', color: 'bg-red-500' },
};

const settlementStatusMap: Record<SettlementStatus, { label: string; color: string }> = {
  unpaid: { label: '未付款', color: 'bg-red-500' },
  prepaid: { label: '已预付', color: 'bg-yellow-500' },
  'partial-paid': { label: '部分付款', color: 'bg-blue-500' },
  'fully-paid': { label: '已结清', color: 'bg-green-500' },
};

// 计算项目进度
function calculateProjectProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const totalProgress = tasks.reduce((sum, task) => {
    return sum + (task.currentProcessStep?.progressRatio || 0);
  }, 0);
  return Math.round(totalProgress / tasks.length);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  // 数据查询
  const { data: projectData, isLoading: projectLoading, refetch: refetchProject } = useProject(id);
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useProjectTasks(id);
  const { data: employeesData } = useEmployees();
  const { data: clientUsersData } = useClientUsers();
  const updateTask = useUpdateTask(id);

  // 模态窗状态
  const [projectNameModalOpen, setProjectNameModalOpen] = useState(false);
  const [projectNameValue, setProjectNameValue] = useState('');
  const [projectNameLoading, setProjectNameLoading] = useState(false);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactLoading, setContactLoading] = useState(false);

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [enterprises, setEnterprises] = useState<Array<{ _id: string; enterpriseName: string; enterpriseAlias?: string }>>([]);

  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [remarkValue, setRemarkValue] = useState('');
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [editingRemarkIndex, setEditingRemarkIndex] = useState<number | null>(null);

  const [requirementModalOpen, setRequirementModalOpen] = useState(false);
  const [requirementValue, setRequirementValue] = useState('');
  const [requirementLoading, setRequirementLoading] = useState(false);
  const [editingRequirementIndex, setEditingRequirementIndex] = useState<number | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [mainDesigners, setMainDesigners] = useState<string[]>([]);
  const [assistantDesigners, setAssistantDesigners] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // 任务模态窗状态
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'view' | 'edit'>('create');

  const project = projectData?.data;
  const tasks = tasksData?.data || [];
  const employees = employeesData?.data || [];
  const clientUsers = clientUsersData?.data || [];

  // 获取企业列表
  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        const response = await api.get('/enterprises?limit=100');
        if (response.data.success) {
          setEnterprises(response.data.data);
        }
      } catch {
        console.error('获取企业列表失败:', error);
      }
    };
    fetchEnterprises();
  }, []);

  // 过滤客户相关的联系人
  const filteredContacts = clientUsers.filter(
    (user) => user.company === project?.clientName || user.enterpriseName === project?.clientName
  );

  // 统计数据
  const totalAmount = tasks.reduce((sum, task) => sum + (task.subtotal || 0), 0);
  const projectProgress = calculateProjectProgress(tasks);

  // 从任务中聚合设计师（去重）
  const mainDesignerNames = [...new Set(
    tasks.flatMap(task => task.mainDesignerNames || [])
  )];
  const assistantDesignerNames = [...new Set(
    tasks.flatMap(task => task.assistantDesignerNames || [])
  )];
  const totalMembers = new Set([...mainDesignerNames, ...assistantDesignerNames]).size;

  // === 项目名称编辑 ===
  const handleProjectNameEdit = () => {
    setProjectNameValue(project?.projectName || '');
    setProjectNameModalOpen(true);
  };

  const handleProjectNameSubmit = async () => {
    if (!projectNameValue.trim()) {
      toast.error('项目名称不能为空');
      return;
    }
    setProjectNameLoading(true);
    try {
      await api.put(`/projects/${id}`, { projectName: projectNameValue.trim() });
      toast.success('项目名称更新成功');
      setProjectNameModalOpen(false);
      refetchProject();
    } catch {
      toast.error('更新失败');
    } finally {
      setProjectNameLoading(false);
    }
  };

  // === 联系人编辑 ===
  const handleContactEdit = () => {
    setSelectedContacts(project?.contactIds || []);
    setContactModalOpen(true);
  };

  const handleContactSubmit = async () => {
    setContactLoading(true);
    try {
      const selectedContactInfo = filteredContacts.filter((c) =>
        selectedContacts.includes(c._id)
      );
      const contactNames = selectedContactInfo.map((c) => c.realName);
      const contactPhones = selectedContactInfo.map((c) => c.phone);

      await api.put(`/projects/${id}`, {
        contactIds: selectedContacts,
        contactNames,
        contactPhones,
      });
      toast.success('联系人更新成功');
      setContactModalOpen(false);
      refetchProject();
    } catch {
      toast.error('更新失败');
    } finally {
      setContactLoading(false);
    }
  };

  // === 团队编辑 ===
  const handleTeamEdit = () => {
    setSelectedTeam(project?.undertakingTeam || '');
    setTeamModalOpen(true);
  };

  const handleTeamSubmit = async () => {
    setTeamLoading(true);
    try {
      await api.put(`/projects/${id}`, { undertakingTeam: selectedTeam });
      toast.success('承接团队更新成功');
      setTeamModalOpen(false);
      refetchProject();
    } catch {
      toast.error('更新失败');
    } finally {
      setTeamLoading(false);
    }
  };

  // === 备注编辑 ===
  const handleRemarkAdd = () => {
    setEditingRemarkIndex(null);
    setRemarkValue('');
    setRemarkModalOpen(true);
  };

  const handleRemarkEdit = (index: number, content: string) => {
    setEditingRemarkIndex(index);
    setRemarkValue(content);
    setRemarkModalOpen(true);
  };

  const handleRemarkSubmit = async () => {
    if (!remarkValue.trim()) {
      toast.error('备注内容不能为空');
      return;
    }
    setRemarkLoading(true);
    try {
      const isEdit = editingRemarkIndex !== null;
      const url = isEdit
        ? `/projects/${id}/remarks/${editingRemarkIndex}`
        : `/projects/${id}/remarks`;
      const method = isEdit ? 'patch' : 'post';

      await api[method](url, { content: remarkValue.trim() });
      toast.success(isEdit ? '备注更新成功' : '备注添加成功');
      setRemarkModalOpen(false);
      refetchProject();
    } catch {
      toast.error('操作失败');
    } finally {
      setRemarkLoading(false);
    }
  };

  const handleRemarkDelete = async (index: number) => {
    try {
      await api.delete(`/projects/${id}/remarks/${index}`);
      toast.success('备注删除成功');
      refetchProject();
    } catch {
      toast.error('删除失败');
    }
  };

  // === 客户嘱托编辑 ===
  const handleRequirementAdd = () => {
    setEditingRequirementIndex(null);
    setRequirementValue('');
    setRequirementModalOpen(true);
  };

  const handleRequirementEdit = (index: number, content: string) => {
    setEditingRequirementIndex(index);
    setRequirementValue(content);
    setRequirementModalOpen(true);
  };

  const handleRequirementSubmit = async () => {
    if (!requirementValue.trim()) {
      toast.error('客户嘱托内容不能为空');
      return;
    }
    setRequirementLoading(true);
    try {
      const isEdit = editingRequirementIndex !== null;
      const url = isEdit
        ? `/projects/${id}/client-requirements/${editingRequirementIndex}`
        : `/projects/${id}/client-requirements`;
      const method = isEdit ? 'patch' : 'post';

      await api[method](url, { content: requirementValue.trim() });
      toast.success(isEdit ? '客户嘱托更新成功' : '客户嘱托添加成功');
      setRequirementModalOpen(false);
      refetchProject();
    } catch {
      toast.error('操作失败');
    } finally {
      setRequirementLoading(false);
    }
  };

  const handleRequirementDelete = async (index: number) => {
    try {
      await api.delete(`/projects/${id}/client-requirements/${index}`);
      toast.success('客户嘱托删除成功');
      refetchProject();
    } catch {
      toast.error('删除失败');
    }
  };

  // === 任务相关 ===
  const handleAddTask = () => {
    setSelectedTask(null);
    setTaskModalMode('create');
    setTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalMode('view');
    setTaskModalOpen(true);
  };

  const handleTaskSuccess = () => {
    refetchTasks();
  };

  const handleAssignDesigners = (task: Task) => {
    setCurrentTask(task);
    setMainDesigners(task.mainDesigners || []);
    setAssistantDesigners(task.assistantDesigners || []);
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!currentTask) return;
    setAssignLoading(true);
    try {
      const mainDesignerNames = employees
        .filter((e) => mainDesigners.includes(e._id))
        .map((e) => e.realName);
      const assistantDesignerNames = employees
        .filter((e) => assistantDesigners.includes(e._id))
        .map((e) => e.realName);

      await updateTask.mutateAsync({
        id: currentTask._id,
        data: {
          mainDesigners,
          mainDesignerNames,
          assistantDesigners,
          assistantDesignerNames,
        },
      });
      toast.success('设计师分配成功');
      setAssignModalOpen(false);
      refetchTasks();
    } catch {
      toast.error('分配失败');
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePriorityChange = async (task: Task, priority: TaskPriority) => {
    try {
      await updateTask.mutateAsync({ id: task._id, data: { priority } });
      refetchTasks();
    } catch {
      toast.error('更新失败');
    }
  };

  const handleProcessStepChange = async (task: Task, stepId: string) => {
    try {
      const selectedStep = task.processSteps?.find((s) => s.id === stepId);
      let dueDate = null;
      if (selectedStep?.cycle) {
        dueDate = new Date(Date.now() + selectedStep.cycle * 24 * 60 * 60 * 1000).toISOString();
      }

      const updateData: Record<string, unknown> = { processStepId: stepId, dueDate };
      if (selectedStep?.progressRatio === 100) {
        updateData.priority = 'completed';
      }

      await updateTask.mutateAsync({ id: task._id, data: updateData });
      toast.success('流程状态更新成功');
      refetchTasks();
    } catch {
      toast.error('更新失败');
    }
  };

  // === 规格变更 ===
  const handleSpecificationChange = async (task: Task, specId: string | null) => {
    try {
      // 传递 null 来清除规格，传递 specId 来设置规格
      await updateTask.mutateAsync({
        id: task._id,
        data: {
          specificationId: specId === null ? '' : specId,
          specificationName: specId === null ? '' : undefined  // 清除时也清空名称
        }
      });
      toast.success(specId === null ? '规格已清除' : '规格更新成功');
      refetchTasks();
    } catch {
      toast.error('更新失败');
    }
  };

  if (projectLoading || tasksLoading) {
    return <PageLoading />;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-muted-foreground">项目不存在</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
      </div>
    );
  }

  const progressConfig = progressStatusMap[project.progressStatus];
  const settlementConfig = settlementStatusMap[project.settlementStatus];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
      {/* 页面头部 */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 group">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{project.projectName}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleProjectNameEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Badge className={progressConfig.color}>{progressConfig.label}</Badge>
          <Badge className={settlementConfig.color}>{settlementConfig.label}</Badge>
        </div>
      </div>

      {/* 主体内容区域 */}
      <div className="flex-1 flex min-h-0 px-6 pb-6 gap-6">
        {/* 左侧：基本信息和任务列表 */}
        <div className="flex-1 overflow-auto space-y-6">
          <BasicInfoCard
            project={project}
            teamName={(() => {
              const enterprise = enterprises.find(e => e._id === project.undertakingTeam);
              return enterprise?.enterpriseAlias || enterprise?.enterpriseName || project.undertakingTeam;
            })()}
            taskCount={tasks.length}
            totalAmount={totalAmount}
            projectProgress={projectProgress}
            totalMembers={totalMembers}
            mainDesignerNames={mainDesignerNames}
            assistantDesignerNames={assistantDesignerNames}
            onProjectNameEdit={handleProjectNameEdit}
            onContactEdit={handleContactEdit}
            onTeamEdit={handleTeamEdit}
          />
          <TaskList
            tasks={tasks}
            onAddTask={handleAddTask}
            onTaskClick={handleTaskClick}
            onAssignDesigners={handleAssignDesigners}
            onPriorityChange={handlePriorityChange}
            onProcessStepChange={handleProcessStepChange}
            onSpecificationChange={handleSpecificationChange}
          />
        </div>

        {/* 右侧边栏 */}
        <div className="w-[420px] flex-shrink-0">
          <AdditionalInfoCard
            project={project}
            onRemarkAdd={handleRemarkAdd}
            onRemarkEdit={handleRemarkEdit}
            onRemarkDelete={handleRemarkDelete}
            onRequirementAdd={handleRequirementAdd}
            onRequirementEdit={handleRequirementEdit}
            onRequirementDelete={handleRequirementDelete}
            onProjectFileChange={() => refetchProject()}
          />
        </div>
      </div>

      {/* 模态窗 */}
      <TextEditModal
        open={projectNameModalOpen}
        onOpenChange={setProjectNameModalOpen}
        title="编辑项目名称"
        value={projectNameValue}
        onValueChange={setProjectNameValue}
        onSubmit={handleProjectNameSubmit}
        loading={projectNameLoading}
        placeholder="请输入项目名称"
      />

      <ContactSelectModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        contacts={filteredContacts}
        selectedIds={selectedContacts}
        onSelectedChange={setSelectedContacts}
        onSubmit={handleContactSubmit}
        loading={contactLoading}
        clientName={project.clientName}
      />

      <TeamSelectModal
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
        enterprises={enterprises}
        selectedId={selectedTeam}
        onSelectedChange={setSelectedTeam}
        onSubmit={handleTeamSubmit}
        loading={teamLoading}
      />

      <TextEditModal
        open={remarkModalOpen}
        onOpenChange={setRemarkModalOpen}
        title={editingRemarkIndex !== null ? '编辑备注' : '添加备注'}
        value={remarkValue}
        onValueChange={setRemarkValue}
        onSubmit={handleRemarkSubmit}
        loading={remarkLoading}
        placeholder="请输入备注内容"
        richText
      />

      <TextEditModal
        open={requirementModalOpen}
        onOpenChange={setRequirementModalOpen}
        title={editingRequirementIndex !== null ? '编辑客户嘱托' : '添加客户嘱托'}
        value={requirementValue}
        onValueChange={setRequirementValue}
        onSubmit={handleRequirementSubmit}
        loading={requirementLoading}
        placeholder="请输入客户嘱托内容"
        richText
      />

      {currentTask && (
        <AssignDesignersModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          users={employees}
          taskName={currentTask.taskName}
          mainDesigners={mainDesigners}
          assistantDesigners={assistantDesigners}
          onMainDesignersChange={setMainDesigners}
          onAssistantDesignersChange={setAssistantDesigners}
          onSubmit={handleAssignSubmit}
          loading={assignLoading}
        />
      )}

      <TaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        projectId={id}
        task={selectedTask}
        mode={taskModalMode}
        onSuccess={handleTaskSuccess}
      />
    </div>
  );
}
