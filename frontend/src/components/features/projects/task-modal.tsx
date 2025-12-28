'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Task, CreateTaskRequest, taskApi, TaskPriority } from '@/api/tasks';
import { ServicePricing, PricingPolicy, servicePricingApi, pricingPolicyApi } from '@/api/service-pricing';
import { calculateServicePrice } from '@/utils/priceCalculator';
import { toast } from 'sonner';

// 任务类型
type TaskType = 'service' | 'custom';

// 表单验证 Schema
const taskSchema = z.object({
  taskType: z.enum(['service', 'custom']),
  taskName: z.string().min(1, '请输入任务名称'),
  serviceId: z.string().optional(),
  quantity: z.number().min(1, '数量必须大于0'),
  unit: z.string().min(1, '请输入单位'),
  unitPrice: z.number().min(0, '单价不能为负数'),
  billingDescription: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

// 优先级选项
const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'urgent', label: '十万火急' },
  { value: 'high', label: '尽快完成' },
  { value: 'medium', label: '正常进行' },
  { value: 'low', label: '不太着急' },
];

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: Task | null;
  mode?: 'create' | 'view' | 'edit';
  onSuccess: () => void;
}

export function TaskModal({
  open,
  onOpenChange,
  projectId,
  task,
  mode = 'create',
  onSuccess,
}: TaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [pricingPolicies, setPricingPolicies] = useState<PricingPolicy[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 价格政策选择
  const [selectedPricingPolicy, setSelectedPricingPolicy] = useState<string>('');

  const isViewMode = currentMode === 'view';
  const isCreateMode = currentMode === 'create';
  const isEditMode = currentMode === 'edit';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskType: 'service',
      taskName: '',
      serviceId: '',
      quantity: 1,
      unit: '',
      unitPrice: 0,
      billingDescription: '',
    },
  });

  const taskType = watch('taskType');
  const quantity = watch('quantity');
  const serviceId = watch('serviceId');
  const unitPrice = watch('unitPrice');

  // 当前选中的服务
  const selectedService = useMemo(() => {
    return services.find(s => s._id === serviceId);
  }, [services, serviceId]);

  // 按分类分组服务
  const groupedServices = useMemo(() => {
    const grouped: { [key: string]: ServicePricing[] } = {};
    services.forEach(service => {
      const categoryName = service.categoryName || '未分类';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(service);
    });
    return grouped;
  }, [services]);

  // 计算价格（服务模式）
  const servicePriceResult = useMemo(() => {
    if (taskType !== 'service' || !selectedService || !quantity) {
      return { originalPrice: 0, discountedPrice: 0, discountAmount: 0, calculationDetails: '' };
    }

    const serviceForCalculation = {
      unitPrice: selectedService.unitPrice,
      quantity: quantity,
      unit: selectedService.unit,
      priceDescription: selectedService.priceDescription,
      selectedPricingPolicies: selectedPricingPolicy ? [selectedPricingPolicy] : [],
      pricingPolicyIds: selectedService.pricingPolicyIds,
      pricingPolicyNames: selectedService.pricingPolicyNames,
    };

    return calculateServicePrice(serviceForCalculation, pricingPolicies);
  }, [taskType, selectedService, quantity, selectedPricingPolicy, pricingPolicies]);

  // 计算小计
  const subtotal = useMemo(() => {
    if (taskType === 'service') {
      return servicePriceResult.discountedPrice;
    } else {
      return (unitPrice || 0) * (quantity || 0);
    }
  }, [taskType, servicePriceResult.discountedPrice, unitPrice, quantity]);

  // 获取服务列表和价格政策
  useEffect(() => {
    const fetchData = async () => {
      setServicesLoading(true);
      try {
        const [servicesRes, policiesRes] = await Promise.all([
          servicePricingApi.getAll({ status: 'active', limit: 500 }),
          pricingPolicyApi.getAll({ status: 'active', limit: 500 }),
        ]);
        if (servicesRes.success) {
          setServices(servicesRes.data);
        }
        if (policiesRes.success) {
          setPricingPolicies(policiesRes.data);
        }
      } catch {
        console.error('获取数据失败:', error);
      } finally {
        setServicesLoading(false);
      }
    };
    if (open) {
      fetchData();
    }
  }, [open]);

  // 初始化表单
  useEffect(() => {
    if (open) {
      setCurrentMode(mode);
      setSelectedPricingPolicy('');
      if (task) {
        // 判断是服务类型还是自定义类型
        const isServiceTask = task.serviceId && services.find(s => s._id === task.serviceId);
        setValue('taskType', isServiceTask ? 'service' : 'custom');
        setValue('taskName', task.taskName);
        setValue('serviceId', task.serviceId || '');
        setValue('quantity', task.quantity);
        setValue('unit', task.unit);
        setValue('unitPrice', task.unitPrice || 0);
        setValue('billingDescription', task.billingDescription || '');
        // 恢复选中的价格政策
        if (task.pricingPolicies && task.pricingPolicies.length > 0) {
          setSelectedPricingPolicy(task.pricingPolicies[0].policyId);
        }
      } else {
        reset({
          taskType: 'service',
          taskName: '',
          serviceId: '',
          quantity: 1,
          unit: '',
          unitPrice: 0,
          billingDescription: '',
        });
      }
    }
  }, [open, task, mode, setValue, reset, services]);

  // 切换任务类型时重置相关字段
  const handleTaskTypeChange = (type: TaskType) => {
    setValue('taskType', type);
    setValue('taskName', '');
    setValue('serviceId', '');
    setValue('quantity', 1);
    setValue('unit', '');
    setValue('unitPrice', 0);
    setValue('billingDescription', '');
    setSelectedPricingPolicy('');
  };

  // 选择服务时自动填充信息
  const handleServiceChange = (newServiceId: string) => {
    setValue('serviceId', newServiceId);
    setSelectedPricingPolicy('');

    const service = services.find(s => s._id === newServiceId);
    if (service) {
      setValue('taskName', service.serviceName);
      setValue('unit', service.unit);
      setValue('unitPrice', service.unitPrice);
    }
  };

  // 切换价格政策选择
  const handlePricingPolicyClick = (policyId: string) => {
    if (selectedPricingPolicy === policyId) {
      setSelectedPricingPolicy('');
    } else {
      setSelectedPricingPolicy(policyId);
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    // 服务模式必须选择服务
    if (data.taskType === 'service' && !data.serviceId) {
      toast.error('请选择服务类型');
      return;
    }

    setLoading(true);
    try {
      // 生成计费说明
      let billingDescription = data.billingDescription?.trim();
      if (!billingDescription) {
        if (data.taskType === 'service' && selectedPricingPolicy && servicePriceResult.calculationDetails) {
          billingDescription = servicePriceResult.calculationDetails;
        } else if (data.taskType === 'service' && selectedService?.priceDescription) {
          billingDescription = selectedService.priceDescription;
        } else {
          billingDescription = `${data.taskName} - ${data.quantity}${data.unit}`;
        }
      }

      if (isCreateMode) {
        const createData: CreateTaskRequest = {
          taskName: data.taskName,
          projectId,
          serviceId: data.serviceId || 'custom', // 自定义任务使用 'custom' 作为标识
          quantity: data.quantity,
          unit: data.unit,
          subtotal: subtotal,
          billingDescription,
          pricingPolicies: data.taskType === 'service' && selectedPricingPolicy ? [{
            policyId: selectedPricingPolicy,
            policyName: pricingPolicies.find(p => p._id === selectedPricingPolicy)?.name || '',
            policyType: pricingPolicies.find(p => p._id === selectedPricingPolicy)?.type || 'uniform_discount',
            discountRatio: pricingPolicies.find(p => p._id === selectedPricingPolicy)?.discountRatio || 100,
            calculationDetails: servicePriceResult.calculationDetails,
          }] : [],
        };
        await taskApi.create(createData);
        toast.success('任务创建成功');
      } else if (isEditMode && task) {
        await taskApi.update(task._id, {
          taskName: data.taskName,
          quantity: data.quantity,
          subtotal: subtotal,
          billingDescription,
        });
        toast.success('任务更新成功');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('任务操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : (isCreateMode ? '创建失败' : '更新失败');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setLoading(true);
    try {
      await taskApi.delete(task._id);
      toast.success('任务删除成功');
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error('删除失败');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setCurrentMode(mode);
      setSelectedPricingPolicy('');
    }
    onOpenChange(newOpen);
  };

  const getTitle = () => {
    if (isCreateMode) return '添加任务';
    if (isViewMode) return '任务详情';
    return '编辑任务';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogDescription>
              {isCreateMode ? '选择服务或创建自定义任务' : '查看或编辑任务信息'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-180px)] overflow-auto">
            <div className="px-1 py-2">
            <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* 任务类型选择 - 仅创建模式显示 */}
              {isCreateMode && (
                <div className="space-y-2">
                  <Label>任务类型</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={taskType === 'service' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTaskTypeChange('service')}
                    >
                      选择服务
                    </Button>
                    <Button
                      type="button"
                      variant={taskType === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTaskTypeChange('custom')}
                    >
                      自定义任务
                    </Button>
                  </div>
                </div>
              )}

              {/* 服务模式 */}
              {(taskType === 'service' || !isCreateMode) && isCreateMode && (
                <>
                  {/* 服务类型选择 */}
                  <div className="space-y-2">
                    <Label>选择服务 *</Label>
                    <Select
                      value={serviceId}
                      onValueChange={handleServiceChange}
                      disabled={isViewMode || isEditMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={servicesLoading ? '加载中...' : '请选择服务'} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupedServices).map(([categoryName, categoryServices]) => (
                          <SelectGroup key={categoryName}>
                            <SelectLabel>{categoryName}</SelectLabel>
                            {categoryServices.map((service) => (
                              <SelectItem key={service._id} value={service._id}>
                                {service.serviceName} ({service.unitPrice}元/{service.unit})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 数量和小计 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>数量 *</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register('quantity', { valueAsNumber: true })}
                        disabled={isViewMode}
                      />
                      {errors.quantity && (
                        <p className="text-sm text-destructive">{errors.quantity.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>小计</Label>
                      <Input
                        value={`¥${subtotal.toFixed(2)}`}
                        disabled
                        className="font-medium"
                      />
                    </div>
                  </div>

                  {/* 价格政策选择 */}
                  {selectedService && selectedService.pricingPolicyIds && selectedService.pricingPolicyIds.length > 0 && (
                    <div className="space-y-2">
                      <Label>价格政策</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedService.pricingPolicyIds.map((policyId, index) => {
                          const policyName = selectedService.pricingPolicyNames?.[index] || '未知政策';
                          const isSelected = selectedPricingPolicy === policyId;
                          return (
                            <Badge
                              key={policyId}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer hover:bg-primary/80 transition-colors"
                              onClick={() => handlePricingPolicyClick(policyId)}
                            >
                              {policyName}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">点击选择价格政策，再次点击取消</p>
                    </div>
                  )}

                  {/* 计费说明预览 */}
                  {selectedPricingPolicy && servicePriceResult.calculationDetails && (
                    <div className="space-y-2">
                      <Label>价格计算详情</Label>
                      <div className="p-3 rounded-md bg-muted text-sm whitespace-pre-wrap">
                        {servicePriceResult.calculationDetails}
                      </div>
                      {servicePriceResult.discountAmount > 0 && (
                        <p className="text-sm text-green-600">
                          已优惠: ¥{servicePriceResult.discountAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* 自定义任务模式 */}
              {taskType === 'custom' && isCreateMode && (
                <>
                  {/* 任务名称 */}
                  <div className="space-y-2">
                    <Label>任务名称 *</Label>
                    <Input
                      {...register('taskName')}
                      placeholder="请输入任务名称"
                    />
                    {errors.taskName && (
                      <p className="text-sm text-destructive">{errors.taskName.message}</p>
                    )}
                  </div>

                  {/* 单价、数量、单位 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>单价 (元) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        {...register('unitPrice', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                      {errors.unitPrice && (
                        <p className="text-sm text-destructive">{errors.unitPrice.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>数量 *</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register('quantity', { valueAsNumber: true })}
                      />
                      {errors.quantity && (
                        <p className="text-sm text-destructive">{errors.quantity.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>单位 *</Label>
                      <Input
                        {...register('unit')}
                        placeholder="如：本、张、款"
                      />
                      {errors.unit && (
                        <p className="text-sm text-destructive">{errors.unit.message}</p>
                      )}
                    </div>
                  </div>

                  {/* 小计 */}
                  <div className="space-y-2">
                    <Label>小计</Label>
                    <Input
                      value={`¥${subtotal.toFixed(2)}`}
                      disabled
                      className="font-medium"
                    />
                  </div>

                  {/* 计费说明 */}
                  <div className="space-y-2">
                    <Label>计费说明</Label>
                    <Textarea
                      {...register('billingDescription')}
                      placeholder="请输入计费说明（可选）"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {/* 查看/编辑模式 */}
              {!isCreateMode && (
                <>
                  {/* 任务名称 */}
                  <div className="space-y-2">
                    <Label>任务名称</Label>
                    <Input
                      {...register('taskName')}
                      disabled={isViewMode}
                    />
                  </div>

                  {/* 数量、单位、小计 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>数量</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register('quantity', { valueAsNumber: true })}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>单位</Label>
                      <Input
                        value={task?.unit || ''}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>金额</Label>
                      <Input
                        value={`¥${(task?.subtotal || 0).toFixed(2)}`}
                        disabled
                        className="font-medium"
                      />
                    </div>
                  </div>

                  {/* 计费说明 */}
                  {task?.billingDescription && (
                    <div className="space-y-2">
                      <Label>计费说明</Label>
                      <div className="p-3 rounded-md bg-muted text-sm whitespace-pre-wrap">
                        {task.billingDescription}
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  {/* 任务状态信息 */}
                  <div className="space-y-3">
                    <h4 className="font-medium">任务状态</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">优先级：</span>
                        <span className="font-medium">
                          {priorityOptions.find(p => p.value === task?.priority)?.label || '正常进行'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">当前进度：</span>
                        <span className="font-medium">
                          {task?.currentProcessStep?.name || '未开始'} ({task?.currentProcessStep?.progressRatio || 0}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">结算状态：</span>
                        <span className="font-medium">
                          {task?.settlementStatus === 'unpaid' && '未付款'}
                          {task?.settlementStatus === 'partial-paid' && '部分付款'}
                          {task?.settlementStatus === 'fully-paid' && '已结清'}
                        </span>
                      </div>
                      {task?.dueDate && (
                        <div>
                          <span className="text-muted-foreground">截止日期：</span>
                          <span className="font-medium">
                            {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      )}
                    </div>
                    {(task?.mainDesignerNames?.length || task?.assistantDesignerNames?.length) && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">主创设计师：</span>
                          <span className="font-medium">
                            {task?.mainDesignerNames?.join('、') || '暂无'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">助理设计师：</span>
                          <span className="font-medium">
                            {task?.assistantDesignerNames?.join('、') || '暂无'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </form>
            </div>
          </ScrollArea>

          <DialogFooter>
            {isViewMode && task && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentMode('edit')}
                >
                  编辑
                </Button>
              </>
            )}
            {!isViewMode && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button type="submit" form="task-form" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCreateMode ? '创建' : '保存'}
                </Button>
              </>
            )}
            {isViewMode && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                关闭
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除任务「{task?.taskName}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
