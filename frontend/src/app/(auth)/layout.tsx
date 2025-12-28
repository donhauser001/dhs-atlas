export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 text-white flex-col justify-between p-12">
        <div>
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <span className="text-xl font-bold text-zinc-900">D</span>
            </div>
            <span className="text-2xl font-bold">唐好思</span>
          </div>
        </div>

        <div className="space-y-6">
          <blockquote className="text-2xl font-medium leading-relaxed">
            「一站式企业管理平台，让您的业务运营更加高效、透明、可控。」
          </blockquote>
          <div className="space-y-1">
            <p className="text-zinc-400">项目管理 · 客户管理 · 合同管理 · 财务管理</p>
          </div>
        </div>

        <div className="text-sm text-zinc-500">
          © {new Date().getFullYear()} 唐好思. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

