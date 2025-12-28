import Link from 'next/link';

const footerLinks = {
  services: [
    { name: '项目管理', href: '/services#projects' },
    { name: '客户管理', href: '/services#clients' },
    { name: '合同管理', href: '/services#contracts' },
    { name: '财务管理', href: '/services#finance' },
  ],
  company: [
    { name: '关于我们', href: '/about' },
    { name: '联系我们', href: '/contact' },
    { name: '案例展示', href: '/cases' },
  ],
  legal: [
    { name: '隐私政策', href: '/privacy' },
    { name: '服务条款', href: '/terms' },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">D</span>
              </div>
              <span className="text-xl font-bold">唐好思</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              专业的企业管理解决方案，助力企业高效运营。
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold">服务</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold">公司</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold">法律</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} 唐好思. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

