import { useState } from 'react';
import type { Penalty } from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Books } from './pages/Books';
import { Members } from './pages/Members';
import { Transactions } from './pages/Transactions';
import { History } from './pages/History';
import { Visitors } from './pages/Visitors';
import { Reports } from './pages/Reports';
import { LandingPage } from './pages/LandingPage';
import { PublicVisitorForm } from './pages/PublicVisitorForm';
import { PublicSearchBooks } from './pages/PublicSearchBooks';

// Re-export Penalty dari mockData agar halaman lain cukup import dari App
export type { Penalty as PenaltyRecord } from './data/mockData';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [publicPage, setPublicPage] = useState('landing');
  const [showLogin, setShowLogin] = useState(false);
  const [penaltyRecords, setPenaltyRecords] = useState<Penalty[]>([]);
  const [quickLoanType, setQuickLoanType] = useState<string | null>(null);

  const handleAddPenalty = (record: Penalty) => {
    setPenaltyRecords((prev) => [...prev, record]);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
    setPublicPage('landing');
    setShowLogin(false);
    setQuickLoanType(null);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setQuickLoanType(null);
  };

  if (!isLoggedIn && showLogin) {
    return <Login onLogin={handleLogin} />;
  }

  if (!isLoggedIn && publicPage === 'visitor-form') {
    return <PublicVisitorForm onBack={() => setPublicPage('landing')} />;
  }

  if (!isLoggedIn && publicPage === 'search-books') {
    return <PublicSearchBooks onBack={() => setPublicPage('landing')} />;
  }

  if (!isLoggedIn && publicPage === 'landing') {
    return (
      <LandingPage
        onNavigate={setPublicPage}
        onLoginClick={() => setShowLogin(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background print:block print:h-auto lg:flex lg:h-screen">
      <div className="print:hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </div>

      <main className="flex-1 w-full overflow-y-auto print:overflow-visible">
        <div className="px-4 pt-20 pb-24 lg:p-8 print:p-0">
          {currentPage === 'dashboard' && (
            <Dashboard
              onQuickBorrow={(type) => {
                setQuickLoanType(type);
                setCurrentPage('transactions');
              }}
            />
          )}

          {currentPage === 'books' && <Books />}

          {currentPage === 'members' && <Members />}

          {currentPage === 'transactions' && (
            <Transactions
              onAddPenalty={handleAddPenalty}
              quickLoanType={quickLoanType}
              onQuickLoanConsumed={() => setQuickLoanType(null)}
            />
          )}

          {currentPage === 'history' && <History />}

          {currentPage === 'visitors' && <Visitors />}

          {currentPage === 'reports' && (
            <Reports penaltyRecords={penaltyRecords} />
          )}
        </div>
      </main>
    </div>
  );
}
