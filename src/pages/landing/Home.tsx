import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import Hero from '../../components/landing/Hero';
import Contacto from '../../components/landing/Contact'; // <-- Asegúrate de que este sea el nombre del archivo

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Contacto />
      </main>
      <Footer />
    </div>
  );
}