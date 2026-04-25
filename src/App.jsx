import React from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Footer from './components/Footer';
import Admin from './pages/Admin';

// Zero-dependency routing: check the URL path.
// /admin → admin panel, everything else → main site.
const isAdmin = window.location.pathname === '/admin';

function App() {
  if (isAdmin) {
    return <Admin />;
  }

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
