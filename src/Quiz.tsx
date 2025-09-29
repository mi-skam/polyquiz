// <Quiz /> renders the entire flow with language toggle.
// Interpretation logic is pure: getInterpretation(score).
// Auto-saves to localStorage with debouncing.

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import polyTypeQuestionsData from './data/polyTypeQuestions.json' with { type: "json" };
import bindingTypeQuestionsData from './data/bindingTypeQuestions.json' with { type: "json" };
import interpretationGuideData from './data/interpretationGuide.json' with { type: "json" };
import styleDescriptionsData from './data/styleDescriptions.json' with { type: "json" };
import polyTypeConfigData from './data/polyTypeConfig.json' with { type: "json" };
import bindingTypeConfigData from './data/bindingTypeConfig.json' with { type: "json" };
import VersionInfo from './components/VersionInfo';
import ThemeToggle from './components/ThemeToggle';
import ShareButton from './components/ShareButton';

interface Question {
  id: number;
  textDE: string;
  textEN: string;
  weight: number;
}

interface PolyTypeResult {
  openRelationship: number;
  swinging: number;
  hierarchicalPoly: number;
  nonHierarchicalPoly: number;
  polyfidelity: number;
  soloPoly: number;
  kitchenTable: number;
  parallelPoly: number;
  relationshipAnarchy: number;
}

interface BindingTypeResult {
  fluidBonding: number;
  bodyFluidMonogamy: number;
  saferSexProtocols: number;
  nestingPartner: number;
  anchorPartner: number;
  abundanceMindset: number;
  scarcityMindset: number;
}

interface ScoreResult extends PolyTypeResult, BindingTypeResult {}

type Language = 'de' | 'en';
type Step = 'landing' | 'polyQuestions' | 'bindingQuestions' | 'summary' | 'interpretation';
type QuizSection = 'poly' | 'binding';

const POLY_QUESTIONS: Question[] = polyTypeQuestionsData;
const BINDING_QUESTIONS: Question[] = bindingTypeQuestionsData;

const POLY_OPTIONS_DE = polyTypeConfigData.options.de;
const POLY_OPTIONS_EN = polyTypeConfigData.options.en;
const BINDING_OPTIONS_DE = bindingTypeConfigData.options.de;
const BINDING_OPTIONS_EN = bindingTypeConfigData.options.en;

const POLY_SCORING_MAP: Record<string, number[]> = polyTypeConfigData.scoringMap;
const BINDING_SCORING_MAP: Record<string, number[]> = bindingTypeConfigData.scoringMap;

const INTERPRETATION_GUIDE = interpretationGuideData;

const STYLE_DESCRIPTIONS: Record<string, { de: string; en: string }> = styleDescriptionsData;

