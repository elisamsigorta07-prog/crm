"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CarFront, 
  Users, 
  KeyRound, 
  LogOut, 
  Settings, 
  BarChart3,
  Receipt,
  Menu,
  X
} from 'lucide-react';
import styles from './layout.module.css';
import GlobalCrmSearch from '@/components/common/GlobalCrmSearch';

export default function RentCrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // If on login page, hide layout
  if (pathname === '/crm/rent-a-car/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/crm/rent-a-car/dashboard', icon: LayoutDashboard },
    { name: 'Araç Filosu', href: '/crm/rent-a-car/filo', icon: CarFront },
    { name: 'Kiralamalar', href: '/crm/rent-a-car/kiralamalar', icon: KeyRound },
    { name: 'Müşteriler', href: '/crm/rent-a-car/musteriler', icon: Users },
    { name: 'Finans & Cari', href: '/crm/rent-a-car/finans', icon: Receipt },
    { name: 'Raporlar', href: '/crm/rent-a-car/raporlar', icon: BarChart3 },
    { name: 'Ayarlar', href: '/crm/rent-a-car/ayarlar', icon: Settings },
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
            <CarFront size={28} color="#e67e22" />
            <h2>Elisam Rent</h2>
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

        <Link href="/crm/rent-a-car/login" className={styles.logoutBtn}>
          <LogOut size={18} />
          Çıkış Yap
        </Link>
      </aside>

      {/* Main Area */}
      <div className={styles.mainContent}>
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
              {navItems.find(item => item.href === pathname)?.name || 'Rent A Car Paneli'}
            </h1>
          </div>

          <div className={styles.topbarRight}>
            <GlobalCrmSearch />
            
            <div className={styles.userProfile}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>Eray Baysal</span>
                <span className={styles.userRole}>Filo Yöneticisi</span>
              </div>
              <div className={styles.avatar}>EB</div>
            </div>
          </div>
        </header>

        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}

