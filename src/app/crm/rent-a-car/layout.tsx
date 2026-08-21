"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CarFront, 
  Users, 
  KeyRound, 
  LogOut,
  Settings,
  BarChart3
} from 'lucide-react';
import styles from './layout.module.css';
import GlobalCrmSearch from '@/components/common/GlobalCrmSearch';

export default function RentCrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  // If on login page, hide layout
  if (pathname === '/crm/rent-a-car/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/crm/rent-a-car/dashboard', icon: LayoutDashboard },
    { name: 'Araç Filosu', href: '/crm/rent-a-car/filo', icon: CarFront },
    { name: 'Kiralamalar', href: '/crm/rent-a-car/kiralamalar', icon: KeyRound },
    { name: 'Müşteriler', href: '/crm/rent-a-car/musteriler', icon: Users },
    { name: 'Raporlar', href: '/crm/rent-a-car/raporlar', icon: BarChart3 },
    { name: 'Ayarlar', href: '/crm/rent-a-car/ayarlar', icon: Settings },
  ];

  return (
    <div className={styles.crmLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <CarFront size={28} color="#e67e22" />
          <h2>Elisam Rent A Car</h2>
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

        <Link href="/crm/rent-a-car/login" className={styles.logoutBtn}>
          <LogOut size={18} />
          Çıkış Yap
        </Link>
      </aside>

      {/* Main Area */}
      <div className={styles.mainContent}>
        <header className={styles.topbar}>
          <h1 className={styles.topbarTitle}>
            {navItems.find(item => item.href === pathname)?.name || 'Rent A Car Paneli'}
          </h1>

          <GlobalCrmSearch />
          
          <div className={styles.userProfile}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Eray Baysal</span>
              <span className={styles.userRole}>Filo Yöneticisi</span>
            </div>
            <div className={styles.avatar}>EB</div>
          </div>
        </header>

        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
