import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, UserRole } from '@/types/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  LayoutDashboard,
  Calendar,
  CreditCard,
  Users,
  Car,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronUp,
  Banknote,
  Package,
  Globe,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles?: UserRole[];
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    title: 'MD Dashboard',
    icon: LayoutDashboard,
    path: '/managing-director-dashboard',
    roles: ['managing_director'],
  },
  {
    title: 'Bookings',
    icon: Calendar,
    path: '/bookings',
    roles: ['assistant_hall_manager', 'accountant'],
  },
  {
    title: 'Customers',
    icon: Users,
    path: '/customers',
    roles: ['manager', 'assistant_hall_manager'],
  },
];

const financeNavItems: NavItem[] = [
  {
    title: 'Payments',
    icon: CreditCard,
    path: '/payments',
    roles: ['cashier_1', 'accountant'],
  },
  {
    title: 'Cash Movement',
    icon: Banknote,
    path: '/cash-movement',
    roles: ['cashier_1', 'accountant'],
  },
];

const operationsNavItems: NavItem[] = [
  {
    title: 'Services & Pricing',
    icon: Package,
    path: '/services',
    roles: ['manager', 'assistant_hall_manager', 'accountant'],
  },
  {
    title: 'Inventory & Store',
    icon: Car,
    path: '/rentals',
    roles: ['manager', 'assistant_hall_manager', 'accountant', 'store_keeper', 'purchaser'],
  },
  {
    title: 'Documents',
    icon: FileText,
    path: '/documents',
    roles: ['manager', 'assistant_hall_manager', 'cashier_1', 'accountant', 'store_keeper', 'purchaser'],
  },
];

const adminNavItems: NavItem[] = [
  {
    title: 'Accountant Console',
    icon: ShieldCheck,
    path: '/admin',
    roles: ['accountant'],
  },
  {
    title: 'Reports',
    icon: BarChart3,
    path: '/reports',
    roles: ['manager', 'accountant', 'managing_director', 'assistant_hall_manager', 'cashier_1', 'store_keeper', 'purchaser'],
  },
  {
    title: 'Messages',
    icon: MessageSquare,
    path: '/messages',
    roles: ['manager', 'accountant'],
  },
  {
    title: 'Web Portal',
    icon: Globe,
    path: '/portal',
    roles: ['assistant_hall_manager', 'accountant'],
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/settings',
    roles: ['manager', 'managing_director', 'assistant_hall_manager', 'cashier_1', 'store_keeper', 'purchaser', 'accountant'],
  },
];

function filterByRole(items: NavItem[], userRole: UserRole) {
  return items.filter((item) => !item.roles || item.roles.includes(userRole));
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const userInitials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/staff');
  };

  const assistantHallNavItems: NavItem[] = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Bookings', icon: Calendar, path: '/bookings' },
    { title: 'Submitted Bookings', icon: FileText, path: '/bookings/submitted' },
    { title: 'Inventory', icon: Car, path: '/rentals' },
    { title: 'Documents', icon: FileText, path: '/documents' },
    { title: 'Reports', icon: BarChart3, path: '/reports' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  const cashier1NavItems: NavItem[] = [
    { title: 'Bookings', icon: Calendar, path: '/bookings' },
    { title: 'Move Cash', icon: Banknote, path: '/cash-movement' },
    { title: 'Documents', icon: FileText, path: '/documents' },
    { title: 'Reports', icon: BarChart3, path: '/reports' },
  ];

  const purchaserNavItems: NavItem[] = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Inventory', icon: Car, path: '/rentals' },
    { title: 'Documents', icon: FileText, path: '/documents' },
    { title: 'Reports', icon: BarChart3, path: '/reports' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  const accountantNavItems: NavItem[] = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Inventory & Store', icon: Car, path: '/rentals' },
    { title: 'Documents', icon: FileText, path: '/documents' },
    { title: 'Money Oversight', icon: Banknote, path: '/cash-movement' },
    { title: 'Reports', icon: BarChart3, path: '/reports' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  const renderNavGroup = (label: string, items: NavItem[]) => {
    const filteredItems = filterByRole(items, user.role);
    if (filteredItems.length === 0) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {filteredItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  onClick={() => navigate(item.path)}
                  isActive={location.pathname === item.path}
                  tooltip={item.title}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">Kuringe Halls</span>
            <span className="text-xs text-sidebar-foreground/60">Management System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {user.role === 'assistant_hall_manager' ? (
          renderNavGroup('Assistant Hall', assistantHallNavItems)
        ) : user.role === 'cashier_1' ? (
          renderNavGroup('Cashier', cashier1NavItems)
        ) : user.role === 'purchaser' ? (
          renderNavGroup('Purchaser', purchaserNavItems)
        ) : user.role === 'accountant' ? (
          renderNavGroup('Accountant', accountantNavItems)
        ) : (
          <>
            {renderNavGroup('Main', mainNavItems)}
            {renderNavGroup('Finance', financeNavItems)}
            {renderNavGroup('Operations', operationsNavItems)}
            {renderNavGroup('Administration', adminNavItems)}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-sidebar-foreground/60">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
