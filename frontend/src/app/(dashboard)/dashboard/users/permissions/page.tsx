'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, Lock, Info } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageLoading } from '@/components/common/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePermissionTree, useAllPermissions } from '@/hooks/queries/use-permissions';

export default function PermissionsPage() {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const { data: permissionTree, isLoading: treeLoading } = usePermissionTree();
  const { data: allPermissions, isLoading: permissionsLoading } = useAllPermissions();

  const isLoading = treeLoading || permissionsLoading;

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    if (permissionTree) {
      setExpandedModules(new Set(permissionTree.map((m) => m.module)));
    }
  };

  const collapseAll = () => {
    setExpandedModules(new Set());
  };

  if (isLoading) {
    return <PageLoading />;
  }

  const totalPermissions = allPermissions?.length || 0;
  const totalModules = permissionTree?.length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="权限设置"
        description="查看系统所有权限配置，权限通过角色分配给用户"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            全部展开
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            全部折叠
          </Button>
        </div>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">权限总数</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPermissions}</div>
            <p className="text-xs text-muted-foreground">
              系统中定义的所有权限
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">功能模块</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModules}</div>
            <p className="text-xs text-muted-foreground">
              权限分组的模块数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">权限说明</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              权限通过角色分配给用户，请在「角色管理」中配置权限
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 权限树 */}
      <Card>
        <CardHeader>
          <CardTitle>权限列表</CardTitle>
          <CardDescription>
            按功能模块分组展示所有系统权限
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {permissionTree?.map((module) => {
              const isExpanded = expandedModules.has(module.module);
              const permissionCount = module.permissions.length;

              return (
                <Collapsible
                  key={module.module}
                  open={isExpanded}
                  onOpenChange={() => toggleModule(module.module)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-3 px-4 hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium">{module.moduleName}</span>
                      </div>
                      <Badge variant="secondary">
                        {permissionCount} 项权限
                      </Badge>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-11 border-l pl-4 py-2 space-y-1">
                      <TooltipProvider>
                        {module.permissions.map((permission) => (
                          <div
                            key={permission.code}
                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <Lock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{permission.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {permission.code}
                              </code>
                              {permission.description && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{permission.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        ))}
                      </TooltipProvider>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {!permissionTree?.length && (
              <div className="text-center py-8 text-muted-foreground">
                暂无权限数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
