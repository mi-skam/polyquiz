// <Quiz /> renders the entire flow with language toggle.
// Interpretation logic is pure: getInterpretation(score).
// Auto-saves to localStorage with debouncing.

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

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

const QUESTIONS: Question[] = [
  { id: 1, textDE: "Ich bevorzuge einen Hauptpartner, der Priorität vor allen anderen hat.", textEN: "I prefer having one main partner who takes priority over all others.", weight: 1 },
  { id: 2, textDE: "Alle meine romantischen Beziehungen sollten gleich betrachtet und respektiert werden.", textEN: "All my romantic relationships should be given equal consideration and respect.", weight: 1 },
  { id: 3, textDE: "Ich möchte mit meinem/meinen wichtigsten romantischen Partner(n) zusammenleben.", textEN: "I want to live with my most important romantic partner(s).", weight: 1 },
  { id: 4, textDE: "Ich bevorzuge es, meinen eigenen Wohnraum getrennt von allen Partnern zu behalten.", textEN: "I prefer maintaining my own living space separate from all partners.", weight: 1 },
  { id: 5, textDE: "Ich mag es, wenn alle meine Partner sich kennen und zusammen sozialisieren können.", textEN: "I like when all my partners know each other and can socialize together.", weight: 1 },
  { id: 6, textDE: "Ich bevorzuge es, wenn meine Beziehungen größtenteils unabhängig voneinander sind.", textEN: "I prefer my relationships to be mostly independent from each other.", weight: 1 },
  { id: 7, textDE: "Ich möchte, dass meine Partner an wichtigen Lebensentscheidungen beteiligt sind.", textEN: "I want my partners to be involved in major life decisions.", weight: 1 },
  { id: 8, textDE: "Ich treffe meine eigenen Entscheidungen, ohne bei den meisten Angelegenheiten Partner-Input zu benötigen.", textEN: "I make my own decisions without needing partner input on most matters.", weight: 1 },
  { id: 9, textDE: "Finanzielle Verflechtung mit Partnern fühlt sich natürlich und wünschenswert für mich an.", textEN: "Financial entanglement with partners feels natural and desirable to me.", weight: 1 },
  { id: 10, textDE: "Ich bevorzuge es, meine Finanzen vollständig getrennt von romantischen Partnern zu halten.", textEN: "I prefer to keep my finances completely separate from romantic partners.", weight: 1 },
  { id: 11, textDE: "Ich möchte Details über die anderen Beziehungen meiner Partner wissen.", textEN: "I want to know details about my partners' other relationships.", weight: 1 },
  { id: 12, textDE: "Ich höre lieber nichts über die anderen romantischen/sexuellen Aktivitäten meiner Partner.", textEN: "I prefer not to hear about my partners' other romantic/sexual activities.", weight: 1 },
  { id: 13, textDE: "Ich genieße es, Emotionen und Beziehungsdynamiken ausführlich mit Partnern zu verarbeiten.", textEN: "I enjoy processing emotions and relationship dynamics extensively with partners.", weight: 1 },
  { id: 14, textDE: "Ich bevorzuge es, meine Emotionen privat und unabhängig zu handhaben.", textEN: "I prefer to handle my emotions privately and independently.", weight: 1 },
  { id: 15, textDE: "Regelmäßige Beziehungs-Check-ins und Grenzendiskussionen geben mir Energie.", textEN: "Regular relationship check-ins and boundary discussions energize me.", weight: 1 },
  { id: 16, textDE: "Zu viel Beziehungsverarbeitung fühlt sich erschöpfend und unnötig an.", textEN: "Too much relationship processing feels draining and unnecessary.", weight: 1 },
  { id: 17, textDE: "Ich möchte die primäre Quelle emotionaler Unterstützung für meine Partner sein.", textEN: "I want to be my partners' primary source of emotional support.", weight: 1 },
  { id: 18, textDE: "Ich bevorzuge es, wenn meine Partner mehrere Quellen emotionaler Unterstützung haben.", textEN: "I prefer my partners have multiple sources of emotional support.", weight: 1 },
  { id: 19, textDE: "Geteilte Rituale und Traditionen mit Partnern sind wichtig für mich.", textEN: "Shared rituals and traditions with partners are important to me.", weight: 1 },
  { id: 20, textDE: "Ich bevorzuge Beziehungen, die natürlich fließen ohne formelle Rituale.", textEN: "I prefer relationships that flow naturally without formal rituals.", weight: 1 },
  { id: 21, textDE: "Ich möchte mit ausgewählten Partner(n) eine Fluid-Bindung eingehen (Körperflüssigkeiten ohne Barrieren teilen).", textEN: "I want to fluid bond (share bodily fluids without barriers) with select partner(s).", weight: 1 },
  { id: 22, textDE: "Ich bevorzuge es, mit allen Partnern aus Sicherheitsgründen Barrieren zu verwenden.", textEN: "I prefer using barriers with all partners for safety reasons.", weight: 1 },
  { id: 23, textDE: "Körperliche Berührung und Zuneigung sind meine primären Wege, Liebe zu zeigen.", textEN: "Physical touch and affection are my primary ways of showing love.", weight: 1 },
  { id: 24, textDE: "Ich zeige Liebe mehr durch Taten, Worte oder gemeinsame Zeit als durch körperliche Berührung.", textEN: "I show love more through actions, words, or quality time than physical touch.", weight: 1 },
  { id: 25, textDE: "Sexuelle Exklusivität mit einer Person fühlt sich natürlich und wichtig für mich an.", textEN: "Sexual exclusivity with one person feels natural and important to me.", weight: 1 },
  { id: 26, textDE: "Ich genieße sexuelle Vielfalt und Erkundung mit mehreren Partnern.", textEN: "I enjoy sexual variety and exploration with multiple partners.", weight: 1 },
  { id: 27, textDE: "Ich möchte regelmäßigen, häufigen sexuellen Kontakt mit meinem/meinen romantischen Partner(n).", textEN: "I want regular, frequent sexual contact with my romantic partner(s).", weight: 1 },
  { id: 28, textDE: "Sexuelle Häufigkeit ist weniger wichtig als die Qualität der emotionalen Verbindung.", textEN: "Sexual frequency is less important than emotional connection quality.", weight: 1 },
  { id: 29, textDE: "Gruppen-Sexerfahrungen sprechen mich an.", textEN: "Group sexual experiences appeal to me.", weight: 1 },
  { id: 30, textDE: "Ich bevorzuge stark Eins-zu-Eins intime Begegnungen.", textEN: "I strongly prefer one-on-one intimate encounters.", weight: 1 },
  { id: 31, textDE: "Ich möchte die meiste meiner Freizeit mit meinem Hauptpartner verbringen.", textEN: "I want to spend most of my free time with my primary partner.", weight: 1 },
  { id: 32, textDE: "Ich brauche regelmäßig bedeutende Alleinzeit und persönlichen Raum.", textEN: "I need significant alone time and personal space regularly.", weight: 1 },
  { id: 33, textDE: "Ich bevorzuge Beziehungen, die zu traditionellen Meilensteinen eskalieren (Zusammenziehen, Heirat, Kinder).", textEN: "I prefer relationships that escalate toward traditional milestones (moving in, marriage, kids).", weight: 1 },
  { id: 34, textDE: "Ich widersetze mich traditionellen Beziehungseskalationsmustern.", textEN: "I resist traditional relationship escalation patterns.", weight: 1 },
  { id: 35, textDE: "Langfristige Verpflichtung und Stabilität sind meine obersten Prioritäten.", textEN: "Long-term commitment and stability are my top priorities.", weight: 1 },
  { id: 36, textDE: "Ich schätze Freiheit und Flexibilität über langfristige Verpflichtung.", textEN: "I value freedom and flexibility over long-term commitment.", weight: 1 },
  { id: 37, textDE: "Ich möchte Kinder haben oder habe bereits Kinder mit einem romantischen Partner.", textEN: "I want to have children or already have children with a romantic partner.", weight: 1 },
  { id: 38, textDE: "Ich bevorzuge es, Elternverantwortung nicht mit romantischen Beziehungen zu vermischen.", textEN: "I prefer not to mix parenting responsibilities with romantic relationships.", weight: 1 },
  { id: 39, textDE: "Ich genieße es, gemeinsame Zukünfte und langfristige Ziele mit Partnern zu planen.", textEN: "I enjoy planning shared futures and long-term goals with partners.", weight: 1 },
  { id: 40, textDE: "Ich bevorzuge es, Beziehungen Tag für Tag zu nehmen ohne langfristige Planung.", textEN: "I prefer to take relationships day by day without long-term planning.", weight: 1 },
  { id: 41, textDE: "Ich möchte, dass meine Partner sich in meine bestehenden Freundes- und Familiennetzwerke integrieren.", textEN: "I want my partners to integrate into my existing friend and family networks.", weight: 1 },
  { id: 42, textDE: "Ich bevorzuge es, mein romantisches Leben von anderen sozialen Kreisen getrennt zu halten.", textEN: "I prefer to keep my romantic life separate from other social circles.", weight: 1 },
  { id: 43, textDE: "Ich genieße es, Teil einer größeren polyamoren Gemeinschaft oder Szene zu sein.", textEN: "I enjoy being part of a larger polyamorous community or scene.", weight: 1 },
  { id: 44, textDE: "Ich bevorzuge es, Polyamorie privat ohne Gemeinschaftsbeteiligung zu praktizieren.", textEN: "I prefer to practice polyamory privately without community involvement.", weight: 1 },
  { id: 45, textDE: "Ich möchte, dass meine Metamours (die anderen Partner meiner Partner) mich mögen und akzeptieren.", textEN: "I want my metamours (partners' other partners) to like and accept me.", weight: 1 },
  { id: 46, textDE: "Ich brauche keine Beziehungen zu meinen Metamours, solange alle respektvoll sind.", textEN: "I don't need relationships with my metamours as long as everyone is respectful.", weight: 1 },
  { id: 47, textDE: "Feiertagsfeiern und Familienereignisse sollten alle meine wichtigen Partner einschließen.", textEN: "Holiday celebrations and family events should include all my important partners.", weight: 1 },
  { id: 48, textDE: "Ich bevorzuge traditionelle Familienstrukturen für Feiertage und wichtige Ereignisse.", textEN: "I prefer traditional family structures for holidays and major events.", weight: 1 },
  { id: 49, textDE: "Ich fühle mich energetisiert durch komplexe Beziehungsdynamiken und mehrere Verbindungen.", textEN: "I feel energized by complex relationship dynamics and multiple connections.", weight: 1 },
  { id: 50, textDE: "Ich bevorzuge Einfachheit und weniger Komplikationen in meinem romantischen Leben.", textEN: "I prefer simplicity and fewer complications in my romantic life.", weight: 1 }
];

