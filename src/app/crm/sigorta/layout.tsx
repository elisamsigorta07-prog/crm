"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  FileText, 
  LogOut,
  ShieldCheck,
  Settings,
  BarChart3,
  Wallet
} from 'lucide-react';
import styles from './layout.module.css';
import GlobalCrmSearch from '@/components/common/GlobalCrmSearch';

export default function SigortaCrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  // If we are on the login page, don't show the sidebar/layout
  if (pathname === '/crm/sigorta/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/crm/sigorta/dashboard', icon: LayoutDashboard },
    { name: 'Müşteriler', href: '/crm/sigorta/musteriler', icon: Users },
    { name: 'Poliçeler', href: '/crm/sigorta/policeler', icon: ShieldAlert },
    { name: 'Teklifler', href: '/crm/sigorta/teklifler', icon: FileText },
    { name: 'Finans', href: '/crm/sigorta/finans', icon: Wallet },
    { name: 'Raporlar', href: '/crm/sigorta/raporlar', icon: BarChart3 },
    { name: 'Ayarlar', href: '/crm/sigorta/ayarlar', icon: Settings },
  ];

  return (
    <div className={styles.crmLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <ShieldCheck size={28} color="#3498db" />
          <h2>Sigorta CRM</h2>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <Link href="/crm/sigorta/login" className={styles.logoutBtn}>
          <LogOut size={18} />
          Çıkış Yap
        </Link>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <h1 className={styles.topbarTitle}>
            {navItems.find(item => item.href === pathname)?.name || 'Sigorta Paneli'}
          </h1>

          <GlobalCrmSearch />
          
          <div className={styles.userProfile}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Eray Baysal</span>
              <span className={styles.userRole}>Yönetici</span>
            </div>
            <div className={styles.avatar}>EB</div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
