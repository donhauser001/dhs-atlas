'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useProject, useUpdateProject } from '@/hooks/queries/use-projects';
import { useClients } from '@/hooks/queries/use-clients';

const editProjectSchema = z.object({
  projectName: z.string().min(1, '请输入项目名称'),
  clientId: z.string().min(1, '请选择客户'),
  clientName: z.string().min(1, '请选择客户'),
  undertakingTeam: z.string().min(1, '请输入承接团队'),
});

type EditProjectForm = z.infer<typeof editProjectSchema>;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProjectPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useProject(id);
  const updateProject = useUpdateProject();
  const { data: clientsData } = useClients();

  const form = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      projectName: '',
      clientId: '',
      clientName: '',
      undertakingTeam: '',
    },
  });

  useEffect(() => {
    if (data?.data) {
      const project = data.data;
      form.reset({
        projectName: project.projectName,
        clientId: project.clientId,
        clientName: project.clientName,
        undertakingTeam: project.undertakingTeam,
      });
    }
  }, [data, form]);

  const onSubmit = async (formData: EditProjectForm) => {
    await updateProject.mutateAsync({ id, data: formData });
    router.push(`/dashboard/projects/${id}`);
  };

  const handleClientChange = (clientId: string) => {
    const client = clientsData?.data?.find((c) => c._id === clientId);
    if (client) {
      form.setValue('clientId', clientId);
      form.setValue('clientName', client.name);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">编辑项目</h1>
          <p className="text-muted-foreground">修改项目信息</p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>修改项目的基本信息</CardDescription>
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

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户 *</FormLabel>
                    <Select onValueChange={handleClientChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择客户" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientsData?.data?.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="undertakingTeam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>承接团队 *</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入承接团队" {...field} />
                    </FormControl>
                    <FormDescription>负责该项目的团队或部门</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={updateProject.isPending}>
              {updateProject.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              保存修改
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

