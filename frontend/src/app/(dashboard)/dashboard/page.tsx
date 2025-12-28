import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FolderKanban, 
  Users, 
  FileText, 
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const stats = [
  {
    title: '进行中项目',
    value: '12',
    description: '较上月 +2',
    icon: FolderKanban,
    trend: 'up',
  },
  {
    title: '活跃客户',
    value: '48',
    description: '较上月 +5',
    icon: Users,
    trend: 'up',
  },
  {
    title: '待签合同',
    value: '6',
    description: '需要处理',
    icon: FileText,
    trend: 'neutral',
  },
  {
    title: '本月收入',
    value: '¥128,000',
    description: '较上月 +12%',
    icon: Wallet,
    trend: 'up',
  },
];

const recentProjects = [
  { name: '智能家居系统开发', status: '进行中', progress: 65 },
  { name: '企业官网改版', status: '已完成', progress: 100 },
  { name: 'APP界面设计', status: '进行中', progress: 30 },
  { name: '数据分析平台', status: '待开始', progress: 0 },
];

const pendingTasks = [
  { title: '审核合同 #2024-001', type: '合同', priority: 'high' },
  { title: '跟进客户：张三科技', type: '客户', priority: 'medium' },
  { title: '项目验收：智能家居', type: '项目', priority: 'high' },
  { title: '发票开具申请', type: '财务', priority: 'low' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">工作台</h1>
        <p className="text-muted-foreground">
          欢迎回来，这是您的工作概览
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {stat.trend === 'up' && (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                )}
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>最近项目</CardTitle>
            <CardDescription>您参与的最近项目动态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.name} className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{project.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {project.status === '已完成' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : project.status === '进行中' ? (
                      <Clock className="h-4 w-4 text-blue-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>待办事项</CardTitle>
            <CardDescription>需要您处理的任务</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.title} className="flex items-center gap-4">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-500'
                        : task.priority === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

