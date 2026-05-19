import React, { ReactNode } from 'react';
import { LayoutDashboard, Users, Calendar, GraduationCap, BookText, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  activeTab: 'dashboard' | 'students' | 'exams' | 'docs';
  onTabChange: (tab: 'dashboard' | 'students' | 'exams' | 'docs') => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { user, login, logout, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white shadow-lg">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">ExamFlow</h1>
            <p className="text-xs text-[#9E9E9E] font-medium tracking-widest uppercase">Academic Control Unit</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-2xl">
          <TabButton 
            active={activeTab === 'dashboard'} 
            onClick={() => onTabChange('dashboard')}
            icon={<LayoutDashboard size={18} />}
            label="Overview"
          />
          <TabButton 
            active={activeTab === 'students'} 
            onClick={() => onTabChange('students')}
            icon={<Users size={18} />}
            label="Students"
          />
          <TabButton 
            active={activeTab === 'exams'} 
            onClick={() => onTabChange('exams')}
            icon={<Calendar size={18} />}
            label="Schedules"
          />
          <TabButton 
            active={activeTab === 'docs'} 
            onClick={() => onTabChange('docs')}
            icon={<BookText size={18} />}
            label="Docs"
          />
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-6 h-6 rounded-full border-2 border-[#E5E5E5] border-t-[#1A1A1A] animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold">{user.displayName || 'Admin'}</p>
                <p className="text-[10px] text-[#9E9E9E] font-medium">{user.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </div>
              <button 
                onClick={logout}
                className="p-1 sm:p-2 text-[#9E9E9E] hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-opacity-90 transition-all"
            >
              <LogIn size={18} />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-10 mb-20 md:mb-0">
        {!user && activeTab !== 'docs' ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
            <div className="w-20 h-20 bg-white border border-[#E5E5E5] rounded-3xl flex items-center justify-center shadow-sm">
              <LogIn size={40} className="text-[#9E9E9E]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
              <p className="text-[#9E9E9E] max-w-xs mx-auto text-sm">Please login with your Google account to access the academic records and scheduling system.</p>
            </div>
            <button 
              onClick={login}
              className="bg-[#1A1A1A] text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-lg hover:translate-y-[-2px] transition-all"
            >
              Login with Google
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] px-4 py-2 flex items-center justify-around z-50">
        <MobileTabButton 
          active={activeTab === 'dashboard'} 
          onClick={() => onTabChange('dashboard')}
          icon={<LayoutDashboard size={20} />}
          label="Home"
        />
        <MobileTabButton 
          active={activeTab === 'students'} 
          onClick={() => onTabChange('students')}
          icon={<Users size={20} />}
          label="Students"
        />
        <MobileTabButton 
          active={activeTab === 'exams'} 
          onClick={() => onTabChange('exams')}
          icon={<Calendar size={20} />}
          label="Exams"
        />
        <MobileTabButton 
          active={activeTab === 'docs'} 
          onClick={() => onTabChange('docs')}
          icon={<BookText size={20} />}
          label="Docs"
        />
      </nav>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] bg-white p-6 text-center">
        <p className="text-xs text-[#9E9E9E]">© 2024 ExamFlow Systems • Asia-Southeast1 Region • Powered by HeapSort™</p>
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
        ${active 
          ? 'bg-white text-[#1A1A1A] shadow-sm' 
          : 'text-[#9E9E9E] hover:text-[#4A4A4A] hover:bg-[#EAEAEA]'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MobileTabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-2 py-1 transition-all duration-200
        ${active 
          ? 'text-[#1A1A1A]' 
          : 'text-[#9E9E9E]'
        }
      `}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
}
