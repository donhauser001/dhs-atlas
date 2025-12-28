import Link from 'next/link';
import { ArrowRight, BarChart3, FileText, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Users,
    title: '客户管理',
    description: '完善的客户信息管理，联系人跟踪，客户分类，助力业务拓展。',
  },
  {
    icon: FileText,
    title: '合同管理',
    description: '合同模板、电子签章、合同生成与归档，全流程数字化管理。',
  },
  {
    icon: BarChart3,
    title: '财务管理',
    description: '收入管理、发票开具、订单跟踪、结算对账，财务一目了然。',
  },
  {
    icon: Zap,
    title: '项目管理',
    description: '项目全周期管理，任务分配，进度跟踪，文件协作。',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,var(--tw-gradient-from)_0%,transparent_100%)] from-muted/50" />
        <div className="container py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              企业管理
              <span className="text-primary">更简单</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              唐好思为您提供一站式企业管理解决方案，涵盖客户管理、项目管理、
              合同管理、财务管理等核心业务模块，助力企业数字化转型。
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">
                  立即体验
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">联系我们</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              核心功能
            </h2>
            <p className="mt-4 text-muted-foreground">
              全方位的企业管理工具，满足您的各种业务需求
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              准备好开始了吗？
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              立即注册，开启高效企业管理之旅
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/login">
                  免费试用
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

