/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateCompositeImage } from './services/geminiService';
import { Product } from './components/types';
import { PLANT_PRODUCTS, MIXTILES_PRODUCTS, ALL_PRODUCTS } from './constants/products';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import ObjectCard from './components/ObjectCard';
import ProductSelector from './components/ProductSelector';

import AddProductModal from './components/AddProductModal';
import Spinner from './components/Spinner';
import DebugModal from './components/DebugModal';



// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const loadingMessages = [
    "Analyzing your space for product placement...",
    "Finding the perfect spots for your products...",
    "Placing Easyplant pots and Mixtiles tiles...",
    "Creating realistic product integration...",
    "Adding shadows and lighting effects...",
    "Finalizing your space design..."
];

const sceneLoadingMessages = [
    "Processing your space image...",
    "Analyzing room layout and surfaces...",
    "Preparing for product placement...",
    "Setting up your design canvas..."
];


const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'home' | 'step1' | 'step2' | 'step3'>('home');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [sceneImage, setSceneImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSceneLoading, setIsSceneLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [sceneLoadingMessageIndex, setSceneLoadingMessageIndex] = useState(0);
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);
  const [debugPrompt, setDebugPrompt] = useState<string | null>(null);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const sceneImageUrl = sceneImage ? URL.createObjectURL(sceneImage) : null;

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        // Remove product if already selected
        return prev.filter(p => p.id !== product.id);
      } else {
        // Add product if not selected
        return [...prev, product];
      }
    });
  }, []);

  // Smart placement algorithm to avoid overlapping products
  const generateSmartPosition = useCallback((isTile: boolean, placedPositions: { xPercent: number; yPercent: number; type: 'plant' | 'tile' }[]): { xPercent: number; yPercent: number } => {
    const maxAttempts = 50;
    const minDistance = 25; // Minimum distance between products (as percentage)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let xPercent: number, yPercent: number;
      
      if (isTile) {
        // Tiles go on walls - prefer upper areas and sides
        const wallAreas = [
          { xMin: 5, xMax: 25, yMin: 10, yMax: 40 },   // Left wall
          { xMin: 75, xMax: 95, yMin: 10, yMax: 40 },  // Right wall
          { xMin: 20, xMax: 80, yMin: 5, yMax: 25 },   // Top wall
        ];
        const area = wallAreas[Math.floor(Math.random() * wallAreas.length)];
        xPercent = area.xMin + Math.random() * (area.xMax - area.xMin);
        yPercent = area.yMin + Math.random() * (area.yMax - area.yMin);
      } else {
        // Plants go on flat surfaces - prefer lower areas and center
        const surfaceAreas = [
          { xMin: 15, xMax: 85, yMin: 60, yMax: 90 },  // Floor area
          { xMin: 20, xMax: 80, yMin: 40, yMax: 70 },  // Table/shelf area
        ];
        const area = surfaceAreas[Math.floor(Math.random() * surfaceAreas.length)];
        xPercent = area.xMin + Math.random() * (area.xMax - area.xMin);
        yPercent = area.yMin + Math.random() * (area.yMax - area.yMin);
      }
      
      // Check if this position conflicts with existing products
      const conflicts = placedPositions.some(placed => {
        const distance = Math.sqrt(
          Math.pow(xPercent - placed.xPercent, 2) + 
          Math.pow(yPercent - placed.yPercent, 2)
        );
        return distance < minDistance;
      });
      
      if (!conflicts) {
        return { xPercent, yPercent };
      }
    }
    
    // If we can't find a non-conflicting position, return a fallback
    // that's at least somewhat separated from existing products
    const fallbackX = 20 + (placedPositions.length * 20) % 60;
    const fallbackY = isTile ? 15 + (placedPositions.length * 10) % 25 : 70 + (placedPositions.length * 10) % 20;
    return { xPercent: fallbackX, yPercent: fallbackY };
  }, []);

  const handleApplyProducts = useCallback(async () => {
    if (selectedProducts.length === 0) {
      setError('Please select at least one product to apply.');
      return;
    }

    if (!sceneImage) {
      setError('Please upload a scene image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let currentSceneImage = sceneImage;
      
      // Smart placement algorithm
      const placedPositions: { xPercent: number; yPercent: number; type: 'plant' | 'tile' }[] = [];
      
      // Process each selected product sequentially
      for (const product of selectedProducts) {
        // Fetch the product image and convert to File
        const response = await fetch(product.imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to load product image for ${product.name}`);
        }
        const blob = await response.blob();
        const productFile = new File([blob], `${product.name.toLowerCase().replace(' ', '-')}.jpg`, { type: 'image/jpeg' });
        
        // Generate smart position for the product
        const position = generateSmartPosition(product.isTile || false, placedPositions);
        placedPositions.push({ ...position, type: product.isTile ? 'tile' : 'plant' });
        
        const { finalImageUrl, debugImageUrl, finalPrompt } = await generateCompositeImage(
          productFile, 
          product.isTile || false,
          currentSceneImage,
          position
        );
        
        // Update the scene with the new composite image
        const newSceneFile = dataURLtoFile(finalImageUrl, `generated-scene-${Date.now()}.jpeg`);
        currentSceneImage = newSceneFile;
        setSceneImage(currentSceneImage);
      }
      
      // Clear selected products after successful application
      setSelectedProducts([]);
      setCurrentStep('step3');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to apply products. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProducts, sceneImage]);

  const handleProductImageUpload = useCallback((file: File) => {
    // This function is kept for compatibility with AddProductModal
    // but the new workflow doesn't use it directly
    setError(null);
    console.log('Custom product upload:', file.name);
    setIsAddProductModalOpen(false);
  }, []);

  const handleInstantStart = useCallback(async () => {
    setError(null);
    try {
      // Fetch the office scene
      const sceneResponse = await fetch('/assets/office.png');

      if (!sceneResponse.ok) {
        throw new Error('Failed to load office scene');
      }

      // Convert scene to File object
      const sceneBlob = await sceneResponse.blob();
      const sceneFile = new File([sceneBlob], 'office.png', { type: 'image/jpeg' });

      // Update state with the office scene
      setSceneImage(sceneFile);
      setCurrentStep('step2');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not load office scene. Details: ${errorMessage}`);
      console.error(err);
    }
  }, []);




  const handleReset = useCallback(() => {
    // Let useEffect handle URL revocation
    setCurrentStep('home');
    setSelectedProducts([]);
    setSceneImage(null);
    setError(null);
    setIsLoading(false);
    setIsSceneLoading(false);
    setDebugImageUrl(null);
    setDebugPrompt(null);
  }, []);

  const handleChangeScene = useCallback(() => {
    setSceneImage(null);
    setCurrentStep('step1');
    setDebugImageUrl(null);
    setDebugPrompt(null);
  }, []);

  const handleStartDesign = useCallback(() => {
    setCurrentStep('step1');
  }, []);

  const handleSceneUpload = useCallback(async (file: File) => {
    setIsSceneLoading(true);
    setError(null);
    
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSceneImage(file);
      setCurrentStep('step2');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not process scene image. Details: ${errorMessage}`);
    } finally {
      setIsSceneLoading(false);
    }
  }, []);

  const handleAddOwnProductClick = useCallback(() => {
    setIsAddProductModalOpen(true);
  }, []);

  useEffect(() => {
    // Clean up the scene's object URL when the component unmounts or the URL changes
    return () => {
        if (sceneImageUrl) URL.revokeObjectURL(sceneImageUrl);
    };
  }, [sceneImageUrl]);

  // Scene loading message rotation
  useEffect(() => {
    if (isSceneLoading) {
      const interval = setInterval(() => {
        setSceneLoadingMessageIndex(prev => (prev + 1) % sceneLoadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSceneLoading]);
  


  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
        setLoadingMessageIndex(0); // Reset on start
        interval = setInterval(() => {
            setLoadingMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
        }, 3000);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isLoading]);



  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in card bg-red-50 border-red-200 p-8 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.382 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-red-800">Oops! Something went wrong</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <button
                onClick={handleReset}
                className="bg-pink-500 text-white px-6 py-3 rounded-md font-medium hover:bg-pink-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Try Again
            </button>
          </div>
        );
    }

    // Home page
    if (currentStep === 'home') {
      return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Mixtiles Designer
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-600 font-medium mb-8">
            Space Design Reinvented
          </h2>
          

          
          <button
            onClick={handleStartDesign} 
            className="bg-pink-500 text-white px-6 py-3 rounded-md font-medium hover:bg-pink-600 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Design Your Space 
          </button>
        </div>
      );
    }

    // Step 1: Upload Space
    if (currentStep === 'step1') {
      return (
        <div className="w-full max-w-6xl mx-auto animate-fade-in">
          {/* Go Back Button */}
          <div className="text-left mb-6">
            <button
              onClick={() => setCurrentStep('home')}
              className="inline-flex items-center text-pink-600 hover:text-pink-800 font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
          </div>
          
          {/* Step 1: Upload Space */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-4">
              <span className="text-pink-600 font-bold text-lg">1</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Upload Your Space</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Start by uploading a photo of your room or space where you want to place our products.
            </p>
            <div className="card p-6 max-w-md mx-auto">
              {isSceneLoading ? (
                <div className="min-h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Spinner />
                    <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">Processing Your Space</h3>
                    <p className="text-gray-600 transition-opacity duration-500">{sceneLoadingMessages[sceneLoadingMessageIndex]}</p>
                  </div>
                </div>
              ) : (
                <ImageUploader 
                  id="scene-uploader"
                  onFileSelect={handleSceneUpload}
                  imageUrl={sceneImageUrl}
                />
              )}
            </div>
          </div>
          
          {/* Demo Link */}
          <div className="text-center mt-6">
            <button
              onClick={handleInstantStart}
              className="text-pink-600 hover:text-pink-800 font-medium underline text-sm"
            >
              Try Demo with Sample Images
            </button>
          </div>
        </div>
      );
    }

    // Step 2: Choose Product
    if (currentStep === 'step2') {
      return (
        <div className="w-full max-w-7xl mx-auto animate-fade-in">
          {/* Go Back Button */}
          <div className="text-left mb-6">
            <button
              onClick={() => setCurrentStep('step1')}
              className="inline-flex items-center text-pink-600 hover:text-pink-800 font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Step 1
            </button>
          </div>
          
          {/* Step 2: Choose Product */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-4">
              <span className="text-pink-600 font-bold text-lg">2</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Choose Your Product</h2>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Select from our curated collection of Easyplant pots and Mixtiles photo tiles to design your perfect space.
          </p>
          </div>
          
          {/* Products Grid */}
          <div className="mb-8">
            <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
              <ProductSelector 
                products={ALL_PRODUCTS}
                onSelect={handleProductSelect}
                selectedProducts={selectedProducts}
              />
            </div>
          </div>
          
          {/* Selected Products Summary and Apply Button */}
          {selectedProducts.length > 0 && (
            <div className="mb-8 text-center">
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Selected Products ({selectedProducts.length})
                </h3>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {selectedProducts.map(product => (
                    <span 
                      key={product.id}
                      className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {product.name}
                    </span>
                  ))}
                </div>
                              <button
                onClick={handleApplyProducts}
                disabled={isLoading}
                className="bg-pink-500 text-white px-6 py-3 rounded-md font-medium hover:bg-pink-600 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying Products...
                  </>
                ) : (
                  'Apply Selected Products'
                )}
              </button>
              </div>
            </div>
          )}
          
          {/* Show the uploaded space */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-center mb-4 text-gray-800">Your Space</h3>
            <div className="card p-2 max-w-2xl mx-auto">
              <img 
                src={sceneImageUrl} 
                alt="Your uploaded space" 
                className="w-full h-auto max-h-96 rounded-lg object-contain"
              />
            </div>
            <div className="text-center mt-4">
              <button
                onClick={handleChangeScene}
                className="text-sm text-pink-600 hover:text-pink-800 font-medium underline"
              >
                Change Space
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Step 3: Create Composition
    return (
      <div className="w-full max-w-7xl mx-auto animate-fade-in">
        {/* Go Back Button */}
        <div className="text-left mb-6">
          <button
            onClick={() => setCurrentStep('step2')}
            className="inline-flex items-center text-pink-600 hover:text-pink-800 font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Step 2
          </button>
        </div>
        
        {/* Step 3: Create Composition */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-4 mx-auto">
            <span className="text-pink-600 font-bold text-lg">3</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Perfect Composition</h2>
          <p className="text-gray-600">
            Select multiple Easyplant pots and Mixtiles tiles to apply to your space
          </p>
        </div>
        
        {/* Products Grid Above */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">Choose Your Products</h3>
          <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
            <ProductSelector 
              products={ALL_PRODUCTS}
              onSelect={handleProductSelect}
              selectedProducts={selectedProducts}
            />
          </div>
        </div>
        
        {/* Selected Products Summary and Apply Button */}
        {selectedProducts.length > 0 && (
          <div className="mb-8 text-center">
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selected Products ({selectedProducts.length})
              </h3>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {selectedProducts.map(product => (
                  <span 
                    key={product.id}
                    className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {product.name}
                  </span>
                ))}
              </div>
              <button
                onClick={handleApplyProducts}
                disabled={isLoading}
                className="bg-pink-500 text-white px-6 py-3 rounded-md font-medium hover:bg-pink-600 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying Products...
                  </>
                ) : (
                  'Apply Selected Products'
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Space Below */}
        <div className="card p-6 max-w-8xl mx-auto relative">
          <h3 className="text-lg font-semibold text-center mb-3 text-gray-800">Your Space</h3>
          
          {/* Loading State - Full Screen Overlay */}
          {isLoading ? (
            <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Spinner />
                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">Applying Products</h3>
                <p className="text-gray-600 transition-opacity duration-500">{loadingMessages[loadingMessageIndex]}</p>
                <div className="mt-4 text-sm text-gray-500">
                  Processing {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''}...
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-grow flex items-center justify-center">
                <ImageUploader 
                    id="scene-uploader" 
                    onFileSelect={handleSceneUpload} 
                    imageUrl={sceneImageUrl}
                    showDebugButton={!!debugImageUrl}
                    onDebugClick={() => setIsDebugModalOpen(true)}
                />
              </div>
              
              <div className="text-center mt-4">
                {sceneImage && (
                  <button
                      onClick={handleChangeScene}
                      className="text-sm text-pink-600 hover:text-pink-800 font-medium underline"
                  >
                      Change Scene
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Status Section */}
        <div className="text-center mt-8">
           {!isLoading && selectedProducts.length === 0 && (
             <div className="bg-gray-50 rounded-xl p-6 max-w-lg mx-auto animate-fade-in">
               <div className="flex items-center justify-center mb-3">
                 <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                   <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3.5M7 21h10" />
                   </svg>
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">Select Products</h3>
               </div>
               <p className="text-gray-600">
                  Click on Easyplant pots and Mixtiles tiles above to select them, then use the Apply button to place them in your space
               </p>
             </div>
           )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white text-zinc-800">
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
      <Footer />
      <DebugModal 
        isOpen={isDebugModalOpen} 
        onClose={() => setIsDebugModalOpen(false)}
        imageUrl={debugImageUrl}
        prompt={debugPrompt}
      />
      <AddProductModal 
        isOpen={isAddProductModalOpen} 
        onClose={() => setIsAddProductModalOpen(false)}
        onFileSelect={handleProductImageUpload}
      />
    </div>
  );
};

export default App;
