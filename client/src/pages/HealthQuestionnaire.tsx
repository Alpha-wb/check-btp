import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Check, ArrowRight, AlertTriangle, Send } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  category: 'absolute' | 'relative';
}

const questions: Question[] = [
  // Contre-indications ABSOLUES (1-11) → OUI = écran d'arrêt
  { id: 1, text: 'Affections aiguës, infections bactériennes ou processus inflammatoires ?', category: 'absolute' },
  { id: 2, text: 'Opérations récentes (moins de 2 mois) ?', category: 'absolute' },
  { id: 3, text: 'Artériosclérose, problèmes de circulation artérielle ?', category: 'absolute' },
  { id: 4, text: 'Stents ou pontages effectués (moins de 6 mois) ?', category: 'absolute' },
  { id: 5, text: 'Hypertension non traitée ?', category: 'absolute' },
  { id: 6, text: 'Diabète sucré ?', category: 'absolute' },
  { id: 7, text: 'Grossesse ?', category: 'absolute' },
  { id: 8, text: 'Implants électriques (ex : pacemaker) ?', category: 'absolute' },
  { id: 9, text: 'Tumeurs ou cancers ?', category: 'absolute' },
  { id: 10, text: 'Troubles hémorragiques, tendance aux hémorragies (hémophilie) ?', category: 'absolute' },
  { id: 11, text: 'Affections neuronales et épilepsie ?', category: 'absolute' },
  // Contre-indications RELATIVES (12-27) → OUI = noté mais continue
  { id: 12, text: 'Hernies de la paroi abdominale ou de l\'aine ?', category: 'relative' },
  { id: 13, text: 'Arythmies ?', category: 'relative' },
  { id: 14, text: 'Épilepsie (+12 mois sans crise) ?', category: 'relative' },
  { id: 15, text: 'Problèmes de dos aigus sans diagnostic ?', category: 'relative' },
  { id: 16, text: 'Névralgie aiguë, hernies discales aiguës ?', category: 'relative' },
  { id: 17, text: 'Avez-vous des implants (prothèse + de 6 mois) ?', category: 'relative' },
  { id: 18, text: 'Infection des organes internes (reins) ?', category: 'relative' },
  { id: 19, text: 'Troubles cardiovasculaires ?', category: 'relative' },
  { id: 20, text: 'Arthrose, maladies articulaires ?', category: 'relative' },
  { id: 21, text: 'Mal des transports ?', category: 'relative' },
  { id: 22, text: 'Grandes concentrations de fluides dans le corps, œdème ?', category: 'relative' },
  { id: 23, text: 'Blessures ouvertes, plaies, eczéma, brûlures ?', category: 'relative' },
  { id: 24, text: 'Varices ?', category: 'relative' },
  { id: 25, text: 'Effets aigus de l\'alcool, médicaments, stupéfiants ?', category: 'relative' },
  { id: 26, text: 'Prise de médicaments ?', category: 'relative' },
  { id: 27, text: 'Avez-vous eu la covid-19 et/ou ressentez-vous des symptômes covid ?', category: 'relative' },
];

type Screen = 'welcome' | 'questions' | 'contact' | 'blocked' | 'thankyou';

