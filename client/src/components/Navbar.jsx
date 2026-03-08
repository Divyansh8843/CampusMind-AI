import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  Menu, 
  X 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isLoggedIn = !!localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isLanding = location.pathname === '/';

    // Helper for anchor links
    const LinkItem = ({ to, children, mobile, isRouterLink, className = "" }) => {
        const baseClass = mobile
            ? `block text-slate-600 dark:text-slate-300 font-medium py-2 ${className}`
            : `text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${className}`;
        
        const activeClass = "text-blue-600 dark:text-blue-400 font-semibold";

        if (isRouterLink) {
            return (
                <NavLink 
                    to={to} 
                    className={({ isActive }) => 
                        `${baseClass} ${!mobile && isActive ? activeClass : ''}`
                    }
                    onClick={() => mobile && setIsMobileMenuOpen(false)}
                >
                    {children}
                </NavLink>
            );
        }

        if (to.startsWith('#')) {
            return (
                <a 
                    href={isLanding ? to : `/${to}`} 
                    className={baseClass}
                    onClick={() => mobile && setIsMobileMenuOpen(false)}
                >
                    {children}
                </a>
            );
        }

        return (
            <NavLink 
                to={to} 
                className={baseClass}
                onClick={() => mobile && setIsMobileMenuOpen(false)}
            >
                {children}
            </NavLink>
        );
    };

    return (
        <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16 relative">
                    {/* LEFT: Logo */}
                    <div className="flex-shrink-0 flex items-center justify-start gap-2 mr-auto">
                        <NavLink to={!isLoggedIn ? "/" : (user?.role === 'admin' ? "/admin" : "/dashboard")} className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                                CampusMind AI
                            </span>
                        </NavLink>
                    </div>

                    {/* CENTER: Navigation Links HIDING/SHOWING based on Role */}
                    <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-6">
                        <LinkItem to="/" isRouterLink>Home</LinkItem>
                        
                        {isLoggedIn && (
                            <>
                                {user?.role === 'admin' ? (
                                    <>
                                        <LinkItem to="/admin" isRouterLink>Console</LinkItem>
                                        <LinkItem to="/community" isRouterLink>Community</LinkItem>
                                        <LinkItem to="/admin/documents" isRouterLink>Vault</LinkItem>
                                        <LinkItem to="/admin/audit" isRouterLink>Audit Logs</LinkItem>
                                    </>
                                ) : (
                                    <>
                                        <LinkItem to="/dashboard" isRouterLink>Dashboard</LinkItem>
                                        <LinkItem to="/meta-campus" isRouterLink>Lobby</LinkItem>
                                        <LinkItem to="/chat" isRouterLink> Chat</LinkItem>
                                        <LinkItem to="/jobs" isRouterLink>Jobs </LinkItem>
                                        <LinkItem to="/hackathons" isRouterLink className="hidden xl:block">Hackathons</LinkItem>
                                        <LinkItem to="/interview" isRouterLink className="hidden xl:block">Interview</LinkItem>
                                        <LinkItem to="/community" isRouterLink>Community</LinkItem>
                                        <LinkItem to="/resume" isRouterLink>Analyzer</LinkItem>
                                    </>
                                )}
                            </>
                        )}
                        {!isLoggedIn && (
                            <>
                                <LinkItem to="#features">Features</LinkItem>
                                <LinkItem to="/pricing" isRouterLink>Pricing</LinkItem>
                                <LinkItem to="#how-it-works">How it Works</LinkItem>
                                <LinkItem to="#Developer">Developer</LinkItem>
                            </>
                        )}
                    </div>

                    {/* RIGHT: Actions */}
                    <div className="hidden lg:flex items-center justify-end gap-4 ml-auto">
                        {/* Theme Toggle */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {isLoggedIn ? (
                            <div className="relative group">
                                <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        {user?.picture ? (
                                            <img src={user.picture} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={16} className="text-slate-500" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                                        {user?.name?.split(' ')[0] || 'User'}
                                    </span>
                                </button>
                                
                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    </div>
                                    <div className="py-1">
                                        {user?.role === 'student' ? (
                                            <NavLink to="/dashboard" className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
                                                Dashboard
                                            </NavLink>
                                         ) : (
                                            <NavLink to="/admin" className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
                                                Admin Dashboard
                                            </NavLink>
                                         )}
                                        <NavLink to="/profile" className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
                                            My Profile
                                        </NavLink>
                                        {user?.role === 'student' && (
                                            <>
                                                <NavLink to="/analytics" className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
                                                    My Progress
                                                </NavLink>
                                                <NavLink to="/resources" className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
                                                    My Documents
                                                </NavLink>
                                            </>
                                        )}
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 border-t border-slate-100 dark:border-white/10"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <NavLink 
                                to="/login" 
                                className="px-5 py-2 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/25"
                            >
                                Login
                            </NavLink>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center gap-4 ml-auto">
                        <button 
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-slate-600 dark:text-white"
                        >
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 overflow-hidden"
                    >
                        <div className="px-4 py-6 space-y-4">
                            <LinkItem to="/" isRouterLink mobile>Home</LinkItem>
                            
                            {isLoggedIn ? (
                                user?.role === 'admin' ? (
                                    <>
                                        <LinkItem to="/admin" isRouterLink mobile>Console Dashboard</LinkItem>
                                        <LinkItem to="/community" isRouterLink mobile>Community Oversight</LinkItem>
                                        <LinkItem to="/admin/documents" isRouterLink mobile>Document Vault</LinkItem>
                                        <LinkItem to="/admin/audit" isRouterLink mobile>Security Audit</LinkItem>
                                        <LinkItem to="/profile" isRouterLink mobile>Admin Profile</LinkItem>
                                    </>
                                ) : (
                                    <>
                                        <LinkItem to="/dashboard" isRouterLink mobile>Dashboard</LinkItem>
                                        <LinkItem to="/meta-campus" isRouterLink mobile>Meta-Campus Lobby</LinkItem>
                                        <LinkItem to="/profile" isRouterLink mobile>My Profile</LinkItem>
                                        <LinkItem to="/chat" isRouterLink mobile>AI Assistant</LinkItem>
                                        <LinkItem to="/jobs" isRouterLink mobile>Global Jobs</LinkItem>
                                        <LinkItem to="/community" isRouterLink mobile>Campus Community</LinkItem>
                                        <LinkItem to="/resume" isRouterLink mobile>Resume Analyzer</LinkItem>
                                        <LinkItem to="/planner" isRouterLink mobile>Academic Planner</LinkItem>
                                        <LinkItem to="/syllabus" isRouterLink mobile>Syllabus Tracker</LinkItem>
                                        <LinkItem to="/alumni" isRouterLink mobile>Alumni Network</LinkItem>
                                        <LinkItem to="/hackathons" isRouterLink mobile>Hackathons</LinkItem>
                                    </>
                                )
                            ) : (
                                <>
                                    <LinkItem to="#features" mobile>Features</LinkItem>
                                    <LinkItem to="/pricing" isRouterLink mobile>Pricing</LinkItem>
                                    <LinkItem to="#how-it-works" mobile>How it Works</LinkItem>
                                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/10">
                                        <NavLink 
                                            to="/login" 
                                            className="block w-full text-center py-3 rounded-xl bg-blue-600 text-white font-bold" 
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Login
                                        </NavLink>
                                    </div>
                                </>
                            )}
                            
                            {isLoggedIn && (
                                <>
                                    <div className="border-t border-slate-100 dark:border-white/10 my-2 pt-2"></div>
                                    <div className="flex items-center gap-3 px-2 pb-4 mb-2">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            {user?.picture ? (
                                                <img src={user.picture} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} className="text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{user?.name}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{user?.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={handleLogout} className="w-full text-left text-red-600 font-medium flex items-center gap-2 py-2">
                                        <LogOut size={18} /> Sign Out
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
