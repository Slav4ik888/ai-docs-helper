import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { ChatPage } from '@pages/chat';
import { AdminPage } from '@pages/admin';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-full flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="inline-block w-7 h-7 rounded bg-brand-600 text-white grid place-items-center text-sm">AI</span>
              База знаний
            </Link>
            <nav className="flex gap-2 text-sm">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                Чат
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                Админ
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <footer className="text-xs text-slate-400 text-center py-3">
          AI Knowledge · Koa + React + RAG
        </footer>
      </div>
    </BrowserRouter>
  );
}
