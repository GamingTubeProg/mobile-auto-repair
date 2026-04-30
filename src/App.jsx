import React from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Footer from './components/Footer';
import Admin from './pages/Admin';
import Tuning from './pages/Tuning';

const path = window.location.pathname;

function App() {
  if (path === '/admin')  return <Admin />;
  if (path === '/tuning') return <Tuning />;

  return (
    <div className="app">
      <Navbar />
      <main>
        <Home />
      </main>
      <Footer />
    </div>
  );
}

export default App;