export function getInterpretation(scores: ScoreResult): { level: string; adviceDE: string; adviceEN: string } {
  // Calculate highest poly type score
  const polyScores = {
    openRelationship: scores.openRelationship,
    swinging: scores.swinging,
    hierarchicalPoly: scores.hierarchicalPoly,
    nonHierarchicalPoly: scores.nonHierarchicalPoly,
    polyfidelity: scores.polyfidelity,
    soloPoly: scores.soloPoly,
    kitchenTable: scores.kitchenTable,
    parallelPoly: scores.parallelPoly,
    relationshipAnarchy: scores.relationshipAnarchy
  };
  const maxPolyScore = Math.max(...Object.values(polyScores));
  const topPolyStyle = Object.entries(polyScores).find(([_, score]) => score === maxPolyScore)?.[0] || 'balanced';

  // Calculate highest binding type score
  const bindingScores = {
    fluidBonding: scores.fluidBonding,
    bodyFluidMonogamy: scores.bodyFluidMonogamy,
    saferSexProtocols: scores.saferSexProtocols,
    nestingPartner: scores.nestingPartner,
    anchorPartner: scores.anchorPartner,
    abundanceMindset: scores.abundanceMindset,
    scarcityMindset: scores.scarcityMindset
  };
  const maxBindingScore = Math.max(...Object.values(bindingScores));
  const topBindingStyle = Object.entries(bindingScores).find(([_, score]) => score === maxBindingScore)?.[0] || 'balanced';

  const interpretations: Record<string, { level: string; adviceDE: string; adviceEN: string }> = {
    openRelationship: {
      level: "Offene Beziehung",
      adviceDE: "Du bevorzugst eine primäre Partnerschaft mit Freiheit für sexuelle Beziehungen außerhalb.",
      adviceEN: "You prefer a primary partnership with freedom for sexual relationships outside."
    },
    swinging: {
      level: "Swinging",
      adviceDE: "Du genießt Freizeitsex mit anderen Paaren in sozialen oder Gruppeneinstellungen.",
      adviceEN: "You enjoy recreational sex with other couples in social or group settings."
    },
    hierarchicalPoly: {
      level: "Hierarchische Polyamorie",
      adviceDE: "Du bevorzugst klare Beziehungsstrukturen mit Primär-, Sekundär- und Tertiärpartnern.",
      adviceEN: "You prefer clear relationship structures with primary, secondary, and tertiary partners."
    },
    nonHierarchicalPoly: {
      level: "Nicht-Hierarchische Poly",
      adviceDE: "Du bevorzugst Gleichberechtigung unter Beziehungen ohne festgelegte Rangordnung.",
      adviceEN: "You prefer equality among relationships without predetermined ranking."
    },
    polyfidelity: {
      level: "Polyfidelität",
      adviceDE: "Du bevorzugst geschlossene Gruppen, in denen alle Partner nur innerhalb der Gruppe intim sind.",
      adviceEN: "You prefer closed groups where all partners remain intimate only within the group."
    },
    kitchenTable: {
      level: "Küchentisch",
      adviceDE: "Du genießt vernetzte Beziehungen und Gemeinschaft mit hoher Integration aller Partner.",
      adviceEN: "You enjoy interconnected relationships and community with high integration of all partners."
    },
    parallelPoly: {
      level: "Parallele Polyamorie",
      adviceDE: "Du bevorzugst unabhängige Beziehungen mit minimaler Überschneidung zwischen Partnern.",
      adviceEN: "You prefer independent relationships with minimal overlap between partners."
    },
    soloPoly: {
      level: "Solo-Poly",
      adviceDE: "Du priorisierst Autonomie und persönliche Unabhängigkeit in allen Beziehungen.",
      adviceEN: "You prioritize autonomy and personal independence in all relationships."
    },
    relationshipAnarchy: {
      level: "Beziehungsanarchie",
      adviceDE: "Du lehnst gesellschaftliche Konstrukte ab und lässt Beziehungen ohne Regeln fließen.",
      adviceEN: "You reject social constructs and let relationships flow without rules."
    },
    fluidBonding: {
      level: "Fluid-Bindung",
      adviceDE: "Du fühlst dich zu intimen körperlichen und emotionalen Bindungen hingezogen.",
      adviceEN: "You're drawn to intimate physical and emotional bonds."
    },
    bodyFluidMonogamy: {
      level: "Körperflüssigkeit-Monogamie",
      adviceDE: "Du begrenzt den Austausch von Körperflüssigkeiten auf bestimmte Partner.",
      adviceEN: "You limit bodily fluid exchange to specific partners."
    },
    saferSexProtocols: {
      level: "Safer-Sex-Protokolle",
      adviceDE: "Du nutzt konsequent Barrieren und Schutzmaßnahmen mit allen Partnern.",
      adviceEN: "You consistently use barriers and protective measures with all partners."
    },
    nestingPartner: {
      level: "Nesting-Partner",
      adviceDE: "Du bevorzugst einen Partner, mit dem du zusammenlebst und den Alltag teilst.",
      adviceEN: "You prefer a partner you live with and share daily life."
    },
    anchorPartner: {
      level: "Anker-Partner",
      adviceDE: "Du suchst emotionale Erdung und langfristige Partnerschaft für Stabilität.",
      adviceEN: "You seek emotional grounding and long-term partnership for stability."
    },
    abundanceMindset: {
      level: "Fülle-Mentalität",
      adviceDE: "Du glaubst, dass Liebe und Intimität unbegrenzt sind und durch Teilen wachsen.",
      adviceEN: "You believe love and intimacy are unlimited and grow through sharing."
    },
    scarcityMindset: {
      level: "Knappheits-Mentalität",
      adviceDE: "Du siehst Liebe und Intimität als begrenzte Ressourcen, die geschützt werden müssen.",
      adviceEN: "You see love and intimacy as limited resources that must be protected."
    },
    balanced: {
      level: "Ausgewogen",
      adviceDE: "Du zeigst einen ausgewogenen Ansatz zu Beziehungen.",
      adviceEN: "You show a balanced approach to relationships."
    }
  };

  // Combine top poly and binding styles
  const polyInterpretation = interpretations[topPolyStyle];
  const bindingInterpretation = interpretations[topBindingStyle];

  return {
    level: `${polyInterpretation?.level || 'Ausgewogen'} + ${bindingInterpretation?.level || 'Ausgewogen'}`,
    adviceDE: `${polyInterpretation?.adviceDE || 'Du zeigst einen ausgewogenen Ansatz zur Polyamorie.'} ${bindingInterpretation?.adviceDE || ''}`,
    adviceEN: `${polyInterpretation?.adviceEN || 'You show a balanced approach to polyamory.'} ${bindingInterpretation?.adviceEN || ''}`
  };
}