export default function HealthQuestionnaire() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'OUI' | 'NON'>>({});
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  const [contactInfo, setContactInfo] = useState({ firstName: '', lastName: '', phone: '', email: '' });

  const totalSteps = questions.length + 1; // +1 for contact form
  const progress = ((currentQuestion + (answers[questions[currentQuestion]?.id] ? 1 : 0)) / totalSteps) * 100;

  const goNext = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setDirection('down');
      setAnimating(true);
      setTimeout(() => {
        setCurrentQuestion((prev) => prev + 1);
        setAnimating(false);
      }, 300);
    } else if (answers[questions[currentQuestion]?.id]) {
      setScreen('contact');
    }
  }, [currentQuestion, answers]);

  const goPrev = useCallback(() => {
    if (currentQuestion > 0) {
      setDirection('up');
      setAnimating(true);
      setTimeout(() => {
        setCurrentQuestion((prev) => prev - 1);
        setAnimating(false);
      }, 300);
    }
  }, [currentQuestion]);

  const handleAnswer = (answer: 'OUI' | 'NON') => {
    const question = questions[currentQuestion];
    setAnswers((prev) => ({ ...prev, [question.id]: answer }));

    // Si contre-indication absolue et OUI → écran bloqué
    if (question.category === 'absolute' && answer === 'OUI') {
      setTimeout(() => setScreen('blocked'), 400);
      return;
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        goNext();
      } else {
        setScreen('contact');
      }
    }, 400);
  };

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    setScreen('thankyou');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'questions') return;
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        if (answers[questions[currentQuestion]?.id]) goNext();
      }
      if (e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, currentQuestion, answers, goNext, goPrev]);

  // ─── WELCOME SCREEN ─────────────────────────────────────────
  if (screen === 'welcome') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center overflow-auto z-50" style={{ backgroundColor: '#1e263f' }}>
        <div className="text-center max-w-2xl px-6 py-12">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: '#2a3454' }}>
              <span className="text-3xl font-black text-white">B</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            QUESTIONNAIRE DE SANTÉ<br />
            <span style={{ color: '#4ecdc4' }}>BODYLEC</span>
          </h1>
          <div className="text-gray-300 text-base md:text-lg leading-relaxed mb-10 space-y-4">
            <p>
              Si l'électrothérapie et des exercices de musculation modérés sont sans dangers pour les personnes en bonne santé, certaines conditions médicales nécessitent un accord médical préalable.
            </p>
            <p className="text-sm text-gray-400">
              Veuillez répondre honnêtement à toutes les questions ci-dessous.
            </p>
            <div className="text-sm text-gray-400 text-left inline-block">
              <p>⚡ Hydratez-vous correctement avant la séance.</p>
              <p>⚡ En cas de gêne, arrêtez immédiatement l'exercice.</p>
              <p>⚡ Évitez tout effort physique supplémentaire le jour même.</p>
            </div>
          </div>
          <button
            onClick={() => setScreen('questions')}
            className="group inline-flex items-center gap-3 text-white font-semibold text-lg px-10 py-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{ backgroundColor: '#4ecdc4' }}
          >
            C'est parti !
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="absolute bottom-6 text-gray-500 text-xs">
          Questionnaire santé BODYLEC
        </div>
      </div>
    );
  }

  // ─── BLOCKED SCREEN (Contre-indication absolue) ──────────────
  if (screen === 'blocked') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ backgroundColor: '#1e263f' }}>
        <div className="text-center max-w-2xl px-6">
          <div className="mb-8">
            <div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full"
              style={{ backgroundColor: '#ff6b6b22' }}
            >
              <AlertTriangle size={48} style={{ color: '#ff6b6b' }} />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Entraînement EMS non recommandé
          </h2>
          <p className="text-gray-300 text-lg mb-4 leading-relaxed">
            Votre réponse indique une <strong style={{ color: '#ff6b6b' }}>contre-indication absolue</strong> à l'entraînement par électrostimulation musculaire.
          </p>
          <p className="text-gray-400 text-base mb-10">
            Pour votre sécurité, veuillez consulter votre médecin et obtenir un certificat d'aptitude avant d'envisager une séance EMS.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setScreen('welcome');
                setCurrentQuestion(0);
                setAnswers({});
              }}
              className="inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: '#4ecdc4' }}
            >
              Recommencer
            </button>
          </div>
        </div>
        <div className="absolute bottom-6 text-gray-500 text-xs">
          Questionnaire santé BODYLEC
        </div>
      </div>
    );
  }

  // ─── CONTACT FORM SCREEN ─────────────────────────────────────
  if (screen === 'contact') {
    const hasRelativeRisk = Object.entries(answers).some(
      ([id, a]) => a === 'OUI' && questions.find((q) => q.id === Number(id))?.category === 'relative'
    );

    return (
      <div className="fixed inset-0 flex flex-col z-50" style={{ backgroundColor: '#1e263f' }}>
        {/* Progress Bar */}
        <div className="w-full h-1" style={{ backgroundColor: '#2a3454' }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: '96%', backgroundColor: '#4ecdc4' }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 overflow-auto">
          <div className="max-w-2xl w-full py-12">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: '#4ecdc4' }}
              >
                {questions.length + 1}
              </span>
              <div className="h-px flex-1" style={{ backgroundColor: '#2a3454' }} />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-relaxed">
              Vos coordonnées
            </h2>
            <p className="text-gray-400 mb-8 text-base">
              Merci d'avoir répondu au questionnaire. Veuillez renseigner vos informations de contact.
            </p>

            {hasRelativeRisk && (
              <div className="mb-8 p-4 rounded-lg border-2" style={{ backgroundColor: '#ff8c0022', borderColor: '#ff8c00' }}>
                <p className="text-sm" style={{ color: '#ff8c00' }}>
                  <strong>Note :</strong> Certaines de vos réponses indiquent des contre-indications relatives.
                  Un encadrement adapté sera prévu pour votre entraînement.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitContact} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={contactInfo.firstName}
                    onChange={(e) => setContactInfo((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border-2 text-white text-lg outline-none transition-colors focus:border-opacity-100"
                    style={{ backgroundColor: '#2a3454', borderColor: '#3a4564' }}
                    onFocus={(e) => (e.target.style.borderColor = '#4ecdc4')}
                    onBlur={(e) => (e.target.style.borderColor = '#3a4564')}
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Nom *</label>
                  <input
                    type="text"
                    required
                    value={contactInfo.lastName}
                    onChange={(e) => setContactInfo((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border-2 text-white text-lg outline-none transition-colors"
                    style={{ backgroundColor: '#2a3454', borderColor: '#3a4564' }}
                    onFocus={(e) => (e.target.style.borderColor = '#4ecdc4')}
                    onBlur={(e) => (e.target.style.borderColor = '#3a4564')}
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Numéro de téléphone *</label>
                <input
                  type="tel"
                  required
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border-2 text-white text-lg outline-none transition-colors"
                  style={{ backgroundColor: '#2a3454', borderColor: '#3a4564' }}
                  onFocus={(e) => (e.target.style.borderColor = '#4ecdc4')}
                  onBlur={(e) => (e.target.style.borderColor = '#3a4564')}
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border-2 text-white text-lg outline-none transition-colors"
                  style={{ backgroundColor: '#2a3454', borderColor: '#3a4564' }}
                  onFocus={(e) => (e.target.style.borderColor = '#4ecdc4')}
                  onBlur={(e) => (e.target.style.borderColor = '#3a4564')}
                  placeholder="votre@email.com"
                />
              </div>
              <button
                type="submit"
                className="group flex items-center justify-center gap-3 w-full text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl mt-8"
                style={{ backgroundColor: '#4ecdc4' }}
              >
                Envoyer
                <Send size={20} className="transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4">
          <div className="text-gray-500 text-xs">
            Appuyez sur <kbd className="px-1.5 py-0.5 rounded text-gray-400" style={{ backgroundColor: '#2a3454' }}>Entrée ↵</kbd> pour valider
          </div>
        </div>
      </div>
    );
  }

  // ─── THANK YOU SCREEN ────────────────────────────────────────
  if (screen === 'thankyou') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ backgroundColor: '#1e263f' }}>
        <div className="text-center max-w-2xl px-6">
          <div className="mb-8">
            <div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full"
              style={{ backgroundColor: '#4ecdc433' }}
            >
              <Check size={48} style={{ color: '#4ecdc4' }} />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bienvenue dans la BodyTeam !
          </h2>
          <p className="text-gray-300 text-lg mb-4 leading-relaxed">
            On a hâte de commencer avec vous !
          </p>
          <p className="text-gray-400 text-base mb-10">
            Votre questionnaire de santé a été enregistré avec succès.
            Nous vous contacterons prochainement pour organiser votre première séance EMS.
          </p>
          <button
            onClick={() => {
              setScreen('welcome');
              setCurrentQuestion(0);
              setAnswers({});
              setContactInfo({ firstName: '', lastName: '', phone: '', email: '' });
            }}
            className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: '#4ecdc4' }}
          >
            Recommencer
          </button>
        </div>
        <div className="absolute bottom-6 text-gray-500 text-xs">
          Questionnaire santé BODYLEC
        </div>
      </div>
    );
  }

  // ─── QUESTIONS SCREEN ────────────────────────────────────────
  const question = questions[currentQuestion];
  const selectedAnswer = answers[question.id];

  return (
    <div className="fixed inset-0 flex flex-col z-50" style={{ backgroundColor: '#1e263f' }}>
      {/* Progress Bar */}
      <div className="w-full h-1" style={{ backgroundColor: '#2a3454' }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: '#4ecdc4' }}
        />
      </div>

      {/* Question Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div
          className={`max-w-2xl w-full transition-all duration-300 ${
            animating
              ? direction === 'down'
                ? 'opacity-0 translate-y-8'
                : 'opacity-0 -translate-y-8'
              : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Question Number */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: '#4ecdc4' }}
            >
              {question.id}
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: '#2a3454' }} />
            <span className="text-gray-500 text-sm">
              {question.id} sur {questions.length}
            </span>
          </div>

          {/* Question Text */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 leading-relaxed">
            {question.text}
          </h2>

          {/* Answer Buttons */}
          <div className="flex flex-col gap-3">
            {(['OUI', 'NON'] as const).map((option, idx) => {
              const isSelected = selectedAnswer === option;
              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="group flex items-center gap-4 w-full text-left px-6 py-4 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    backgroundColor: isSelected
                      ? option === 'OUI'
                        ? '#ff6b6b22'
                        : '#4ecdc422'
                      : '#2a3454',
                    borderColor: isSelected
                      ? option === 'OUI'
                        ? '#ff6b6b'
                        : '#4ecdc4'
                      : '#3a4564',
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold shrink-0"
                    style={{
                      backgroundColor: isSelected
                        ? option === 'OUI'
                          ? '#ff6b6b'
                          : '#4ecdc4'
                        : '#3a4564',
                      color: 'white',
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span
                    className="text-lg font-medium"
                    style={{
                      color: isSelected ? 'white' : '#9ca3af',
                    }}
                  >
                    {option}
                  </span>
                  {isSelected && (
                    <Check
                      size={20}
                      className="ml-auto"
                      style={{ color: option === 'OUI' ? '#ff6b6b' : '#4ecdc4' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={currentQuestion === 0}
            className="p-2 rounded transition-colors disabled:opacity-30"
            style={{ backgroundColor: '#2a3454', color: 'white' }}
          >
            <ChevronUp size={20} />
          </button>
          <button
            onClick={() => {
              if (selectedAnswer) goNext();
            }}
            disabled={!selectedAnswer}
            className="p-2 rounded transition-colors disabled:opacity-30"
            style={{ backgroundColor: '#2a3454', color: 'white' }}
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {currentQuestion === questions.length - 1 && selectedAnswer && (
          <button
            onClick={() => setScreen('contact')}
            className="flex items-center gap-2 text-white font-semibold px-6 py-2 rounded-lg transition-all hover:scale-105"
            style={{ backgroundColor: '#4ecdc4' }}
          >
            Continuer
            <ArrowRight size={18} />
          </button>
        )}

        <div className="text-gray-500 text-xs">
          Appuyez sur <kbd className="px-1.5 py-0.5 rounded text-gray-400" style={{ backgroundColor: '#2a3454' }}>Entrée ↵</kbd> pour valider
        </div>
      </div>
    </div>
  );
}