const OPTIONS_DE = ["Stimme überhaupt nicht zu", "Stimme nicht zu", "Neutral/Unsicher", "Stimme zu", "Stimme voll zu"];
const OPTIONS_EN = ["Strongly Disagree", "Disagree", "Neutral/Unsure", "Agree", "Strongly Agree"];

const SCORING_MAP: Record<string, number[]> = {
  hierarchical: [1, 3, 7, 9, 17, 31, 35, 37, 39, 47],
  nonHierarchical: [2, 8, 18, 32, 34, 36, 40, 44, 46, 50],
  kitchenTable: [5, 11, 13, 15, 19, 41, 43, 45, 47, 49],
  parallel: [6, 12, 14, 16, 20, 42, 44, 46, 48, 50],
  soloPoly: [4, 8, 10, 14, 32, 34, 36, 38, 40, 44],
  relationshipEscalator: [3, 7, 9, 19, 31, 33, 35, 37, 39, 41],
  fluidBonding: [21, 23, 25, 27, 29, 31, 35, 37, 39, 47],
  saferSex: [22, 24, 26, 28, 30, 32, 36, 38, 40, 46]
};

const INTERPRETATION_GUIDE = {
  de: {
    title: "Interpretationsanleitung",
    structureTypes: "Beziehungsstruktur-Typen:",
    bondingTypes: "Bindungs- & Verpflichtungstypen:",
    reflectionTitle: "Reflexionsfragen",
    nextStepsTitle: "Nächste Schritte",
    reminder: "Denke daran: Diese Ergebnisse sind ein Ausgangspunkt für Selbstreflexion, keine definitiven Etiketten. Viele Menschen praktizieren Hybridansätze oder entwickeln sich zwischen Stilen im Laufe der Zeit. Der wichtigste Faktor ist bewusste Wahl und ethische Behandlung aller Beteiligten.",
    interpretations: {
      hierarchical: {
        title: "Hierarchische Polyamorie (35+ Punkte):",
        description: "Du entwickelst dich wahrscheinlich gut mit klaren Beziehungshierarchien, Hauptpartnerschaften und strukturierten Verpflichtungen. Erwäge zu erforschen:",
        points: [
          "Primär/Sekundär-Beziehungsmodelle",
          "Nistpartnerschaften mit Anker-Bindungen",
          "Traditionelle Eskalationsmuster angepasst für mehrere Beziehungen"
        ]
      },
      nonHierarchical: {
        title: "Nicht-Hierarchische Polyamorie (35+ Punkte):",
        description: "Du bevorzugst Gleichberechtigung unter Beziehungen und widersetzte dich auferlegten Hierarchien. Erwäge zu erforschen:",
        points: [
          "Beziehungsanarchie-Prinzipien",
          "Einvernehmliche Nicht-Hierarchie",
          "Organische Beziehungsentwicklung"
        ]
      },
      kitchenTable: {
        title: "Küchentisch-Polyamorie (35+ Punkte):",
        description: "Du genießt miteinander verbundene Beziehungen und Gemeinschaft. Erwäge zu erforschen:",
        points: [
          "Polykules mit hoher Integration",
          "Gruppenaktivitäten und geteilte soziale Kreise",
          "Metamour-Freundschaften und familienähnliche Verbindungen"
        ]
      },
      parallel: {
        title: "Parallele Polyamorie (35+ Punkte):",
        description: "Du bevorzugst unabhängige Beziehungen mit minimaler Überschneidung. Erwäge zu erforschen:",
        points: [
          "Abgeteilte Beziehungen",
          "\"Frag nicht, erzähl nicht\"-Arrangements (mit ethischen Modifikationen)",
          "Unabhängiges Dating mit Respekt für Metamours"
        ]
      },
      soloPoly: {
        title: "Solo-Polyamorie (35+ Punkte):",
        description: "Du priorisierst Autonomie und widersetzte dich traditioneller Beziehungseskalation. Erwäge zu erforschen:",
        points: [
          "Allein leben während mehrere Verbindungen aufrechterhalten werden",
          "Nicht-eskalierende Beziehungen",
          "Hauptpartnerschaft mit dir selbst"
        ]
      },
      relationshipEscalator: {
        title: "Hohe Beziehungsrolltreppe (35+ Punkte):",
        description: "Du fühlst dich zu traditionellen Beziehungsmeilensteinen hingezogen. Erwäge zu erforschen:",
        points: [
          "Hauptpartnerschaften mit ehe-ähnlichen Verpflichtungen",
          "Geteiltes Wohnen, Finanzen und Lebensplanung",
          "Familiengründung innerhalb polyamorer Strukturen"
        ]
      },
      fluidBonding: {
        title: "Fluid-Bindungs-Affinität (35+ Punkte):",
        description: "Du fühlst dich zu intimen körperlichen und emotionalen Bindungen hingezogen. Erwäge zu erforschen:",
        points: [
          "Fluid-Bindungs-Vereinbarungen mit ausgewählten Partnern",
          "Hohe körperliche Intimität und Präsenz",
          "Traditionelle romantische Ausdrücke angepasst für mehrere Beziehungen"
        ]
      },
      saferSex: {
        title: "Safer-Sex-Fokus (35+ Punkte):",
        description: "Du priorisierst Sicherheit, Grenzen und Unabhängigkeit. Erwäge zu erforschen:",
        points: [
          "Umfassende Safer-Sex-Protokolle",
          "Emotionale Regulationstechniken",
          "Unabhängige Verarbeitungs- und Unterstützungssysteme"
        ]
      }
    },
    reflectionQuestions: [
      "Welcher Stil/welche Stile haben bei dir am höchsten abgeschnitten? Wie passt das zu deinen aktuellen Beziehungserfahrungen?",
      "Gibt es bedeutende Unterschiede zwischen dem, was du hoch bewertet hast, und wie du derzeit Beziehungen praktizierst?",
      "Welche Aspekte deiner niedriger bewerteten Stile sprechen dich trotzdem an? Wie könntest du sie einbauen?",
      "Wie passen deine Bindungspräferenzen zu deinen strukturellen Präferenzen?",
      "Was würdest du brauchen, um dich sicher und erfüllt zu fühlen beim Erforschen deines höchstbewerteten Beziehungsstils?"
    ],
    nextSteps: [
      { title: "Recherche", content: "Lies mehr über deine höchstbewerteten Stile in \"The Ethical Slut\" und anderen Polyamorie-Ressourcen" },
      { title: "Kommunikation", content: "Diskutiere deine Ergebnisse mit aktuellen oder potenziellen Partnern" },
      { title: "Experimentieren", content: "Versuche, Elemente deiner bevorzugten Stile schrittweise einzubauen" },
      { title: "Unterstützung", content: "Erwäge, Gemeinschaften beizutreten oder Beratung zu suchen, die sich auf deinen Beziehungsstil spezialisiert" },
      { title: "Wiederholen", content: "Nimm dieses Assessment regelmäßig erneut, während du wächst und dich veränderst" }
    ]
  },
  en: {
    title: "Interpretation Guide",
    structureTypes: "Relationship Structure Types:",
    bondingTypes: "Bonding & Commitment Types:",
    reflectionTitle: "Reflection Questions",
    nextStepsTitle: "Next Steps",
    reminder: "Remember: These results are a starting point for self-reflection, not definitive labels. Many people practice hybrid approaches or evolve between styles over time. The most important factor is conscious choice and ethical treatment of all involved.",
    interpretations: {
      hierarchical: {
        title: "Hierarchical Polyamory (35+ points):",
        description: "You likely thrive with clear relationship hierarchies, primary partnerships, and structured commitments. Consider exploring:",
        points: [
          "Primary/secondary relationship models",
          "Nesting partnerships with anchor bonds",
          "Traditional escalation patterns adapted for multiple relationships"
        ]
      },
      nonHierarchical: {
        title: "Non-Hierarchical Polyamory (35+ points):",
        description: "You prefer equality among relationships and resist imposed hierarchies. Consider exploring:",
        points: [
          "Relationship anarchy principles",
          "Consensual non-hierarchy",
          "Organic relationship development"
        ]
      },
      kitchenTable: {
        title: "Kitchen Table Polyamory (35+ points):",
        description: "You enjoy interconnected relationships and community. Consider exploring:",
        points: [
          "Polycules with high integration",
          "Group activities and shared social circles",
          "Metamour friendships and family-style connections"
        ]
      },
      parallel: {
        title: "Parallel Polyamory (35+ points):",
        description: "You prefer independent relationships with minimal overlap. Consider exploring:",
        points: [
          "Compartmentalized relationships",
          "Don't Ask, Don't Tell arrangements (with ethical modifications)",
          "Independent dating with respect for metamours"
        ]
      },
      soloPoly: {
        title: "Solo Polyamory (35+ points):",
        description: "You prioritize autonomy and resist traditional relationship escalation. Consider exploring:",
        points: [
          "Living alone while maintaining multiple connections",
          "Non-escalating relationships",
          "Primary partnership with yourself"
        ]
      },
      relationshipEscalator: {
        title: "High Relationship Escalator (35+ points):",
        description: "You're drawn to traditional relationship milestones. Consider exploring:",
        points: [
          "Primary partnerships with marriage-like commitments",
          "Shared living, finances, and life planning",
          "Family-building within polyamorous structures"
        ]
      },
      fluidBonding: {
        title: "Fluid Bonding Affinity (35+ points):",
        description: "You're drawn to intimate physical and emotional bonds. Consider exploring:",
        points: [
          "Fluid bonding agreements with select partners",
          "High physical intimacy and presence",
          "Traditional romantic expressions adapted for multiple relationships"
        ]
      },
      saferSex: {
        title: "Safer Sex Focus (35+ points):",
        description: "You prioritize safety, boundaries, and independence. Consider exploring:",
        points: [
          "Comprehensive safer sex protocols",
          "Emotional regulation techniques",
          "Independent processing and support systems"
        ]
      }
    },
    reflectionQuestions: [
      "Which style(s) scored highest for you? How does this align with your current relationship experiences?",
      "Are there significant differences between what you scored high on and how you currently practice relationships?",
      "What aspects of your lower-scoring styles still appeal to you? How might you incorporate them?",
      "How do your bonding preferences align with your structural preferences?",
      "What would you need to feel safe and fulfilled exploring your highest-scoring relationship style?"
    ],
    nextSteps: [
      { title: "Research", content: "Read more about your highest-scoring styles in \"The Ethical Slut\" and other polyamory resources" },
      { title: "Communicate", content: "Discuss your results with current or potential partners" },
      { title: "Experiment", content: "Try incorporating elements of your preferred styles gradually" },
      { title: "Support", content: "Consider joining communities or seeking counseling that specializes in your relationship style" },
      { title: "Revisit", content: "Retake this assessment periodically as you grow and change" }
    ]
  }
};

