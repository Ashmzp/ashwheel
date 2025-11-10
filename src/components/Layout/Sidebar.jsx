import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, ShoppingCart, Package, Settings, Wrench, ClipboardList, Shield, UserCircle, Car, ArrowUpLeft as ArrowUturnLeft, ArrowDownLeft as ArrowUturnDown, BarChart2, BellRing, BarChart3, BookMarked, Book, BookCopy, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import AnimatedLogo from '@/components/AnimatedLogo';

const Sidebar = () => {
  const { canAccess, userData, loading, loadingUserData } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/customers', icon: Users, label: 'Customers', module: 'customers' },
    { to: '/bookings', icon: BookMarked, label: 'Bookings', module: 'bookings' },
    { to: '/purchases', icon: ShoppingCart, label: 'Vehicle Purchases', module: 'purchases' },
    { to: '/purchase-returns', icon: ArrowUturnDown, label: 'Purchase Returns', module: 'purchase_returns' },
    { to: '/stock', icon: Package, label: 'Vehicle Stock', module: 'stock' },
    { to: '/reports', icon: BarChart2, label: 'Reports', module: 'reports' },
    { to: '/vehicle-invoices', icon: Car, label: 'Vehicle Invoices', module: 'vehicle_invoices' },
    { to: '/sales-returns', icon: ArrowUturnLeft, label: 'Sales Returns', module: 'sales_returns' },
    { to: '/journal-entry', icon: Book, label: 'Journal Entry', module: 'journal_entry' },
    { to: '/party-ledger', icon: BookCopy, label: 'Party Ledger', module: 'party_ledger' },
    { to: '/receipts', icon: FileText, label: 'Receipt', module: 'receipts' },
    { to: '/workshop/purchases', icon: Wrench, label: 'Workshop Purchases', module: 'workshop_purchases' },
    { to: '/workshop/wp-return', icon: ArrowUturnDown, label: 'WP Return', module: 'wp_return' },
    { to: '/workshop/inventory', icon: Package, label: 'Workshop Inventory', module: 'workshop_inventory' },
    { to: '/workshop/job-card', icon: ClipboardList, label: 'Job Cards', module: 'job_cards' },
    { to: '/workshop/ws-return', icon: ArrowUturnLeft, label: 'WS Return', module: 'ws_return' },
    { to: '/workshop/follow-up', icon: BellRing, label: 'Follow-up', module: 'workshop_follow_up' },
    { to: '/mis-report', icon: BarChart3, label: 'MIS Report', module: 'mis_report' },
    { to: '/admin/dashboard', icon: Shield, label: 'Admin Panel', adminOnly: true },
    { to: '/profile', icon: UserCircle, label: 'My Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (loading || loadingUserData) {
    return (
      <aside className="w-64 bg-background text-card-foreground p-4 flex flex-col flex-shrink-0 h-full">
        <div className="h-16 flex items-center justify-center flex-shrink-0 mb-10">
            <AnimatedLogo className="h-12 w-auto" />
        </div>
        <div className="flex-grow">
        {[...Array(12)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded-lg mb-2 animate-pulse"></div>
        ))}
        </div>
      </aside>
    )
  }

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return userData?.role === 'admin';
    }
    if (!item.module) {
      return true; // Always show items without a module, like Dashboard, Profile, Settings
    }
    // For items with a module, check access
    return canAccess(item.module, 'read');
  });

  return (
    <aside className="w-64 bg-background text-card-foreground p-4 flex flex-col flex-shrink-0 h-full">
      <div className="h-16 flex items-center justify-center flex-shrink-0 mb-10">
        <NavLink to="/">
          <AnimatedLogo className="h-12 w-auto" isLink={false} />
        </NavLink>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
          <nav className="flex flex-col space-y-2">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg transition-colors text-muted-foreground hover:text-foreground ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'hover:bg-accent'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
      </div>
      <div className="mt-auto pt-4 text-center text-xs text-muted-foreground flex-shrink-0">
        <p>Ashwheel Pro v1.2</p>
        <p>&copy; {new Date().getFullYear()} Ashwheel Inc.</p>
      </div>
    </aside>
  );
};

export default Sidebar;