import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LayoutGrid, Plus, LogOut, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout() {
  const location = useLocation();

  const navItems = [
  { label: 'Mis Estudios', path: '/', icon: LayoutGrid },
  { label: 'Nuevo Estudio', path: '/studies/new', icon: Plus }];


  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FlaskConical className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">SortLab por Caro Gotbeter</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2 font-medium">
                    
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>);

            })}
          </nav>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => base44.auth.logout()}
            className="text-muted-foreground hover:text-foreground">
            
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border px-4 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center gap-1 py-1">
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </Link>);

          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
        <Outlet />
      </main>
    </div>);

}