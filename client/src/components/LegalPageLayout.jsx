import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const LegalPageLayout = ({ title, lastUpdated, sections, icon: Icon }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
    <Navbar />
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-10 sm:px-10">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
              <Icon className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">{title}</h1>
              <p className="mt-1 text-sm text-blue-100">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-10 sm:px-10 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{section.heading}</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="border-t border-slate-100 dark:border-white/10 px-6 py-6 sm:px-10 bg-slate-50/80 dark:bg-slate-950/50 flex flex-wrap gap-4 text-sm">
          <Link to="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">Privacy Policy</Link>
          <Link to="/terms" className="text-blue-600 hover:underline dark:text-blue-400">Terms of Service</Link>
          <a href="mailto:campusmindofficial@gmail.com" className="text-blue-600 hover:underline dark:text-blue-400">Contact Support</a>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default LegalPageLayout;
