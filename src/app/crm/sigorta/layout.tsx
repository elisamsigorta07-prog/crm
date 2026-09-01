"use client";

import { useState, useEffect } from 'react';
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
  Wallet,
  Menu,
  X
} from 'lucide-react';
import styles from './layout.module.css';
import GlobalCrmSearch from '@/components/common/GlobalCrmSearch';

export default function SigortaCrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // If we are on the login page, don't show the sidebar/layout
  if (pathname === '/crm/sigorta/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/crm/sigorta/dashboard', icon: LayoutDashboard },
    { name: 'Poliçeler', href: '/crm/sigorta/policeler', icon: ShieldAlert },
    { name: 'Teklifler', href: '/crm/sigorta/teklifler', icon: FileText },
    { name: 'Finans', href: '/crm/sigorta/finans', icon: Wallet },
    { name: 'Raporlar', href: '/crm/sigorta/raporlar', icon: BarChart3 },
    { name: 'Ayarlar', href: '/crm/sigorta/ayarlar', icon: Settings },
  ];

  return (
    <div className={styles.crmLayout}>
      {/* Mobile Drawer Backdrop */}
      {isMobileNavOpen && (
        <div className={styles.backdrop} onClick={() => setIsMobileNavOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileNavOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
            <ShieldCheck size={28} color="#3498db" />
            <h2>Sigorta CRM</h2>
          </Link>
          <button 
            className={styles.mobileCloseBtn} 
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Menüyü Kapat"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => setIsMobileNavOpen(false)}
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
          <div className={styles.topbarLeft}>
            <button 
              className={styles.mobileMenuToggle} 
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Menüyü Aç"
            >
              <Menu size={22} />
            </button>
            <h1 className={styles.topbarTitle}>
              {navItems.find(item => item.href === pathname)?.name || 'Sigorta Paneli'}
            </h1>
          </div>

          <div className={styles.topbarRight}>
            <GlobalCrmSearch />
            
            <div className={styles.userProfile}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>Eray Baysal</span>
                <span className={styles.userRole}>Yönetici</span>
              </div>
              <div className={styles.avatar}>EB</div>
            </div>
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
