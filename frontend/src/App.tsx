import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const SAMPLE_CODES = {
  python: `import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure()
plt.plot(x, y)
plt.title('Sine Wave 1')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)

x = np.linspace(0, 20, 100)
y = np.sin(x)

plt.figure()
plt.plot(x, y)
plt.title('Sine Wave 2')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)

x = np.linspace(0, 30, 100)
y = np.sin(x)

plt.figure()
plt.plot(x, y)
plt.title('Sine Wave 3')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)

x = np.linspace(0, 40, 100)
y = np.sin(x)

plt.figure()
plt.plot(x, y)
plt.title('Sine Wave 4')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)`,
  
  r: `if (!require("ggplot2")) install.packages("ggplot2", dependencies = TRUE)
library(ggplot2)

x <- seq(0, 10, length.out = 100)
df1 <- data.frame(x = x, y = sin(x))
df2 <- data.frame(x = x, y = cos(x))
df3 <- data.frame(x = x, y = sin(x) * cos(x))
df4 <- data.frame(x = x, y = sin(2*x))

p1 <- ggplot(df1, aes(x, y)) +
  geom_line(color = "#0078d4") +
  ggtitle("Simple Sine Wave") +
  xlab("x") + ylab("sin(x)") +
  theme_minimal()

p2 <- ggplot(df2, aes(x, y)) +
  geom_line(color = "#00a651") +
  ggtitle("Cosine Wave") +
  xlab("x") + ylab("cos(x)") +
  theme_minimal()

p3 <- ggplot(df3, aes(x, y)) +
  geom_line(color = "#e74c3c") +
  ggtitle("Sine-Cosine Product") +
  xlab("x") + ylab("sin(x)cos(x)") +
  theme_minimal()

p4 <- ggplot(df4, aes(x, y)) +
  geom_line(color = "#9b59b6") +
  ggtitle("Double Frequency Sine") +
  xlab("x") + ylab("sin(2x)") +
  theme_minimal()

dev.new()
print(p1)
dev.new()
print(p2)
dev.new()
print(p3)
dev.new()
print(p4)`
};

interface Visualization {
  id: string;
  collage: string;
  language: string;
  timestamp: string;
  runNumber: number;
  imageUrl: string;
  images: string[];
}

