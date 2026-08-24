import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
    const location = useLocation();
    const isChatPage = location.pathname === '/chat';
    const showFooter = ['/', '/pricing', '/about', '/contact', '/privacy', '/terms'].includes(location.pathname);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            {!isChatPage && <Navbar />}
            
            {/* Main Content Area */}
            <main className={`${isChatPage ? '' : 'pt-16 max-w-7xl px-4 sm:px-6 lg:px-8 py-8'} w-full min-h-screen flex flex-col mx-auto`}>
                <div className={`flex-1 w-full ${isChatPage ? 'h-screen' : ''}`}>
                    <Outlet />
                </div>
            </main>
            {showFooter && <Footer />}
        </div>
    );
};

export default Layout;
