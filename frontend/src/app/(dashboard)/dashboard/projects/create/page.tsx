'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Loader2,
  FileText,
  ShoppingCart,
  Check,
  Trash2,
  Plus,
  Minus,
  ChevronRight,
  Building2,
  Users,
  ClipboardList,
  Save,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useCreateProject } from '@/hooks/queries/use-projects';
import { useClients } from '@/hooks/queries/use-clients';
import { useUsers } from '@/hooks/queries/use-users';
import { quotationApi, Quotation } from '@/api/quotations';
import { servicePricingApi, pricingPolicyApi, ServicePricing, PricingPolicy } from '@/api/service-pricing';
import { getActiveEnterprises, Enterprise } from '@/api/enterprises';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 数据持久化键名
const STORAGE_KEYS = {
  CURRENT_STEP: 'createProject_currentStep',
  SELECTED_SERVICES: 'createProject_selectedServices',
  SERVICE_QUANTITIES: 'createProject_serviceQuantities',
  FORM_DATA: 'createProject_formData',
  CLIENT_REQUIREMENTS: 'createProject_clientRequirements',
  REMARK: 'createProject_remark',
};

// 安全的 localStorage 操作
const safeLocalStorage = {
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`localStorage setItem failed for ${key}:`, e);
      return false;
    }
  },
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage getItem failed for ${key}:`, e);
      return null;
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage removeItem failed for ${key}:`, e);
    }
  },
};

