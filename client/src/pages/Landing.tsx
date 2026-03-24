import { Link } from 'react-router-dom';
import { ClipboardCheck, BarChart3, Users, Shield, ArrowRight } from 'lucide-react';

const features = [
  { icon: ClipboardCheck, title: 'Contrôles digitalisés', desc: '25 fiches de contrôle incontournables (FICO) pour chaque phase de construction.' },
  { icon: BarChart3, title: 'Suivi en temps réel', desc: 'Tableau de bord avec statistiques de conformité et alertes automatiques.' },
  { icon: Users, title: 'Collaboration', desc: 'Partagez l\'accès entre maîtres d\'ouvrage, maîtres d\'œuvre et entreprises.' },
  { icon: Shield, title: 'Conformité', desc: 'Respectez les réglementations PMR, incendie, thermiques et acoustiques.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-accent text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Le contrôle qualité <span className="text-primary">BTP</span> simplifié
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Check BTP digitalise vos processus de contrôle qualité sur chantier.
              Suivez, documentez et partagez vos vérifications en toute simplicité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl text-lg font-semibold no-underline transition flex items-center justify-center gap-2">
                Commencer gratuitement <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="border border-gray-500 hover:border-white text-white px-8 py-4 rounded-xl text-lg no-underline transition text-center">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4 text-accent">Qui utilise Check BTP ?</h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">Chaque acteur du chantier dispose d'un espace adapté à ses besoins.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { role: 'Maître d\'ouvrage', desc: 'Suivez l\'avancement de vos programmes immobiliers et recevez les rapports de conformité.', color: 'bg-blue-50 border-blue-200' },
            { role: 'Maître d\'œuvre', desc: 'Gérez les opérations, réalisez les contrôles et générez les fiches d\'autocontrôle.', color: 'bg-orange-50 border-orange-200' },
            { role: 'Entreprise', desc: 'Accédez aux contrôles qui vous sont assignés et documentez vos vérifications.', color: 'bg-green-50 border-green-200' },
          ].map((r) => (
            <div key={r.role} className={`${r.color} border rounded-2xl p-8 text-center`}>
              <h3 className="text-xl font-bold text-accent mb-3">{r.role}</h3>
              <p className="text-gray-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-accent">Fonctionnalités clés</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => (
              <div key={f.title} className="text-center p-6">
                <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <f.icon size={28} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-accent mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à digitaliser vos contrôles ?</h2>
          <p className="text-orange-100 mb-8 text-lg">Rejoignez les professionnels du BTP qui font confiance à Check BTP.</p>
          <Link to="/register" className="bg-white text-primary hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold no-underline transition inline-block">
            Créer mon compte
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-accent text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">Check BTP - Solution d\u00e9velopp\u00e9e par le GROUPE ALPHA ISI</p>
        </div>
      </footer>
    </div>
  );
}
