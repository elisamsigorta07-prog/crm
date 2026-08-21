"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, User, ShieldCheck, CarFront } from 'lucide-react';
import { initialCustomersData, initialPoliciesData } from '@/data/crmData';
import { initialVehiclesData } from '@/data/rentCrmData';
import styles from './GlobalCrmSearch.module.css';

export default function GlobalCrmSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const customers = initialCustomersData.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || c.identityNo.includes(query)
  );

  const policies = initialPoliciesData.filter(p => 
    p.id.toLowerCase().includes(query.toLowerCase()) || p.customerName.toLowerCase().includes(query.toLowerCase())
  );

  const vehicles = initialVehiclesData.filter(v => 
    v.brand.toLowerCase().includes(query.toLowerCase()) || 
    v.model.toLowerCase().includes(query.toLowerCase()) ||
    v.plate.toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = query.trim().length > 0 && (customers.length > 0 || policies.length > 0 || vehicles.length > 0);

  return (
    <div className={styles.searchWrapper} ref={wrapperRef}>
      <Search size={16} className={styles.searchIcon} />
      <input 
        type="text" 
        placeholder="Hızlı Arama (Müşteri, Poliçe, Araç)..." 
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className={styles.searchInput}
      />

      {isOpen && query.trim().length > 0 && (
        <div className={styles.dropdown}>
          {customers.length > 0 && (
            <div>
              <div className={styles.dropdownGroupHeader}>Sigorta Müşterileri</div>
              {customers.map(c => (
                <div key={c.id} className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
                  <div>
                    <div className={styles.itemTitle}>{c.name}</div>
                    <div className={styles.itemSub}>{c.phone} • TC: {c.identityNo}</div>
                  </div>
                  <User size={16} color="#3182ce" />
                </div>
              ))}
            </div>
          )}

          {policies.length > 0 && (
            <div>
              <div className={styles.dropdownGroupHeader}>Poliçeler</div>
              {policies.map(p => (
                <div key={p.id} className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
                  <div>
                    <div className={styles.itemTitle}>{p.id} - {p.customerName}</div>
                    <div className={styles.itemSub}>{p.type} • {p.company}</div>
                  </div>
                  <ShieldCheck size={16} color="#38a169" />
                </div>
              ))}
            </div>
          )}

          {vehicles.length > 0 && (
            <div>
              <div className={styles.dropdownGroupHeader}>Rent A Car Araçları</div>
              {vehicles.map(v => (
                <div key={v.id} className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
                  <div>
                    <div className={styles.itemTitle}>{v.brand} {v.model}</div>
                    <div className={styles.itemSub}>{v.plate} • {v.dailyPrice} ₺/gün</div>
                  </div>
                  <CarFront size={16} color="#dd6b20" />
                </div>
              ))}
            </div>
          )}

          {!hasResults && (
            <div style={{ padding: '16px', textAlign: 'center', color: '#a0aec0', fontSize: '0.85rem' }}>
              Sonuç bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