function App() {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [visualization, setVisualization] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [showGallery, setShowGallery] = useState<boolean>(false);
  const [selectedVisualization, setSelectedVisualization] = useState<Visualization | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'collage'>('grid');
  const [currentRunImages, setCurrentRunImages] = useState<string[]>([]);
  const [runCounter, setRunCounter] = useState(1);
  const [isGalleryExpanded, setIsGalleryExpanded] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedVis, setSelectedVis] = useState<Visualization | null>(null);

  useEffect(() => {
    setCode(SAMPLE_CODES[language as keyof typeof SAMPLE_CODES]);
  }, [language]);

  useEffect(() => {
    document.title = "Language Agnostic Visualization Web Application";
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate visualization');
      }

      const data = await response.json();
      const images = data.images || [];
      
      setCurrentRunImages(images);
      
      if (images.length > 0) {
        const newVisualization: Visualization = {
          id: Date.now().toString(),
          collage: images.length > 1 ? await createCollage(images) : images[0],
          language,
          timestamp: new Date().toLocaleString(),
          runNumber: runCounter,
          imageUrl: images[0],
          images: images
        };
        setVisualizations(prev => [...prev, newVisualization]);
        setRunCounter(prev => prev + 1);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if ((language === 'python' && extension !== 'py') || 
        (language === 'r' && extension !== 'r')) {
      setError(`Please upload a ${language === 'python' ? '.py' : '.r'} file`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setCode(content);
      }
    };
    reader.readAsText(file);
  };

  const handleGalleryClick = () => {
    setShowGallery(true);
    setSelectedVisualization(null);
  };

  const handleVisualizationClick = (vis: Visualization) => {
    setSelectedVis(vis);
    setShowModal(true);
  };

  const handleBackToGallery = () => {
    setSelectedVisualization(null);
  };

  const handleCloseGallery = () => {
    setShowGallery(false);
    setSelectedVisualization(null);
  };

  const handleViewModeToggle = () => {
    setViewMode(prev => prev === 'grid' ? 'collage' : 'grid');
  };

  const createCollage = async (images: string[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const gridSize = Math.ceil(Math.sqrt(images.length));
    const imgSize = 400;
    
    canvas.width = gridSize * imgSize;
    canvas.height = gridSize * imgSize;
    
    await Promise.all(images.map((img, index) => {
      return new Promise<void>((resolve) => {
        const imgObj = new Image();
        imgObj.onload = () => {
          if (ctx) {
            const x = (index % gridSize) * imgSize;
            const y = Math.floor(index / gridSize) * imgSize;
            ctx.drawImage(imgObj, x, y, imgSize, imgSize);
          }
          resolve();
        };
        imgObj.src = img;
      });
    }));
    
    return canvas.toDataURL();
  };

  const toggleGalleryExpansion = () => {
    setIsGalleryExpanded(!isGalleryExpanded);
  };

  const openVisualizationInNewPage = (images: string[]) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Visualizations</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                background: #ffffff;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
              }
              .visualization-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                padding: 20px;
                max-width: 1200px;
                width: 100%;
              }
              .visualization-item {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                background: white;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                background: white;
              }
            </style>
          </head>
          <body>
            <div class="visualization-grid">
              ${images.map((image, index) => `
                <div class="visualization-item">
                  <img src="${image}" alt="Visualization ${index + 1}" />
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVis(null);
  };

  return (
    <div className="App">
      <div className="top-bar">
        <h1>Language Agnostic Visualization Web Application</h1>
        <select
          className="language-selector"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="python">Python</option>
          <option value="r">R</option>
        </select>
      </div>
      
      <div className="main-content">
        <div className="editor-pane">
          <div className="code-editor-container">
            <textarea
              className="code-editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your visualization code here..."
              spellCheck={false}
            />
          </div>
          <div className="file-actions">
            <input
              type="file"
              ref={fileInputRef}
              className="add-file-input"
              accept={language === 'python' ? '.py' : '.r'}
              onChange={handleFileUpload}
            />
            <button
              className="add-file-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload {language === 'python' ? 'Python' : 'R'} File
            </button>
          </div>
        </div>

        <div className="visualization-pane">
          <div className="visualization-content">
            {loading ? (
              <div className="loading">Generating visualization...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : showGallery ? (
              <div className="gallery-container">
                <div className="gallery-header">
                  <h2>Visualization History</h2>
                  <button className="close-button" onClick={() => setShowGallery(false)}>×</button>
                </div>
                <div className="gallery-grid">
                  {visualizations.map((vis) => (
                    <div key={vis.id} className="gallery-item" onClick={() => handleVisualizationClick(vis)}>
                      <div className="gallery-collage">
                        <img 
                          src={vis.collage} 
                          alt={`Run ${vis.runNumber} Collage`}
                        />
                      </div>
                      <div className="visualization-info">
                        <span>{vis.language}</span>
                        <span>{vis.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="visualization-container">
                <div className="visualization-grid">
                  {currentRunImages.map((image, index) => (
                    <div key={index} className="visualization-item">
                      <img src={image} alt={`Current visualization ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="button-container">
            <button 
              className="generate-button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Visualization'}
            </button>
            {visualizations.length > 0 && (
              <button 
                className="gallery-button"
                onClick={() => setShowGallery(true)}
              >
                History ({visualizations.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && selectedVis && (
        <div className="visualization-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={closeModal}>X</button>
            <div className="modal-grid">
              {selectedVis.images.map((image, index) => (
                <div key={index} className="modal-item">
                  <img src={image} alt={`Visualization ${index + 1}`} />
                </div>
              ))}
            </div>
            <button 
              className="floating-link-button"
              onClick={() => openVisualizationInNewPage(selectedVis.images)}
            >
              Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
