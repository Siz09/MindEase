'use client';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './routes/Home';
import Features from './routes/Features';
import WhyMindease from './routes/WhyMindease';
import About from './routes/About';
import Contact from './routes/Contact';

export default function App() {
  return (
    <Router>
      <Helmet>
        <html lang="en" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-background text-white">
        <Navbar />
        <main className="flex-grow pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/why-mindease" element={<WhyMindease />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
