// <Quiz /> renders the entire flow with language toggle.
// Interpretation logic is pure: getInterpretation(score).
// Auto-saves to localStorage with debouncing.

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import questionsData from './data/questions.json' with { type: "json" };
import interpretationGuideData from './data/interpretationGuide.json' with { type: "json" };
import styleDescriptionsData from './data/styleDescriptions.json' with { type: "json" };
import configData from './data/config.json' with { type: "json" };
import VersionInfo from './components/VersionInfo';
import ThemeToggle from './components/ThemeToggle';

interface Question {
  id: number;
  textDE: string;
  textEN: string;
  weight: number;
}

interface ScoreResult {
  hierarchical: number;
  nonHierarchical: number;
  kitchenTable: number;
  parallel: number;
  soloPoly: number;
  relationshipEscalator: number;
  fluidBonding: number;
  saferSex: number;
}

type Language = 'de' | 'en';
type Step = 'landing' | 'questions' | 'summary' | 'interpretation';

const QUESTIONS: Question[] = questionsData;

const OPTIONS_DE = configData.options.de;
const OPTIONS_EN = configData.options.en;

const SCORING_MAP: Record<string, number[]> = configData.scoringMap;

const INTERPRETATION_GUIDE = interpretationGuideData;

const STYLE_DESCRIPTIONS: Record<string, { de: string; en: string }> = styleDescriptionsData;

export function getInterpretation(scores: ScoreResult): { level: string; adviceDE: string; adviceEN: string } {
  const max = Math.max(...Object.values(scores));
  const topStyle = Object.entries(scores).find(([_, score]) => score === max)?.[0] || 'balanced';
  
  const interpretations: Record<string, { level: string; adviceDE: string; adviceEN: string }> = {
    hierarchical: { 
      level: "Hierarchisch", 
      adviceDE: "Du bevorzugst klare Beziehungsstrukturen mit Hauptpartnern und strukturierten Verpflichtungen.", 
      adviceEN: "You prefer clear relationship structures with primary partners and structured commitments." 
    },
    nonHierarchical: { 
      level: "Nicht-Hierarchisch", 
      adviceDE: "Du bevorzugst Gleichberechtigung unter Beziehungen und widersetzte dich auferlegten Hierarchien.", 
      adviceEN: "You prefer equality among relationships and resist imposed hierarchies." 
    },
    kitchenTable: { 
      level: "Küchentisch", 
      adviceDE: "Du genießt vernetzte Beziehungen und Gemeinschaft mit hoher Integration aller Partner.", 
      adviceEN: "You enjoy interconnected relationships and community with high integration of all partners." 
    },
    parallel: { 
      level: "Parallel", 
      adviceDE: "Du bevorzugst unabhängige Beziehungen mit minimaler Überschneidung zwischen Partnern.", 
      adviceEN: "You prefer independent relationships with minimal overlap between partners." 
    },
    soloPoly: { 
      level: "Solo-Poly", 
      adviceDE: "Du priorisierst Autonomie und persönliche Unabhängigkeit in allen Beziehungen.", 
      adviceEN: "You prioritize autonomy and personal independence in all relationships." 
    },
    relationshipEscalator: { 
      level: "Beziehungsrolltreppe", 
      adviceDE: "Du fühlst dich zu traditionellen Beziehungsmeilensteinen und Eskalationsmustern hingezogen.", 
      adviceEN: "You're drawn to traditional relationship milestones and escalation patterns." 
    },
    fluidBonding: { 
      level: "Fluid-Bindung", 
      adviceDE: "Du fühlst dich zu intimen körperlichen und emotionalen Bindungen hingezogen.", 
      adviceEN: "You're drawn to intimate physical and emotional bonds." 
    },
    saferSex: { 
      level: "Safer Sex", 
      adviceDE: "Du priorisierst Sicherheit, Grenzen und Unabhängigkeit in intimen Beziehungen.", 
      adviceEN: "You prioritize safety, boundaries and independence in intimate relationships." 
    }
  };
  
  return interpretations[topStyle] || { level: "Ausgewogen", adviceDE: "Du zeigst einen ausgewogenen Ansatz zur Polyamorie.", adviceEN: "You show a balanced approach to polyamory." };
}

