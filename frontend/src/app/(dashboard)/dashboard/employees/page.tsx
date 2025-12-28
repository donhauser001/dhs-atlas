'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

// 员工类型
interface Employee {
  _id: string;
  name: string;
  employeeNo: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

// 模拟数据
const mockEmployees: Employee[] = [
  {
    _id: '1',
    name: '张三',
    employeeNo: 'EMP001',
    department: '设计部',
    position: '高级设计师',
    phone: '13800138001',
    email: 'zhangsan@company.com',
    status: 'active',
    joinDate: '2022-03-15',
  },
  {
    _id: '2',
    name: '李四',
    employeeNo: 'EMP002',
    department: '技术部',
    position: '前端工程师',
    phone: '13800138002',
    email: 'lisi@company.com',
    status: 'active',
    joinDate: '2022-06-20',
  },
  {
    _id: '3',
    name: '王五',
    employeeNo: 'EMP003',
    department: '市场部',
    position: '市场经理',
    phone: '13800138003',
    email: 'wangwu@company.com',
    status: 'inactive',
    joinDate: '2021-01-10',
  },
];

export default function EmployeesPage() {
  const [loading] = useState(false);
  const [employees] = useState<Employee[]>(mockEmployees);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    employeeNo: '',
    department: '',
    position: '',
    phone: '',
    email: '',
  });

  const handleCreate = () => {
    if (!newEmployee.name || !newEmployee.employeeNo) {
      toast.error('请填写姓名和工号');
      return;
    }
    toast.success('员工创建成功');
    setCreateDialogOpen(false);
    setNewEmployee({
      name: '',
      employeeNo: '',
      department: '',
      position: '',
      phone: '',
      email: '',
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      toast.success('员工已删除');
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'name',
      header: '员工',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{row.original.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium">{row.original.name}</span>
            <p className="text-xs text-muted-foreground">{row.original.employeeNo}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: '部门',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span>{row.original.department}</span>
        </div>
      ),
    },
    {
      accessorKey: 'position',
      header: '职位',
    },
    {
      accessorKey: 'phone',
      header: '联系方式',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground" />
            {row.original.phone}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) =>
        row.original.status === 'active' ? (
          <Badge className="bg-green-500/10 text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            在职
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            离职
          </Badge>
        ),
    },
    {
      accessorKey: 'joinDate',
      header: '入职日期',
      cell: ({ row }) => format(new Date(row.original.joinDate), 'yyyy-MM-dd'),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem>
              {row.original.status === 'active' ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  设为离职
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  设为在职
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original._id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // 获取部门列表
  const departments = [...new Set(employees.map((e) => e.department))];

  // 筛选
  let filteredEmployees = employees;
  if (departmentFilter !== 'all') {
    filteredEmployees = filteredEmployees.filter((e) => e.department === departmentFilter);
  }
  if (statusFilter !== 'all') {
    filteredEmployees = filteredEmployees.filter((e) => e.status === statusFilter);
  }

  // 统计
  const activeCount = employees.filter((e) => e.status === 'active').length;
  const departmentCount = departments.length;

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="员工管理"
        description="管理公司员工信息"
        action={{
          label: '新建员工',
          onClick: () => setCreateDialogOpen(true),
        }}
      >
        <div className="flex items-center gap-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="部门筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部部门</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">在职</SelectItem>
              <SelectItem value="inactive">离职</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">员工总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在职员工</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">部门数量</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 员工列表 */}
      <DataTable
        columns={columns}
        data={filteredEmployees}
        searchKey="name"
        searchPlaceholder="搜索员工姓名..."
      />

      {/* 新建对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建员工</DialogTitle>
            <DialogDescription>添加新的员工信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeNo">工号 *</Label>
                <Input
                  id="employeeNo"
                  value={newEmployee.employeeNo}
                  onChange={(e) => setNewEmployee({ ...newEmployee, employeeNo: e.target.value })}
                  placeholder="如：EMP001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">部门</Label>
                <Input
                  id="department"
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  placeholder="请输入部门"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">职位</Label>
                <Input
                  id="position"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  placeholder="请输入职位"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  placeholder="请输入电话"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个员工吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