// 表单验证 schema
const createProjectSchema = z.object({
  projectName: z.string().min(1, '请输入项目名称'),
  clientId: z.string().min(1, '请选择客户'),
  clientName: z.string().min(1, '请选择客户'),
  contactIds: z.array(z.string()).min(1, '请选择联系人'),
  contactNames: z.array(z.string()).default([]),
  contactPhones: z.array(z.string()).default([]),
  undertakingTeam: z.string().min(1, '请选择承接团队'),
  undertakingTeamName: z.string().optional(),
  clientRequirements: z.string().optional(),
  remark: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

// 选中的服务类型
interface SelectedService extends ServicePricing {
  quantity: number;
  selectedPricingPolicies: string[];
}

// 步骤配置
const steps = [
  { id: 1, title: '基本信息', description: '填写项目基本信息', icon: FileText },
  { id: 2, title: '任务列表', description: '选择服务项目', icon: ClipboardList },
  { id: 3, title: '订单信息', description: '确认订单详情', icon: ShoppingCart },
];

export default function CreateProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();
  const { data: clientsData } = useClients({ limit: 500 });
  const { data: usersData } = useUsers({ role: '客户', limit: 1000 });

  // 状态管理 - 初始值使用默认值，避免 Hydration 错误
  const [currentStep, setCurrentStep] = useState(1);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [serviceDetails, setServiceDetails] = useState<ServicePricing[]>([]);
  const [pricingPolicies, setPricingPolicies] = useState<PricingPolicy[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [selectedSaveAction, setSelectedSaveAction] = useState<'order' | 'draft' | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [_isHydrated, setIsHydrated] = useState(false);

  // 客户端挂载后从 localStorage 恢复状态
  useEffect(() => {
    setIsHydrated(true);

    const savedStep = safeLocalStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }

    const savedServices = safeLocalStorage.getItem(STORAGE_KEYS.SELECTED_SERVICES);
    if (savedServices) {
      try {
        const services = JSON.parse(savedServices);
        setSelectedServices(services);
        setSelectedServiceIds(services.map((s: SelectedService) => s._id));
      } catch (e) {
        console.warn('Failed to parse saved services:', e);
      }
    }

    const savedQuantities = safeLocalStorage.getItem(STORAGE_KEYS.SERVICE_QUANTITIES);
    if (savedQuantities) {
      try {
        setServiceQuantities(JSON.parse(savedQuantities));
      } catch (e) {
        console.warn('Failed to parse saved quantities:', e);
      }
    }
  }, []);

  // 表单
  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      projectName: '',
      clientId: '',
      clientName: '',
      contactIds: [],
      contactNames: [],
      contactPhones: [],
      undertakingTeam: '',
      undertakingTeamName: '',
      clientRequirements: '',
      remark: '',
    },
  });

  const clientId = form.watch('clientId');

  // 过滤联系人（根据选中的客户）
  const filteredContacts = useMemo(() => {
    if (!clientId || !usersData?.data) return [];
    const selectedClient = clientsData?.data?.find((c) => c._id === clientId);
    if (!selectedClient) return [];

    return usersData.data.filter((contact) => {
      if (!contact.company) return false;
      const contactCompany = contact.company.trim();
      const clientName = selectedClient.name.trim();
      return (
        contactCompany === clientName ||
        contactCompany.includes(clientName) ||
        clientName.includes(contactCompany)
      );
    });
  }, [clientId, clientsData?.data, usersData?.data]);

  // 获取企业列表
  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        const response = await getActiveEnterprises();
        if (response.success) {
          setEnterprises(response.data);
        }
      } catch (error) {
        console.error('获取企业列表失败:', error);
      }
    };
    fetchEnterprises();
  }, []);

  // 获取定价政策
  useEffect(() => {
    const fetchPricingPolicies = async () => {
      try {
        const response = await pricingPolicyApi.getAll({ status: 'active', limit: 100 });
        if (response.success) {
          setPricingPolicies(response.data);
        }
      } catch (error) {
        console.error('获取定价政策失败:', error);
      }
    };
    fetchPricingPolicies();
  }, []);

  // 当客户变化时，获取关联的报价单
  useEffect(() => {
    const fetchQuotations = async () => {
      if (!clientId) {
        setQuotations([]);
        setServiceDetails([]);
        return;
      }

      try {
        const response = await quotationApi.getByClientId(clientId);
        if (response.success && response.data.length > 0) {
          setQuotations(response.data);
        } else {
          // 如果没有客户报价单，获取默认报价单
          const defaultResponse = await quotationApi.getAll({ status: 'active', limit: 100 });
          if (defaultResponse.success) {
            const defaultQuotation = defaultResponse.data.find((q) => q.isDefault);
            setQuotations(defaultQuotation ? [defaultQuotation] : defaultResponse.data.slice(0, 1));
          }
        }
      } catch (error) {
        console.error('获取报价单失败:', error);
      }
    };
    fetchQuotations();
  }, [clientId]);

  // 当报价单变化时，获取服务详情
  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (quotations.length === 0 || quotations[0].selectedServices.length === 0) {
        setServiceDetails([]);
        return;
      }

      try {
        const serviceIds = quotations[0].selectedServices;
        const details = await Promise.all(
          serviceIds.map(async (serviceId) => {
            const response = await servicePricingApi.getById(serviceId);
            return response.success ? response.data : null;
          })
        );

        const validDetails = details.filter(Boolean) as ServicePricing[];
        const uniqueDetails = validDetails.filter(
          (service, index, self) => index === self.findIndex((s) => s._id === service._id)
        );
        setServiceDetails(uniqueDetails);
      } catch (error) {
        console.error('获取服务详情失败:', error);
      }
    };
    fetchServiceDetails();
  }, [quotations]);

  // 按分类分组服务
  const groupedServices = useMemo(() => {
    const uniqueServices = serviceDetails.filter(
      (service, index, self) => index === self.findIndex((s) => s._id === service._id)
    );

    return uniqueServices.reduce(
      (acc, service) => {
        const category = service.categoryName || '未分类';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(service);
        return acc;
      },
      {} as Record<string, ServicePricing[]>
    );
  }, [serviceDetails]);

  // 数据持久化 - 步骤
  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeLocalStorage.setItem(STORAGE_KEYS.CURRENT_STEP, currentStep.toString());
    }
  }, [currentStep]);

  // 数据持久化 - 选中的服务
  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeLocalStorage.setItem(STORAGE_KEYS.SELECTED_SERVICES, JSON.stringify(selectedServices));
    }
  }, [selectedServices]);

  // 数据持久化 - 服务数量
  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeLocalStorage.setItem(STORAGE_KEYS.SERVICE_QUANTITIES, JSON.stringify(serviceQuantities));
    }
  }, [serviceQuantities]);

  // 恢复表单数据（包括富文本内容）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 恢复基本表单数据
      const savedFormData = safeLocalStorage.getItem(STORAGE_KEYS.FORM_DATA);
      if (savedFormData) {
        try {
          const data = JSON.parse(savedFormData);
          Object.keys(data).forEach((key) => {
            form.setValue(key as keyof CreateProjectForm, data[key]);
          });
        } catch (e) {
          console.warn('Failed to parse saved form data:', e);
        }
      }

      // 恢复富文本内容 - 客户嘱托
      const savedClientRequirements = safeLocalStorage.getItem(STORAGE_KEYS.CLIENT_REQUIREMENTS);
      if (savedClientRequirements) {
        form.setValue('clientRequirements', savedClientRequirements);
      }

      // 恢复富文本内容 - 备注
      const savedRemark = safeLocalStorage.getItem(STORAGE_KEYS.REMARK);
      if (savedRemark) {
        form.setValue('remark', savedRemark);
      }
    }
  }, [form]);

  // 监听表单变化并保存
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (typeof window !== 'undefined') {
        // 分离富文本字段，单独存储
        const { clientRequirements, remark, ...basicData } = data;

        // 保存基本表单数据
        safeLocalStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(basicData));

        // 单独保存富文本内容（可能包含 base64 图片）
        if (clientRequirements) {
          safeLocalStorage.setItem(STORAGE_KEYS.CLIENT_REQUIREMENTS, clientRequirements);
        }
        if (remark) {
          safeLocalStorage.setItem(STORAGE_KEYS.REMARK, remark);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // 清空暂存数据
  const clearStoredData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      safeLocalStorage.removeItem(key);
    });
    form.reset();
    setSelectedServices([]);
    setSelectedServiceIds([]);
    setServiceQuantities({});
    setCurrentStep(1);
  }, [form]);

  // 客户选择变化处理
  const handleClientChange = (newClientId: string) => {
    const client = clientsData?.data?.find((c) => c._id === newClientId);
    if (client) {
      form.setValue('clientId', newClientId);
      form.setValue('clientName', client.name);
      form.setValue('contactIds', []);
      form.setValue('contactNames', []);
      form.setValue('contactPhones', []);
    }
  };

  // 联系人选择变化处理
  const handleContactChange = (contactId: string, checked: boolean) => {
    const currentContactIds = form.getValues('contactIds') || [];
    let newContactIds: string[];

    if (checked) {
      newContactIds = [...currentContactIds, contactId];
    } else {
      newContactIds = currentContactIds.filter((id) => id !== contactId);
    }

    const selectedContacts = filteredContacts.filter((c) => newContactIds.includes(c._id));
    form.setValue('contactIds', newContactIds);
    form.setValue(
      'contactNames',
      selectedContacts.map((c) => c.realName || '')
    );
    form.setValue(
      'contactPhones',
      selectedContacts.map((c) => c.phone || '')
    );
  };

  // 承接团队选择变化处理
  const handleTeamChange = (teamId: string) => {
    const enterprise = enterprises.find((e) => e._id === teamId);
    form.setValue('undertakingTeam', teamId);
    form.setValue('undertakingTeamName', enterprise?.enterpriseAlias || enterprise?.enterpriseName || '');
  };

  // 服务选择切换
  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServiceIds((prev) => [...prev, serviceId]);
      setServiceQuantities((prev) => ({ ...prev, [serviceId]: 1 }));

      const service = serviceDetails.find((s) => s._id === serviceId);
      if (service) {
        setSelectedServices((prev) => [
          ...prev,
          {
            ...service,
            quantity: 1,
            selectedPricingPolicies: [],
          },
        ]);
      }
    } else {
      setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
      setServiceQuantities((prev) => {
        const newQuantities = { ...prev };
        delete newQuantities[serviceId];
        return newQuantities;
      });
      setSelectedServices((prev) => prev.filter((s) => s._id !== serviceId));
    }
  };

  // 服务数量变化
  const handleQuantityChange = (serviceId: string, quantity: number) => {
    setServiceQuantities((prev) => ({ ...prev, [serviceId]: quantity }));
    setSelectedServices((prev) =>
      prev.map((s) => (s._id === serviceId ? { ...s, quantity } : s))
    );
  };

  // 定价政策选择变化
  const handlePricingPolicyChange = (serviceId: string, policyId: string, checked: boolean) => {
    setSelectedServices((prev) =>
      prev.map((s) => {
        if (s._id === serviceId) {
          // 单选逻辑
          const newPolicies = checked ? [policyId] : [];
          return { ...s, selectedPricingPolicies: newPolicies };
        }
        return s;
      })
    );
  };

  // 价格计算函数
  const calculatePrice = useCallback(
    (service: SelectedService) => {
      const originalPrice = service.unitPrice * service.quantity;

      if (!service.selectedPricingPolicies || service.selectedPricingPolicies.length === 0) {
        return {
          originalPrice,
          discountedPrice: originalPrice,
          discountAmount: 0,
          calculationDetails: `${service.unitPrice.toLocaleString()} × ${service.quantity} = ¥${originalPrice.toLocaleString()}`,
        };
      }

      const selectedPolicyId = service.selectedPricingPolicies[0];
      const selectedPolicy = pricingPolicies.find((p) => p._id === selectedPolicyId);

      if (!selectedPolicy || selectedPolicy.status !== 'active') {
        return {
          originalPrice,
          discountedPrice: originalPrice,
          discountAmount: 0,
          calculationDetails: `${service.unitPrice.toLocaleString()} × ${service.quantity} = ¥${originalPrice.toLocaleString()}`,
        };
      }

      let discountedPrice = originalPrice;
      let calculationDetails = '';

      if (selectedPolicy.type === 'uniform_discount') {
        const discountRatio = selectedPolicy.discountRatio || 100;
        discountedPrice = (originalPrice * discountRatio) / 100;
        calculationDetails = `原价: ¥${originalPrice.toLocaleString()}\n折扣: ${discountRatio}%\n优惠后: ¥${discountedPrice.toLocaleString()}`;
      } else if (selectedPolicy.type === 'tiered_discount' && selectedPolicy.tierSettings) {
        const unitPrice = service.unitPrice;
        let totalDiscountedPrice = 0;
        const sortedTiers = [...selectedPolicy.tierSettings].sort(
          (a, b) => (a.startQuantity || 0) - (b.startQuantity || 0)
        );
        let remainingQuantity = service.quantity;
        const tierDetails: string[] = [];

        for (const tier of sortedTiers) {
          if (remainingQuantity <= 0) break;

          const startQuantity = tier.startQuantity || 0;
          const endQuantity = tier.endQuantity || Infinity;
          const discountRatio = tier.discountRatio || 100;

          let tierQuantity = 0;
          if (endQuantity === Infinity) {
            tierQuantity = remainingQuantity;
          } else {
            const tierCapacity = endQuantity - startQuantity + 1;
            tierQuantity = Math.min(remainingQuantity, tierCapacity);
          }

          if (tierQuantity > 0) {
            const tierPrice = unitPrice * tierQuantity;
            const tierDiscountedPrice = (tierPrice * discountRatio) / 100;
            totalDiscountedPrice += tierDiscountedPrice;
            tierDetails.push(`${tierQuantity}${service.unit} × ${discountRatio}%`);
            remainingQuantity -= tierQuantity;
          }
        }

        discountedPrice = totalDiscountedPrice;
        calculationDetails = `阶梯折扣:\n${tierDetails.join('\n')}\n合计: ¥${discountedPrice.toLocaleString()}`;
      }

      const discountAmount = originalPrice - discountedPrice;

      return {
        originalPrice,
        discountedPrice,
        discountAmount,
        calculationDetails,
      };
    },
    [pricingPolicies]
  );

  // 计算总金额
  const totalAmounts = useMemo(() => {
    const totalAmount = selectedServices.reduce((sum, service) => {
      const priceResult = calculatePrice(service);
      return sum + priceResult.discountedPrice;
    }, 0);

    const originalTotalAmount = selectedServices.reduce((sum, service) => {
      return sum + service.unitPrice * service.quantity;
    }, 0);

    const totalDiscountAmount = originalTotalAmount - totalAmount;

    return { totalAmount, originalTotalAmount, totalDiscountAmount };
  }, [selectedServices, calculatePrice]);

  // 步骤验证
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      const values = form.getValues();
      if (!values.projectName || !values.clientId || values.contactIds.length === 0 || !values.undertakingTeam) {
        toast.error('请填写所有必填信息');
        return false;
      }
    } else if (step === 2) {
      if (selectedServices.length === 0) {
        toast.error('请至少选择一个服务项目');
        return false;
      }
    }
    return true;
  };

  // 步骤导航
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // 显示保存确认弹窗
  const showSaveModal = () => {
    if (!validateStep(1) || !validateStep(2)) return;
    setSaveModalVisible(true);
  };

  // 保存项目
  const handleSaveConfirm = async () => {
    if (!selectedSaveAction) return;

    try {
      setLoading(true);

      const formValues = form.getValues();
      const projectData = {
        projectName: formValues.projectName,
        clientId: formValues.clientId,
        clientName: formValues.clientName,
        contactIds: formValues.contactIds,
        contactNames: formValues.contactNames,
        contactPhones: formValues.contactPhones,
        undertakingTeam: formValues.undertakingTeam,
        clientRequirements: formValues.clientRequirements,
        remark: formValues.remark,
      };

      await createProject.mutateAsync(projectData);

      const actionText = selectedSaveAction === 'order' ? '下单' : '暂存';
      toast.success(`项目${actionText}成功`);

      clearStoredData();
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setLoading(false);
      setSaveModalVisible(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">创建新项目</h1>
            <p className="text-muted-foreground">按步骤填写项目信息</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={clearStoredData}>
          <Trash2 className="h-4 w-4 mr-2" />
          清空暂存
        </Button>
      </div>

      {/* Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      currentStep >= step.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        'font-medium',
                        currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.id === 2 && selectedServices.length > 0
                        ? `已选 ${selectedServices.length} 项`
                        : step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4',
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Form {...form}>
        <form className="space-y-6">
          {/* Step 1: 基本信息 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    基本信息
                  </CardTitle>
                  <CardDescription>填写项目的基本信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>项目名称 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入项目名称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>客户 *</FormLabel>
                          <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={clientPopoverOpen}
                                  className={cn(
                                    'w-full justify-between font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value
                                    ? clientsData?.data?.find((c) => c._id === field.value)?.name
                                    : '请选择客户'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="搜索客户..." />
                                <CommandList>
                                  <CommandEmpty>未找到客户</CommandEmpty>
                                  <CommandGroup>
                                    {clientsData?.data?.map((client) => (
                                      <CommandItem
                                        key={client._id}
                                        value={client.name}
                                        onSelect={() => {
                                          handleClientChange(client._id);
                                          setClientPopoverOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            field.value === client._id ? 'opacity-100' : 'opacity-0'
                                          )}
                                        />
                                        {client.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem className="flex flex-col">
                      <FormLabel>联系人 *</FormLabel>
                      <Popover open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={contactPopoverOpen}
                            disabled={!clientId}
                            className={cn(
                              'w-full justify-between font-normal',
                              form.watch('contactIds')?.length === 0 && 'text-muted-foreground'
                            )}
                          >
                            {!clientId
                              ? '请先选择客户'
                              : form.watch('contactIds')?.length > 0
                                ? `已选择 ${form.watch('contactIds')?.length} 个联系人`
                                : '请选择联系人'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="搜索联系人..." />
                            <CommandList>
                              <CommandEmpty>
                                {filteredContacts.length === 0 ? '该客户暂无联系人' : '未找到联系人'}
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredContacts.map((contact) => {
                                  const isSelected = form.watch('contactIds')?.includes(contact._id);
                                  return (
                                    <CommandItem
                                      key={contact._id}
                                      value={`${contact.realName} ${contact.position || ''}`}
                                      onSelect={() => {
                                        handleContactChange(contact._id, !isSelected);
                                      }}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        className="mr-2"
                                      />
                                      <span>
                                        {contact.realName}
                                        {contact.position && (
                                          <span className="text-muted-foreground ml-1">
                                            ({contact.position})
                                          </span>
                                        )}
                                      </span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {form.watch('contactIds')?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {form.watch('contactIds')?.map((contactId) => {
                            const contact = filteredContacts.find((c) => c._id === contactId);
                            return contact ? (
                              <Badge
                                key={contactId}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => handleContactChange(contactId, false)}
                              >
                                {contact.realName}
                                <span className="ml-1 text-muted-foreground">×</span>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                      {form.formState.errors.contactIds && (
                        <p className="text-sm font-medium text-destructive">
                          {form.formState.errors.contactIds.message}
                        </p>
                      )}
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="undertakingTeam"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>承接团队 *</FormLabel>
                          <Select onValueChange={handleTeamChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择承接团队" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {enterprises.map((enterprise) => (
                                <SelectItem key={enterprise._id} value={enterprise._id}>
                                  {enterprise.enterpriseAlias || enterprise.enterpriseName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>负责该项目的团队或部门</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    客户嘱托与备注
                  </CardTitle>
                  <CardDescription>填写项目的补充信息（可选）</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>客户嘱托</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="请输入客户的特殊要求或嘱托"
                            minHeight="150px"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>项目备注</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="请输入备注信息"
                            minHeight="150px"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: 任务列表 */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      报价单服务项目
                    </CardTitle>
                    <CardDescription>
                      {quotations.length > 0
                        ? `${quotations[0].name} - 包含 ${serviceDetails.length} 项服务`
                        : '请先选择客户以查看关联的报价单'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    已选择: {selectedServices.length} 项
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!clientId ? (
                  <div className="text-center py-12 text-muted-foreground">
                    请先在第一步选择客户
                  </div>
                ) : serviceDetails.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    该客户暂无关联的报价单或服务项目
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedServices).map(([category, services]) => (
                      <Collapsible key={category} defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-90" />
                            <span className="font-medium">{category}</span>
                            <Badge variant="outline">{services.length} 项</Badge>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                            {services.map((service) => {
                              const isSelected = selectedServiceIds.includes(service._id);
                              return (
                                <Card
                                  key={service._id}
                                  className={cn(
                                    'cursor-pointer transition-all',
                                    isSelected && 'ring-2 ring-primary'
                                  )}
                                  onClick={() => handleServiceToggle(service._id, !isSelected)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) =>
                                          handleServiceToggle(service._id, !!checked)
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="font-medium truncate">
                                            {service.serviceName}
                                          </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          ¥{service.unitPrice.toLocaleString()}/{service.unit}
                                        </p>
                                        {service.pricingPolicyNames &&
                                          service.pricingPolicyNames.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                              {service.pricingPolicyNames.map((name, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                  {name}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        {isSelected && (
                                          <div
                                            className="flex items-center gap-2 mt-3"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <span className="text-sm text-muted-foreground">数量:</span>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() =>
                                                  handleQuantityChange(
                                                    service._id,
                                                    Math.max(1, (serviceQuantities[service._id] || 1) - 1)
                                                  )
                                                }
                                              >
                                                <Minus className="h-3 w-3" />
                                              </Button>
                                              <Input
                                                type="number"
                                                min={1}
                                                value={serviceQuantities[service._id] || 1}
                                                onChange={(e) =>
                                                  handleQuantityChange(
                                                    service._id,
                                                    Math.max(1, parseInt(e.target.value) || 1)
                                                  )
                                                }
                                                className="h-7 w-16 text-center"
                                              />
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() =>
                                                  handleQuantityChange(
                                                    service._id,
                                                    (serviceQuantities[service._id] || 1) + 1
                                                  )
                                                }
                                              >
                                                <Plus className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                              {service.unit}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: 订单信息 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* 项目信息概览 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    项目信息概览：{form.watch('projectName') || '未填写'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">客户信息</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        <p>客户名称：{form.watch('clientName') || '未选择'}</p>
                        <p>
                          联系人：
                          {form.watch('contactNames')?.length > 0
                            ? form
                              .watch('contactNames')
                              .map(
                                (name, idx) =>
                                  `${name}(${form.watch('contactPhones')?.[idx] || ''})`
                              )
                              .join(', ')
                            : '未选择'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">团队信息</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        <p>承接团队：{form.watch('undertakingTeamName') || '未选择'}</p>
                      </div>
                    </div>
                    {form.watch('clientRequirements') && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ClipboardList className="h-4 w-4" />
                          <span className="font-medium">客户嘱托</span>
                        </div>
                        <div
                          className="pl-6 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: form.watch('clientRequirements') || '' }}
                        />
                      </div>
                    )}
                    {form.watch('remark') && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">备注信息</span>
                        </div>
                        <div
                          className="pl-6 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: form.watch('remark') || '' }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 已选服务项目表格 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      已选服务项目
                    </CardTitle>
                    <Badge variant="secondary">{selectedServices.length} 项</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[20%]">服务项目</TableHead>
                        <TableHead className="w-[12%]">分类</TableHead>
                        <TableHead className="w-[12%]">单价</TableHead>
                        <TableHead className="w-[12%]">数量</TableHead>
                        <TableHead className="w-[18%]">定价政策</TableHead>
                        <TableHead className="w-[14%]">价格说明</TableHead>
                        <TableHead className="w-[12%] text-right">小计</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedServices.map((service) => {
                        const priceResult = calculatePrice(service);
                        return (
                          <TableRow key={service._id}>
                            <TableCell className="font-medium">{service.serviceName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{service.categoryName || '未分类'}</Badge>
                            </TableCell>
                            <TableCell>
                              ¥{service.unitPrice.toLocaleString()}/{service.unit}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    handleQuantityChange(
                                      service._id,
                                      Math.max(1, service.quantity - 1)
                                    )
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min={1}
                                  value={service.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      service._id,
                                      Math.max(1, parseInt(e.target.value) || 1)
                                    )
                                  }
                                  className="h-7 w-14 text-center"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    handleQuantityChange(service._id, service.quantity + 1)
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm text-muted-foreground ml-1">
                                  {service.unit}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {service.pricingPolicyIds && service.pricingPolicyIds.length > 0 ? (
                                <div className="space-y-1">
                                  {service.pricingPolicyIds.map((policyId, idx) => {
                                    const policyName = service.pricingPolicyNames?.[idx] || '未知政策';
                                    const isChecked =
                                      service.selectedPricingPolicies?.includes(policyId) || false;
                                    return (
                                      <label
                                        key={policyId}
                                        className="flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={(checked) =>
                                            handlePricingPolicyChange(service._id, policyId, !!checked)
                                          }
                                        />
                                        <Badge variant="secondary" className="text-xs">
                                          {policyName}
                                        </Badge>
                                      </label>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">无政策</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                {priceResult.calculationDetails}
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              {priceResult.discountAmount > 0 ? (
                                <div>
                                  <p className="text-muted-foreground line-through text-sm">
                                    ¥{priceResult.originalPrice.toLocaleString()}
                                  </p>
                                  <p className="font-medium">
                                    ¥{priceResult.discountedPrice.toLocaleString()}
                                  </p>
                                </div>
                              ) : (
                                <p className="font-medium">
                                  ¥{priceResult.discountedPrice.toLocaleString()}
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* 总计 */}
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <div className="text-right space-y-1">
                      {totalAmounts.totalDiscountAmount > 0 && (
                        <>
                          <p className="text-muted-foreground">
                            原价总额:{' '}
                            <span className="line-through">
                              ¥{totalAmounts.originalTotalAmount.toLocaleString()}
                            </span>
                          </p>
                          <p className="text-green-600">
                            优惠金额: -¥{totalAmounts.totalDiscountAmount.toLocaleString()}
                          </p>
                        </>
                      )}
                      <p className="text-lg font-bold">
                        最终金额: ¥{totalAmounts.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              上一步
            </Button>
            <div className="flex gap-2">
              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext}>
                  下一步
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={showSaveModal} size="lg">
                  <Save className="h-4 w-4 mr-2" />
                  保存项目
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>

      {/* 保存确认弹窗 */}
      <Dialog open={saveModalVisible} onOpenChange={setSaveModalVisible}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              确认保存项目
            </DialogTitle>
            <DialogDescription>请确认项目信息并选择保存方式</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 项目信息概览 */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">项目信息概览</CardTitle>
              </CardHeader>
              <CardContent className="py-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <span className="font-medium">项目名称：</span>
                      {form.watch('projectName')}
                    </p>
                    <p>
                      <span className="font-medium">客户：</span>
                      {form.watch('clientName')}
                    </p>
                    <p>
                      <span className="font-medium">承接团队：</span>
                      {form.watch('undertakingTeamName')}
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">服务项目：</span>
                      {selectedServices.length} 项
                    </p>
                    <p>
                      <span className="font-medium">联系人：</span>
                      {form.watch('contactNames')?.join(', ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 金额统计 */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  金额统计
                </CardTitle>
              </CardHeader>
              <CardContent className="py-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-muted-foreground text-sm">原价总额</p>
                    <p className="text-lg line-through text-muted-foreground">
                      ¥{totalAmounts.originalTotalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">优惠金额</p>
                    <p className="text-lg text-green-600">
                      ¥{totalAmounts.totalDiscountAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">最终金额</p>
                    <p className="text-xl font-bold text-primary">
                      ¥{totalAmounts.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 选择保存方式 */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">选择保存方式</CardTitle>
              </CardHeader>
              <CardContent className="py-3">
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      selectedSaveAction === 'order' && 'ring-2 ring-primary'
                    )}
                    onClick={() => setSelectedSaveAction('order')}
                  >
                    <CardContent className="p-4 text-center">
                      <ShoppingCart
                        className={cn(
                          'h-8 w-8 mx-auto mb-2',
                          selectedSaveAction === 'order' ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <p className="font-medium">直接下单</p>
                      <p className="text-xs text-muted-foreground mt-1">项目状态：进行中</p>
                      <p className="text-xs text-muted-foreground">项目将直接开启</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      selectedSaveAction === 'draft' && 'ring-2 ring-orange-500'
                    )}
                    onClick={() => setSelectedSaveAction('draft')}
                  >
                    <CardContent className="p-4 text-center">
                      <Save
                        className={cn(
                          'h-8 w-8 mx-auto mb-2',
                          selectedSaveAction === 'draft' ? 'text-orange-500' : 'text-muted-foreground'
                        )}
                      />
                      <p className="font-medium">暂存为临时订单</p>
                      <p className="text-xs text-muted-foreground mt-1">项目状态：咨询中</p>
                      <p className="text-xs text-muted-foreground">待确认后再操作</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveModalVisible(false)} disabled={loading}>
              取消
            </Button>
            <Button onClick={handleSaveConfirm} disabled={!selectedSaveAction || loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
