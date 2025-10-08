import React from 'react';
    import { NavLink } from 'react-router-dom';
    import { Home, Users, ShoppingCart, Package, Settings, Wrench, ClipboardList, Shield, UserCircle, Car, ArrowUpLeft as ArrowUturnLeft, ArrowUpLeft as ArrowUturnDown } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { useAuth } from '@/contexts/NewSupabaseAuthContext';

    const Sidebar = () => {
      const { canAccess, userData } = useAuth();

      const navItems = [
        { to: '/customers', icon: Users, label: 'Customers', module: 'customers' },
        { to: '/purchases', icon: ShoppingCart, label: 'Vehicle Purchases', module: 'purchases' },
        { to: '/purchase-returns', icon: ArrowUturnDown, label: 'Purchase Returns', module: 'purchase_returns' },
        { to: '/stock', icon: Package, label: 'Vehicle Stock', module: 'stock' },
        { to: '/vehicle-invoices', icon: Car, label: 'Vehicle Invoices', module: 'vehicle_invoices' },
        { to: '/sales-returns', icon: ArrowUturnLeft, label: 'Sales Returns', module: 'sales_returns' },
        { to: '/workshop/purchases', icon: Wrench, label: 'Workshop Purchases', module: 'workshop/purchases' },
        { to: '/workshop/inventory', icon: Package, label: 'Workshop Inventory', module: 'workshop/inventory' },
        { to: '/workshop/job-card', icon: ClipboardList, label: 'Job Cards', module: 'workshop/job-card' },
        { to: '/admin/dashboard', icon: Shield, label: 'Admin Panel', module: 'admin', adminOnly: true },
        { to: '/profile', icon: UserCircle, label: 'My Profile' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ];

      const filteredNavItems = navItems.filter(item => {
        if (item.adminOnly) {
          return userData?.role === 'admin';
        }
        return canAccess(item.module, 'read');
      });

      return (
        <aside className="w-64 bg-card text-card-foreground p-4 flex flex-col border-r">
          <NavLink to="/dashboard" className="text-2xl font-bold mb-10 flex items-center gap-2 text-primary">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Home />
            </motion.div>
            <span>Ashwheel</span>
          </NavLink>
          <nav className="flex flex-col space-y-2 flex-grow">
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
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto text-center text-xs text-muted-foreground">
            <p>Showroom Pro v1.1</p>
            <p>&copy; {new Date().getFullYear()} Ashwheel Inc.</p>
          </div>
        </aside>
      );
    };

    export default Sidebar;