export default function Quiz() {
  const [language, setLanguage] = useState<Language>('de');
  const [step, setStep] = useState<Step>('landing');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentSection, setCurrentSection] = useState<QuizSection>('poly');
  const [polyAnswers, setPolyAnswers] = useState<Record<number, number>>({});
  const [bindingAnswers, setBindingAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState('');
  const [saveTimeout, setSaveTimeout] = useState<number | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showExtendedInterpretation, setShowExtendedInterpretation] = useState(false);

  const getCurrentQuestions = () => currentSection === 'poly' ? POLY_QUESTIONS : BINDING_QUESTIONS;
  const getCurrentAnswers = () => currentSection === 'poly' ? polyAnswers : bindingAnswers;
  const getCurrentOptions = () => {
    if (currentSection === 'poly') {
      return language === 'de' ? POLY_OPTIONS_DE : POLY_OPTIONS_EN;
    } else {
      return language === 'de' ? BINDING_OPTIONS_DE : BINDING_OPTIONS_EN;
    }
  };

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem('quiz-state', JSON.stringify({ step, currentQuestion, currentSection, polyAnswers, bindingAnswers, language }));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [step, currentQuestion, currentSection, polyAnswers, bindingAnswers, language]);

  const debouncedSave = useCallback(() => {
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(saveToStorage, 300));
  }, [saveToStorage]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('quiz-state');
      if (saved) {
        const { step: savedStep, currentQuestion: savedQ, currentSection: savedSection, polyAnswers: savedPolyAnswers, bindingAnswers: savedBindingAnswers, language: savedLang } = JSON.parse(saved);
        setStep(savedStep);
        setCurrentQuestion(savedQ);
        setCurrentSection(savedSection || 'poly');
        setPolyAnswers(savedPolyAnswers || {});
        setBindingAnswers(savedBindingAnswers || {});
        setLanguage(savedLang);
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    if (step !== 'landing') debouncedSave();
  }, [step, currentQuestion, currentSection, polyAnswers, bindingAnswers, language, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [saveTimeout]);

  const scores = useMemo((): ScoreResult => {
    const result: ScoreResult = {
      openRelationship: 0, swinging: 0, hierarchicalPoly: 0, nonHierarchicalPoly: 0,
      polyfidelity: 0, soloPoly: 0, kitchenTable: 0, parallelPoly: 0,
      relationshipAnarchy: 0, fluidBonding: 0, bodyFluidMonogamy: 0,
      saferSexProtocols: 0, nestingPartner: 0, anchorPartner: 0,
      abundanceMindset: 0, scarcityMindset: 0
    };

    // Calculate poly type scores
    Object.entries(POLY_SCORING_MAP).forEach(([category, questionIds]) => {
      result[category as keyof PolyTypeResult] = questionIds.reduce((sum, qId) =>
        sum + (polyAnswers[qId] || 0), 0
      );
    });

    // Calculate binding type scores
    Object.entries(BINDING_SCORING_MAP).forEach(([category, questionIds]) => {
      result[category as keyof BindingTypeResult] = questionIds.reduce((sum, qId) =>
        sum + (bindingAnswers[qId] || 0), 0
      );
    });

    return result;
  }, [polyAnswers, bindingAnswers]);

  const interpretation = useMemo(() => getInterpretation(scores), [scores]);

  // Memoize tooltip handlers to prevent unnecessary re-renders
  const handleTooltipEnter = useCallback((category: string) => {
    setActiveTooltip(category);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  const handleTooltipClick = useCallback((category: string) => {
    setActiveTooltip(activeTooltip === category ? null : category);
  }, [activeTooltip]);

  const handleAnswer = (optionIndex: number) => {
    const currentQuestions = getCurrentQuestions();
    const questionId = currentQuestions[currentQuestion].id;

    if (currentSection === 'poly') {
      setPolyAnswers(prev => ({ ...prev, [questionId]: optionIndex + 1 }));
    } else {
      setBindingAnswers(prev => ({ ...prev, [questionId]: optionIndex + 1 }));
    }
    setError('');
  };

  const handleNext = () => {
    const currentQuestions = getCurrentQuestions();
    const currentAnswers = getCurrentAnswers();

    if (!currentAnswers[currentQuestions[currentQuestion].id]) {
      setError(language === 'de' ? 'Bitte wähle eine Antwort.' : 'Please select an answer.');
      return;
    }

    if (currentQuestion < currentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Move to next section or summary
      if (currentSection === 'poly') {
        setCurrentSection('binding');
        setCurrentQuestion(0);
        setStep('bindingQuestions');
      } else {
        setStep('summary');
      }
    }
    setError('');
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      // Go back to previous section or landing
      if (currentSection === 'binding') {
        setCurrentSection('poly');
        setCurrentQuestion(POLY_QUESTIONS.length - 1);
        setStep('polyQuestions');
      } else {
        setStep('landing');
      }
    }
    setError('');
  };

  const restart = () => {
    setStep('landing');
    setCurrentQuestion(0);
    setCurrentSection('poly');
    setPolyAnswers({});
    setBindingAnswers({});
    setError('');
    localStorage.removeItem('quiz-state');
  };

  const toggleLanguage = () => setLanguage(prev => prev === 'de' ? 'en' : 'de');

  if (step === 'landing') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {language === 'de' ? 'Polyamorie-Stil Assessment' : 'Polyamory Style Assessment'}
          </h1>
          <div className="flex gap-2">
            <ThemeToggle />
            <button type="button" onClick={toggleLanguage} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
              {language === 'de' ? 'EN' : 'DE'}
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {language === 'de'
            ? `Entdecke deinen Polyamorie-Stil und deine Bindungspräferenzen durch ${POLY_QUESTIONS.length + BINDING_QUESTIONS.length} Fragen in zwei Abschnitten basierend auf "The Ethical Slut".`
            : `Discover your polyamory style and bonding preferences through ${POLY_QUESTIONS.length + BINDING_QUESTIONS.length} questions in two sections based on "The Ethical Slut".`
          }
        </p>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {language === 'de' ? 'Abschnitt 1: Beziehungsstrukturen' : 'Section 1: Relationship Structures'}
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              {language === 'de'
                ? `${POLY_QUESTIONS.length} Fragen über Hierarchien, Kommunikation und Autonomie`
                : `${POLY_QUESTIONS.length} questions about hierarchies, communication, and autonomy`
              }
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              {language === 'de' ? 'Abschnitt 2: Bindungspräferenzen' : 'Section 2: Bonding Preferences'}
            </h3>
            <p className="text-green-800 dark:text-green-200 text-sm">
              {language === 'de'
                ? `${BINDING_QUESTIONS.length} Fragen über Intimität, Körperlichkeit und emotionale Verbindungen`
                : `${BINDING_QUESTIONS.length} questions about intimacy, physicality, and emotional connections`
              }
            </p>
          </div>
          <button
            type="button"
            data-testid="start-btn"
            onClick={() => { setStep('polyQuestions'); setCurrentSection('poly'); }}
            className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          >
            {language === 'de' ? 'Quiz starten' : 'Start Quiz'}
          </button>
        </div>
        <VersionInfo />
      </div>
    );
  }

  if (step === 'polyQuestions' || step === 'bindingQuestions') {
    const currentQuestions = getCurrentQuestions();
    const currentAnswers = getCurrentAnswers();
    const options = getCurrentOptions();
    const progress = ((currentQuestion + 1) / currentQuestions.length) * 100;
    const currentQ = currentQuestions[currentQuestion];
    const selectedAnswer = currentAnswers[currentQ.id];

    const sectionTitle = currentSection === 'poly'
      ? (language === 'de' ? 'Beziehungsstrukturen' : 'Relationship Structures')
      : (language === 'de' ? 'Bindungspräferenzen' : 'Bonding Preferences');

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {sectionTitle} • {currentQuestion + 1} / {currentQuestions.length}
            </span>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <button type="button" onClick={toggleLanguage} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
              {language === 'de' ? 'EN' : 'DE'}
            </button>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${currentSection === 'poly' ? 'bg-blue-600 dark:bg-blue-500' : 'bg-green-600 dark:bg-green-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2 data-testid="question-text" className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
          {language === 'de' ? currentQ.textDE : currentQ.textEN}
        </h2>

        <div className="space-y-3 mb-6">
          {options.map((option, index) => (
            <label key={index} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="answer"
                value={index}
                checked={selectedAnswer === index + 1}
                onChange={() => handleAnswer(index)}
                className="mr-3 text-blue-600 focus:ring-blue-500"
                data-testid={`option-${index}`}
              />
              <span className="text-gray-700 dark:text-gray-300">{option}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex justify-between">
          <button
            type="button"
            data-testid="back-btn"
            onClick={handleBack}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors"
          >
            {language === 'de' ? 'Zurück' : 'Back'}
          </button>
          <button
            type="button"
            data-testid="next-btn"
            onClick={handleNext}
            className={`px-6 py-2 text-white rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              currentSection === 'poly'
                ? 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 focus:ring-green-500 dark:focus:ring-green-400'
            }`}
          >
            {currentQuestion === currentQuestions.length - 1
              ? (currentSection === 'poly'
                  ? (language === 'de' ? 'Zu Bindungsfragen' : 'To Bonding Questions')
                  : (language === 'de' ? 'Zur Zusammenfassung' : 'To Summary'))
              : (language === 'de' ? 'Weiter' : 'Next')
            }
          </button>
        </div>
        <VersionInfo />
      </div>
    );
  }

  if (step === 'summary') {
    const allQuestions = [...POLY_QUESTIONS, ...BINDING_QUESTIONS];
    const allAnswers = { ...polyAnswers, ...bindingAnswers };
    const options = language === 'de' ? POLY_OPTIONS_DE : POLY_OPTIONS_EN; // Using poly options as they're the same

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {language === 'de' ? 'Zusammenfassung' : 'Summary'}
          </h2>
          <div className="flex gap-2">
            <ThemeToggle />
            <button type="button" onClick={toggleLanguage} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
              {language === 'de' ? 'EN' : 'DE'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-96 overflow-y-auto">
          {allQuestions.map((q, index) => (
            <div key={q.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
              <p className="font-medium text-sm mb-2 text-gray-800 dark:text-gray-200">
                {index + 1}. {language === 'de' ? q.textDE : q.textEN}
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                {options[(allAnswers[q.id] || 1) - 1]}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          data-testid="submit-btn"
          onClick={() => setStep('interpretation')}
          className="w-full bg-green-600 dark:bg-green-700 text-white py-3 px-6 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
        >
          {language === 'de' ? 'Auswertung anzeigen' : 'Show Results'}
        </button>
        <VersionInfo />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {language === 'de' ? 'Dein Ergebnis' : 'Your Result'}
        </h2>
        <div className="flex gap-2">
          <ThemeToggle />
          <button type="button" onClick={toggleLanguage} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
            {language === 'de' ? 'EN' : 'DE'}
          </button>
        </div>
      </div>

      <div id="quiz-results" className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 rounded-full mb-4">
          <span className="text-sm font-bold text-blue-600 dark:text-blue-300 text-center px-2">{interpretation.level}</span>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {language === 'de' ? interpretation.adviceDE : interpretation.adviceEN}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries(scores).map(([category, score]) => {
            const formatName = (name: string) => {
              const nameMap: Record<string, string> = {
                openRelationship: 'Open Relationship',
                swinging: 'Swinging',
                hierarchicalPoly: 'Hierarchical Poly',
                nonHierarchicalPoly: 'Non-Hierarchical Poly',
                polyfidelity: 'Polyfidelity',
                soloPoly: 'Solo-Poly',
                kitchenTable: 'Kitchen Table',
                parallelPoly: 'Parallel Poly',
                relationshipAnarchy: 'Relationship Anarchy',
                fluidBonding: 'Fluid Bonding',
                bodyFluidMonogamy: 'Body Fluid Monogamy',
                saferSexProtocols: 'Safer Sex Protocols',
                nestingPartner: 'Nesting Partner',
                anchorPartner: 'Anchor Partner',
                abundanceMindset: 'Abundance Mindset',
                scarcityMindset: 'Scarcity Mindset'
              };
              return nameMap[name] || name;
            };

            const isPolyType = ['openRelationship', 'swinging', 'hierarchicalPoly', 'nonHierarchicalPoly', 'polyfidelity', 'soloPoly', 'kitchenTable', 'parallelPoly', 'relationshipAnarchy'].includes(category);
            const maxScore = isPolyType ? POLY_QUESTIONS.length * 5 : BINDING_QUESTIONS.length * 5;

            return (
              <div
                key={category}
                className={`p-3 rounded relative group cursor-help transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isPolyType ? 'bg-blue-50 dark:bg-blue-900' : 'bg-green-50 dark:bg-green-900'
                }`}
                onClick={() => handleTooltipClick(category)}
                onMouseEnter={() => handleTooltipEnter(category)}
                onMouseLeave={handleTooltipLeave}
              >
                <div className="flex items-center justify-between">
                  <div className={`font-medium ${isPolyType ? 'text-blue-900 dark:text-blue-100' : 'text-green-900 dark:text-green-100'}`}>
                    {formatName(category)}
                  </div>
                  <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className={`font-bold ${isPolyType ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                  {score}/{maxScore}
                </div>
                {activeTooltip === category && STYLE_DESCRIPTIONS[category] && (
                  <div className="absolute z-20 bg-gray-900 text-white text-xs rounded-lg p-3 w-64 bottom-full mb-2 left-0 md:bottom-auto md:-top-2 md:left-full md:ml-2 md:mb-0">
                    <div className="relative">
                      {language === 'de' ? STYLE_DESCRIPTIONS[category].de : STYLE_DESCRIPTIONS[category].en}
                      <div className="absolute left-4 top-full md:top-3 md:-left-2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-gray-900 border-r-[6px] border-r-transparent md:border-l-0 md:border-t-[6px] md:border-r-[8px] md:border-r-gray-900 md:border-b-[6px] md:border-b-transparent"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <ShareButton 
          language={language} 
          resultLevel={interpretation.level} 
          resultAdvice={language === 'de' ? interpretation.adviceDE : interpretation.adviceEN}
          scores={scores}
        />
      </div>

      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setShowExtendedInterpretation(!showExtendedInterpretation)}
          className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
        >
          {showExtendedInterpretation
            ? (language === 'de' ? 'Weniger Details' : 'Show Less')
            : (language === 'de' ? 'Detaillierte Interpretation' : 'Detailed Interpretation')}
        </button>
        <button
          type="button"
          data-testid="restart-btn"
          onClick={restart}
          className="flex-1 bg-gray-600 dark:bg-gray-700 text-white py-3 px-6 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-600 transition-colors"
        >
          {language === 'de' ? 'Neu starten' : 'Restart'}
        </button>
      </div>

      {showExtendedInterpretation && (
        <div className="mt-8 space-y-8 border-t pt-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {language === 'de' ? INTERPRETATION_GUIDE.de.title : INTERPRETATION_GUIDE.en.title}
          </h3>

          {/* Structure Types */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {language === 'de' ? INTERPRETATION_GUIDE.de.structureTypes : INTERPRETATION_GUIDE.en.structureTypes}
            </h4>
            <div className="space-y-4">
              {['openRelationship', 'swinging', 'hierarchicalPoly', 'nonHierarchicalPoly', 'polyfidelity', 'soloPoly', 'kitchenTable', 'parallelPoly', 'relationshipAnarchy'].map(style => {
                const score = scores[style as keyof ScoreResult];
                const guide = language === 'de' ? INTERPRETATION_GUIDE.de : INTERPRETATION_GUIDE.en;
                const interpretation = guide.interpretations[style as keyof typeof guide.interpretations];

                if (score >= 15 && interpretation) {
                  return (
                    <div key={style} className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                      <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{interpretation.title}</h5>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{interpretation.description}</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                        {interpretation.points.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Bonding Types */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {language === 'de' ? 'Bindungstypen' : 'Bonding Types'}
            </h4>
            <div className="space-y-4">
              {['fluidBonding', 'bodyFluidMonogamy', 'saferSexProtocols', 'nestingPartner', 'anchorPartner', 'abundanceMindset', 'scarcityMindset'].map(style => {
                const score = scores[style as keyof ScoreResult];
                const guide = language === 'de' ? INTERPRETATION_GUIDE.de : INTERPRETATION_GUIDE.en;
                const interpretation = guide.interpretations[style as keyof typeof guide.interpretations];

                if (score >= 10 && interpretation) {
                  return (
                    <div key={style} className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-900 dark:text-green-100 mb-2">{interpretation.title}</h5>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{interpretation.description}</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                        {interpretation.points.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Reflection Questions */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {language === 'de' ? INTERPRETATION_GUIDE.de.reflectionTitle : INTERPRETATION_GUIDE.en.reflectionTitle}
            </h4>
            <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                {language === 'de' ? 'Basierend auf deinen Punktzahlen, überdenke:' : 'Based on your scores, consider:'}
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                {(language === 'de' ? INTERPRETATION_GUIDE.de : INTERPRETATION_GUIDE.en).reflectionQuestions.map((question, idx) => (
                  <li key={idx}>{question}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {language === 'de' ? INTERPRETATION_GUIDE.de.nextStepsTitle : INTERPRETATION_GUIDE.en.nextStepsTitle}
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              {(language === 'de' ? INTERPRETATION_GUIDE.de : INTERPRETATION_GUIDE.en).nextSteps.map((step, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{step.title}:</h5>
                  <p className="text-gray-600 dark:text-gray-300">{step.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="bg-indigo-50 dark:bg-indigo-900 p-6 rounded-lg border-l-4 border-indigo-500">
            <p className="text-gray-700 dark:text-gray-300 italic">
              {language === 'de' ? INTERPRETATION_GUIDE.de.reminder : INTERPRETATION_GUIDE.en.reminder}
            </p>
          </div>
        </div>
      )}
      <VersionInfo />
    </div>
  );
}