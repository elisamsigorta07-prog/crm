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
  X,
  Bell
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

  // Live count of expiring policies for notification badge
  const [dueCount, setDueCount] = useState<number>(0);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('elisam_policies');
      if (saved) {
        const list = JSON.parse(saved);
        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        let c = 0;
        list.forEach((p: any) => {
          if (p.endDate) {
            const parts = p.endDate.includes('.') ? p.endDate.split('.') : (p.endDate.includes('-') ? p.endDate.split('-') : []);
            let endTs = 0;
            if (parts.length === 3) {
              if (p.endDate.includes('.')) endTs = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
              else endTs = new Date(p.endDate).getTime();
            }
            if (endTs) {
              const diffDays = Math.ceil((endTs - todayMidnight) / (1000 * 60 * 60 * 24));
              if (diffDays <= 30) c++;
            }
          }
        });
        setDueCount(c);
      }
    } catch (e) {}
  }, [pathname]);

  // If we are on the login page, don't show the sidebar/layout
  if (pathname === '/crm/sigorta/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/crm/sigorta/dashboard', icon: LayoutDashboard },
    { name: 'Poliçeler', href: '/crm/sigorta/policeler', icon: ShieldAlert },
    { name: 'Hatırlatıcı & Bildirim', href: '/crm/sigorta/bildirimler', icon: Bell, badge: dueCount },
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
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    backgroundColor: '#ef4444', 
                    color: 'white', 
                    padding: '2px 7px', 
                    borderRadius: '10px',
                    lineHeight: 1
                  }}>
                    {item.badge}
                  </span>
                )}
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