export default function Quiz() {
  const [language, setLanguage] = useState<Language>('de');
  const [step, setStep] = useState<Step>('landing');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState('');
  const [saveTimeout, setSaveTimeout] = useState<number | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showExtendedInterpretation, setShowExtendedInterpretation] = useState(false);

  const options = language === 'de' ? OPTIONS_DE : OPTIONS_EN;

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem('quiz-state', JSON.stringify({ step, currentQuestion, answers, language }));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [step, currentQuestion, answers, language]);

  const debouncedSave = useCallback(() => {
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(saveToStorage, 300));
  }, [saveToStorage]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('quiz-state');
      if (saved) {
        const { step: savedStep, currentQuestion: savedQ, answers: savedAnswers, language: savedLang } = JSON.parse(saved);
        setStep(savedStep);
        setCurrentQuestion(savedQ);
        setAnswers(savedAnswers);
        setLanguage(savedLang);
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    if (step !== 'landing') debouncedSave();
  }, [step, currentQuestion, answers, language, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [saveTimeout]);

  const scores = useMemo((): ScoreResult => {
    const result: ScoreResult = {
      hierarchical: 0, nonHierarchical: 0, kitchenTable: 0, parallel: 0,
      soloPoly: 0, relationshipEscalator: 0, fluidBonding: 0, saferSex: 0
    };
    
    Object.entries(SCORING_MAP).forEach(([category, questionIds]) => {
      result[category as keyof ScoreResult] = questionIds.reduce((sum, qId) => 
        sum + (answers[qId] || 0), 0
      );
    });
    
    return result;
  }, [answers]);

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
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentQuestion].id]: optionIndex + 1 }));
    setError('');
  };

  const handleNext = () => {
    if (!answers[QUESTIONS[currentQuestion].id]) {
      setError(language === 'de' ? 'Bitte wähle eine Antwort.' : 'Please select an answer.');
      return;
    }
    
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setStep('summary');
    }
    setError('');
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      setStep('landing');
    }
    setError('');
  };

  const restart = () => {
    setStep('landing');
    setCurrentQuestion(0);
    setAnswers({});
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
            ? `Entdecke deinen Polyamorie-Stil durch ${QUESTIONS.length} Fragen basierend auf "The Ethical Slut".`
            : `Discover your polyamory style through ${QUESTIONS.length} questions based on "The Ethical Slut".`
          }
        </p>
        <button
          type="button"
          data-testid="start-btn"
          onClick={() => setStep('questions')}
          className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
        >
          {language === 'de' ? 'Quiz starten' : 'Start Quiz'}
        </button>
        <VersionInfo />
      </div>
    );
  }

  if (step === 'questions') {
    const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
    const currentQ = QUESTIONS[currentQuestion];
    const selectedAnswer = answers[currentQ.id];

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentQuestion + 1} / {QUESTIONS.length}
          </span>
          <div className="flex gap-2">
            <ThemeToggle />
            <button type="button" onClick={toggleLanguage} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
              {language === 'de' ? 'EN' : 'DE'}
            </button>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
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
            className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          >
            {language === 'de' ? 'Weiter' : 'Next'}
          </button>
        </div>
        <VersionInfo />
      </div>
    );
  }

  if (step === 'summary') {
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
          {QUESTIONS.map((q, index) => (
            <div key={q.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
              <p className="font-medium text-sm mb-2 text-gray-800 dark:text-gray-200">
                {index + 1}. {language === 'de' ? q.textDE : q.textEN}
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                {options[(answers[q.id] || 1) - 1]}
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
          <button onClick={toggleLanguage} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
            {language === 'de' ? 'EN' : 'DE'}
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-300 text-center px-2">{interpretation.level}</span>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {language === 'de' ? interpretation.adviceDE : interpretation.adviceEN}
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries(scores).map(([category, score]) => {
            const formatName = (name: string) => {
              const nameMap: Record<string, string> = {
                hierarchical: 'Hierarchical',
                nonHierarchical: 'Non-Hierarchical',
                kitchenTable: 'Kitchen Table',
                parallel: 'Parallel',
                soloPoly: 'Solo-Poly',
                relationshipEscalator: 'Relationship Escalator',
                fluidBonding: 'Fluid Bonding',
                saferSex: 'Safer Sex'
              };
              return nameMap[name] || name;
            };

            return (
              <div
                key={category}
                className="bg-gray-50 p-3 rounded relative group cursor-help transition-all hover:bg-gray-100"
                onClick={() => handleTooltipClick(category)}
                onMouseEnter={() => handleTooltipEnter(category)}
                onMouseLeave={handleTooltipLeave}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{formatName(category)}</div>
                  <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-blue-600 font-bold">{score}/50</div>
                {activeTooltip === category && (
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

      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setShowExtendedInterpretation(!showExtendedInterpretation)}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showExtendedInterpretation
            ? (language === 'de' ? 'Weniger Details' : 'Show Less')
            : (language === 'de' ? 'Detaillierte Interpretation' : 'Detailed Interpretation')}
        </button>
        <button
          type="button"
          data-testid="restart-btn"
          onClick={restart}
          className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {language === 'de' ? 'Neu starten' : 'Restart'}
        </button>
      </div>

      {showExtendedInterpretation && (
        <div className="mt-8 space-y-8 border-t pt-8">
          <h3 className="text-2xl font-bold text-gray-800">
            {language === 'de' ? INTERPRETATION_GUIDE.de.title : INTERPRETATION_GUIDE.en.title}
          </h3>

          {/* Structure Types */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-700">
              {language === 'de' ? INTERPRETATION_GUIDE.de.structureTypes : INTERPRETATION_GUIDE.en.structureTypes}
            </h4>
            <div className="space-y-4">
              {['hierarchical', 'nonHierarchical', 'kitchenTable', 'parallel', 'soloPoly'].map(style => {
                const score = scores[style as keyof ScoreResult];
                const guide = language === 'de' ? INTERPRETATION_GUIDE.de : INTERPRETATION_GUIDE.en;
                const interpretation = guide.interpretations[style as keyof typeof guide.interpretations];

                if (score >= 35 && interpretation) {
                  return (
                    <div key={style} className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-blue-900 mb-2">{interpretation.title}</h5>
                      <p className="text-gray-700 mb-3">{interpretation.description}</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
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
            <h4 className="text-lg font-semibold mb-4 text-gray-700">
              {language === 'de' ? INTERPRETATION_GUIDE.de.bondingTypes : INTERPRETATION_GUIDE.en.bondingTypes}
            </h4>
            <div className="space-y-4">
              {['relationshipEscalator', 'fluidBonding', 'saferSex'].map(style => {
                const score = scores[style as keyof ScoreResult];
                const guide = language === 'de' ? INTERPRETATION_GUIDE.de : INTERPRETATION_GUIDE.en;
                const interpretation = guide.interpretations[style as keyof typeof guide.interpretations];

                if (score >= 35 && interpretation) {
                  return (
                    <div key={style} className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-900 mb-2">{interpretation.title}</h5>
                      <p className="text-gray-700 mb-3">{interpretation.description}</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
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
            <h4 className="text-lg font-semibold mb-4 text-gray-700">
              {language === 'de' ? INTERPRETATION_GUIDE.de.reflectionTitle : INTERPRETATION_GUIDE.en.reflectionTitle}
            </h4>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-gray-700 mb-3">
                {language === 'de' ? 'Basierend auf deinen Punktzahlen, überdenke:' : 'Based on your scores, consider:'}
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                {(language === 'de' ? INTERPRETATION_GUIDE.de : INTERPRETATION_GUIDE.en).reflectionQuestions.map((question, idx) => (
                  <li key={idx}>{question}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-700">
              {language === 'de' ? INTERPRETATION_GUIDE.de.nextStepsTitle : INTERPRETATION_GUIDE.en.nextStepsTitle}
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              {(language === 'de' ? INTERPRETATION_GUIDE.de : INTERPRETATION_GUIDE.en).nextSteps.map((step, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">{step.title}:</h5>
                  <p className="text-gray-600">{step.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
            <p className="text-gray-700 italic">
              {language === 'de' ? INTERPRETATION_GUIDE.de.reminder : INTERPRETATION_GUIDE.en.reminder}
            </p>
          </div>
        </div>
      )}
      <VersionInfo />
    </div>
  );
}