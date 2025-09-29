import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import interpretationGuideData from '../data/interpretationGuide.json' with { type: "json" };

interface ScoreResult {
  openRelationship: number;
  swinging: number;
  hierarchicalPoly: number;
  nonHierarchicalPoly: number;
  polyfidelity: number;
  soloPoly: number;
  kitchenTable: number;
  parallelPoly: number;
  relationshipAnarchy: number;
  fluidBonding: number;
  bodyFluidMonogamy: number;
  saferSexProtocols: number;
  nestingPartner: number;
  anchorPartner: number;
  abundanceMindset: number;
  scarcityMindset: number;
}

interface ShareButtonProps {
  language: 'de' | 'en';
  resultLevel: string;
  resultAdvice: string;
  scores: ScoreResult;
}

const INTERPRETATION_GUIDE = interpretationGuideData;

export default function ShareButton({ language, resultLevel, resultAdvice, scores }: ShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const detectPlatform = () => {
    const userAgent = navigator.userAgent || navigator.vendor;
    
    // Check for mobile devices
    if (/android/i.test(userAgent)) {
      return 'android';
    }
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return 'ios';
    }
    
    // Default to desktop
    return 'desktop';
  };
  
  const generateImage = async (): Promise<Blob | null> => {
    const resultsElement = document.getElementById('quiz-results');
    if (!resultsElement) return null;
    
    try {
      // Create a clean container for the export
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '800px';
      container.style.padding = '40px';
      container.style.background = 'white';
      container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      document.body.appendChild(container);
      
      // Add title
      const title = document.createElement('h2');
      title.style.fontSize = '32px';
      title.style.marginBottom = '32px';
      title.style.color = '#1f2937';
      title.style.textAlign = 'center';
      title.textContent = language === 'de' ? 'Dein Ergebnis' : 'Your Result';
      container.appendChild(title);
      
      // Add the result circle and interpretation
      const resultSection = document.createElement('div');
      resultSection.style.textAlign = 'center';
      resultSection.style.marginBottom = '40px';
      
      // Create the circle
      const circle = document.createElement('div');
      circle.style.width = '160px';
      circle.style.height = '160px';
      circle.style.margin = '0 auto 24px';
      circle.style.borderRadius = '50%';
      circle.style.background = 'linear-gradient(135deg, #dbeafe 0%, #d1fae5 100%)';
      circle.style.display = 'flex';
      circle.style.alignItems = 'center';
      circle.style.justifyContent = 'center';
      circle.style.padding = '20px';
      circle.style.boxSizing = 'border-box';
      
      const levelText = document.createElement('span');
      levelText.style.fontSize = '14px';
      levelText.style.fontWeight = 'bold';
      levelText.style.color = '#1e40af';
      levelText.style.textAlign = 'center';
      levelText.style.lineHeight = '1.4';
      levelText.textContent = resultLevel;
      circle.appendChild(levelText);
      
      resultSection.appendChild(circle);
      
      // Add the advice text
      const advice = document.createElement('p');
      advice.style.fontSize = '16px';
      advice.style.color = '#4b5563';
      advice.style.lineHeight = '1.6';
      advice.style.maxWidth = '600px';
      advice.style.margin = '0 auto 32px';
      advice.textContent = resultAdvice;
      resultSection.appendChild(advice);
      
      container.appendChild(resultSection);
      
      // Clone and add the scores grid (without the circle)
      const scoresGrid = resultsElement.querySelector('.grid.grid-cols-2');
      if (scoresGrid) {
        const scoresClone = scoresGrid.cloneNode(true) as HTMLElement;
        // Remove any tooltips that might be visible
        scoresClone.querySelectorAll('.absolute').forEach(el => el.remove());
        // Remove hover effects
        scoresClone.querySelectorAll('[class*="hover:"]').forEach(el => {
          const classes = (el as HTMLElement).className.split(' ').filter(c => !c.includes('hover:'));
          (el as HTMLElement).className = classes.join(' ');
        });
        // Style the scores grid
        scoresClone.style.display = 'grid';
        scoresClone.style.gridTemplateColumns = 'repeat(2, 1fr)';
        scoresClone.style.gap = '16px';
        scoresClone.style.marginBottom = '32px';
        container.appendChild(scoresClone);
      }
      
      // Add detailed interpretation section
      const interpretationSection = document.createElement('div');
      interpretationSection.style.marginTop = '40px';
      interpretationSection.style.paddingTop = '32px';
      interpretationSection.style.borderTop = '2px solid #e5e7eb';
      
      const interpretationTitle = document.createElement('h3');
      interpretationTitle.style.fontSize = '24px';
      interpretationTitle.style.fontWeight = 'bold';
      interpretationTitle.style.color = '#1f2937';
      interpretationTitle.style.marginBottom = '24px';
      interpretationTitle.textContent = language === 'de' ? 'Detaillierte Interpretation' : 'Detailed Interpretation';
      interpretationSection.appendChild(interpretationTitle);
      
      // Add high-scoring relationship types
      const relationshipTypes = ['openRelationship', 'swinging', 'hierarchicalPoly', 'nonHierarchicalPoly', 'polyfidelity', 'soloPoly', 'kitchenTable', 'parallelPoly', 'relationshipAnarchy'];
      const highScoringTypes = relationshipTypes.filter(type => scores[type as keyof ScoreResult] >= 15);
      
      if (highScoringTypes.length > 0) {
        const structureTitle = document.createElement('h4');
        structureTitle.style.fontSize = '18px';
        structureTitle.style.fontWeight = '600';
        structureTitle.style.color = '#374151';
        structureTitle.style.marginTop = '20px';
        structureTitle.style.marginBottom = '16px';
        structureTitle.textContent = language === 'de' ? INTERPRETATION_GUIDE.de.structureTypes : INTERPRETATION_GUIDE.en.structureTypes;
        interpretationSection.appendChild(structureTitle);
        
        highScoringTypes.forEach(style => {
          const guide = language === 'de' ? INTERPRETATION_GUIDE.de : INTERPRETATION_GUIDE.en;
          const interpretation = guide.interpretations[style as keyof typeof guide.interpretations];
          if (interpretation) {
            const typeBox = document.createElement('div');
            typeBox.style.backgroundColor = '#eff6ff';
            typeBox.style.padding = '16px';
            typeBox.style.borderRadius = '8px';
            typeBox.style.marginBottom = '16px';
            
            const typeTitle = document.createElement('h5');
            typeTitle.style.fontSize = '16px';
            typeTitle.style.fontWeight = '600';
            typeTitle.style.color = '#1e3a8a';
            typeTitle.style.marginBottom = '8px';
            typeTitle.textContent = interpretation.title;
            typeBox.appendChild(typeTitle);
            
            const typeDesc = document.createElement('p');
            typeDesc.style.fontSize = '14px';
            typeDesc.style.color = '#374151';
            typeDesc.style.marginBottom = '12px';
            typeDesc.style.lineHeight = '1.5';
            typeDesc.textContent = interpretation.description;
            typeBox.appendChild(typeDesc);
            
            const pointsList = document.createElement('ul');
            pointsList.style.fontSize = '13px';
            pointsList.style.color = '#6b7280';
            pointsList.style.paddingLeft = '20px';
            pointsList.style.listStyleType = 'disc';
            interpretation.points.forEach((point: string) => {
              const li = document.createElement('li');
              li.style.marginBottom = '4px';
              li.textContent = point;
              pointsList.appendChild(li);
            });
            typeBox.appendChild(pointsList);
            
            interpretationSection.appendChild(typeBox);
          }
        });
      }
      
      // Add high-scoring bonding types
      const bondingTypes = ['fluidBonding', 'bodyFluidMonogamy', 'saferSexProtocols', 'nestingPartner', 'anchorPartner', 'abundanceMindset', 'scarcityMindset'];
      const highScoringBonding = bondingTypes.filter(type => scores[type as keyof ScoreResult] >= 10);
      
      if (highScoringBonding.length > 0) {
        const bondingTitle = document.createElement('h4');
        bondingTitle.style.fontSize = '18px';
        bondingTitle.style.fontWeight = '600';
        bondingTitle.style.color = '#374151';
        bondingTitle.style.marginTop = '24px';
        bondingTitle.style.marginBottom = '16px';
        bondingTitle.textContent = language === 'de' ? 'Bindungstypen' : 'Bonding Types';
        interpretationSection.appendChild(bondingTitle);
        
        highScoringBonding.forEach(style => {
          const guide = language === 'de' ? INTERPRETATION_GUIDE.de : INTERPRETATION_GUIDE.en;
          const interpretation = guide.interpretations[style as keyof typeof guide.interpretations];
          if (interpretation) {
            const typeBox = document.createElement('div');
            typeBox.style.backgroundColor = '#f0fdf4';
            typeBox.style.padding = '16px';
            typeBox.style.borderRadius = '8px';
            typeBox.style.marginBottom = '16px';
            
            const typeTitle = document.createElement('h5');
            typeTitle.style.fontSize = '16px';
            typeTitle.style.fontWeight = '600';
            typeTitle.style.color = '#14532d';
            typeTitle.style.marginBottom = '8px';
            typeTitle.textContent = interpretation.title;
            typeBox.appendChild(typeTitle);
            
            const typeDesc = document.createElement('p');
            typeDesc.style.fontSize = '14px';
            typeDesc.style.color = '#374151';
            typeDesc.style.marginBottom = '12px';
            typeDesc.style.lineHeight = '1.5';
            typeDesc.textContent = interpretation.description;
            typeBox.appendChild(typeDesc);
            
            const pointsList = document.createElement('ul');
            pointsList.style.fontSize = '13px';
            pointsList.style.color = '#6b7280';
            pointsList.style.paddingLeft = '20px';
            pointsList.style.listStyleType = 'disc';
            interpretation.points.forEach((point: string) => {
              const li = document.createElement('li');
              li.style.marginBottom = '4px';
              li.textContent = point;
              pointsList.appendChild(li);
            });
            typeBox.appendChild(pointsList);
            
            interpretationSection.appendChild(typeBox);
          }
        });
      }
      
      container.appendChild(interpretationSection);
      
      // Add a watermark/source
      const watermark = document.createElement('div');
      watermark.style.marginTop = '32px';
      watermark.style.paddingTop = '16px';
      watermark.style.borderTop = '2px solid #e5e7eb';
      watermark.style.textAlign = 'center';
      watermark.style.color = '#9ca3af';
      watermark.style.fontSize = '14px';
      watermark.innerHTML = language === 'de' 
        ? 'Polyamorie-Stil Assessment<br/>basierend auf "The Ethical Slut"'
        : 'Polyamory Style Assessment<br/>based on "The Ethical Slut"';
      container.appendChild(watermark);
      
      // Generate the image
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Clean up
      document.body.removeChild(container);
      
      // Convert to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  };
  
  const shareOnMobile = async () => {
    setIsGenerating(true);
    
    try {
      const imageBlob = await generateImage();
      if (!imageBlob) {
        throw new Error('Failed to generate image');
      }
      
      const file = new File([imageBlob], 'polyamory-quiz-results.png', { type: 'image/png' });
      
      // Check if Web Share API is available and supports files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: language === 'de' 
            ? 'Mein Polyamorie-Stil Ergebnis'
            : 'My Polyamory Style Result',
          text: language === 'de'
            ? `Mein Ergebnis: ${resultLevel}. ${resultAdvice}`
            : `My result: ${resultLevel}. ${resultAdvice}`,
          files: [file]
        });
      } else {
        // Fallback to download if share is not available
        downloadImage(imageBlob);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to download
      const imageBlob = await generateImage();
      if (imageBlob) {
        downloadImage(imageBlob);
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const downloadImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'polyamory-quiz-results.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleShare = useCallback(async () => {
    const platform = detectPlatform();
    
    if (platform === 'desktop') {
      setIsGenerating(true);
      const imageBlob = await generateImage();
      if (imageBlob) {
        downloadImage(imageBlob);
      }
      setIsGenerating(false);
    } else {
      await shareOnMobile();
    }
  }, [language, resultLevel, resultAdvice, scores]);
  
  const getButtonText = () => {
    if (isGenerating) {
      return language === 'de' ? 'Generiere...' : 'Generating...';
    }
    
    const platform = detectPlatform();
    if (platform === 'desktop') {
      return language === 'de' ? '📥 Ergebnis herunterladen' : '📥 Download Result';
    }
    
    return language === 'de' ? '📤 Ergebnis teilen' : '📤 Share Result';
  };
  
  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isGenerating}
      className="w-full bg-purple-600 dark:bg-purple-700 text-white py-3 px-6 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {getButtonText()}
    </button>
  );
}