const STYLE_DESCRIPTIONS: Record<string, { de: string; en: string }> = {
  hierarchical: {
    de: "Hierarchische Polyamorie nutzt eine Struktur mit Ebenen - primäre, sekundäre und tertiäre Partner. Der Hauptpartner hat oft Vorrang bei Entscheidungen, Zeit und emotionalen Ressourcen.",
    en: "Hierarchical polyamory uses a tiered structure - primary, secondary, and tertiary partners. The primary partner often has priority in decisions, time, and emotional resources."
  },
  nonHierarchical: {
    de: "Nicht-hierarchische Polyamorie behandelt alle Partner als gleichwertig, ohne festgelegte Rangordnung. Jede Beziehung entwickelt sich organisch nach ihren eigenen Bedürfnissen.",
    en: "Non-hierarchical polyamory treats all partners as equals without predetermined ranking. Each relationship develops organically based on its own needs."
  },
  kitchenTable: {
    de: "Küchentisch-Polyamorie bedeutet, dass alle Partner sich kennen und gemeinsam Zeit verbringen können - wie eine erweiterte Familie am Küchentisch.",
    en: "Kitchen table polyamory means all partners know each other and can spend time together comfortably - like an extended family gathering around the kitchen table."
  },
  parallel: {
    de: "Parallele Polyamorie hält Beziehungen getrennt. Partner wissen voneinander, haben aber wenig bis keinen Kontakt miteinander.",
    en: "Parallel polyamory keeps relationships separate. Partners know about each other but have little to no contact with one another."
  },
  soloPoly: {
    de: "Solo-Polyamorie priorisiert persönliche Autonomie. Man hat mehrere Beziehungen, behält aber die eigene Unabhängigkeit ohne Verschmelzung mit Partnern.",
    en: "Solo polyamory prioritizes personal autonomy. You maintain multiple relationships while preserving independence without merging lives with partners."
  },
  relationshipEscalator: {
    de: "Die Beziehungsrolltreppe folgt traditionellen Meilensteinen: Dating, Exklusivität, Zusammenziehen, Heirat, Kinder. In Polyamorie oft mit dem Hauptpartner.",
    en: "The relationship escalator follows traditional milestones: dating, exclusivity, moving in, marriage, children. In polyamory, often with a primary partner."
  },
  fluidBonding: {
    de: "Fluid-Bindung bezeichnet das Teilen von Körperflüssigkeiten ohne Barrieren mit ausgewählten Partnern, oft als Zeichen besonderer Intimität und Vertrauen.",
    en: "Fluid bonding refers to sharing bodily fluids without barriers with select partners, often as a sign of special intimacy and trust."
  },
  saferSex: {
    de: "Safer-Sex-Praktiken nutzen konsequent Barrieren und Schutzmaßnahmen mit allen Partnern zur Minimierung von STI-Risiken und zum Schutz aller Beteiligten.",
    en: "Safer sex practices consistently use barriers and protective measures with all partners to minimize STI risks and protect everyone involved."
  }
};

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
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
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
  }, [saveToStorage, saveTimeout]);

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
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {language === 'de' ? 'Polyamorie-Stil Assessment' : 'Polyamory Style Assessment'}
          </h1>
          <button type="button" onClick={toggleLanguage} className="px-3 py-1 bg-blue-100 rounded text-sm">
            {language === 'de' ? 'EN' : 'DE'}
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          {language === 'de' 
            ? `Entdecke deinen Polyamorie-Stil durch ${QUESTIONS.length} Fragen basierend auf "The Ethical Slut".`
            : `Discover your polyamory style through ${QUESTIONS.length} questions based on "The Ethical Slut".`
          }
        </p>
        <button
          type="button"
          data-testid="start-btn"
          onClick={() => setStep('questions')}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {language === 'de' ? 'Quiz starten' : 'Start Quiz'}
        </button>
      </div>
    );
  }

  if (step === 'questions') {
    const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
    const currentQ = QUESTIONS[currentQuestion];
    const selectedAnswer = answers[currentQ.id];

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">
            {currentQuestion + 1} / {QUESTIONS.length}
          </span>
          <button type="button" onClick={toggleLanguage} className="px-3 py-1 bg-blue-100 rounded text-sm">
            {language === 'de' ? 'EN' : 'DE'}
          </button>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2 data-testid="question-text" className="text-xl font-semibold mb-6 text-gray-800">
          {language === 'de' ? currentQ.textDE : currentQ.textEN}
        </h2>

        <div className="space-y-3 mb-6">
          {options.map((option, index) => (
            <label key={index} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="answer"
                value={index}
                checked={selectedAnswer === index + 1}
                onChange={() => handleAnswer(index)}
                className="mr-3 text-blue-600 focus:ring-blue-500"
                data-testid={`option-${index}`}
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-between">
          <button
            type="button"
            data-testid="back-btn"
            onClick={handleBack}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {language === 'de' ? 'Zurück' : 'Back'}
          </button>
          <button
            type="button"
            data-testid="next-btn"
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {language === 'de' ? 'Weiter' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'summary') {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {language === 'de' ? 'Zusammenfassung' : 'Summary'}
          </h2>
          <button type="button" onClick={toggleLanguage} className="px-3 py-1 bg-blue-100 rounded text-sm">
            {language === 'de' ? 'EN' : 'DE'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-96 overflow-y-auto">
          {QUESTIONS.map((q, index) => (
            <div key={q.id} className="p-3 border rounded">
              <p className="font-medium text-sm mb-2">
                {index + 1}. {language === 'de' ? q.textDE : q.textEN}
              </p>
              <p className="text-blue-600 text-sm">
                {options[(answers[q.id] || 1) - 1]}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          data-testid="submit-btn"
          onClick={() => setStep('interpretation')}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {language === 'de' ? 'Auswertung anzeigen' : 'Show Results'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {language === 'de' ? 'Dein Ergebnis' : 'Your Result'}
        </h2>
        <button onClick={toggleLanguage} className="px-3 py-1 bg-blue-100 rounded text-sm">
          {language === 'de' ? 'EN' : 'DE'}
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
          <span className="text-lg font-bold text-blue-600 text-center px-2">{interpretation.level}</span>
        </div>
        <p className="text-gray-700 mb-4">
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
                onClick={() => setActiveTooltip(activeTooltip === category ? null : category)}
                onMouseEnter={() => setActiveTooltip(category)}
                onMouseLeave={() => setActiveTooltip(null)}
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
    </div>
  );
}