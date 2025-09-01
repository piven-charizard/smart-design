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
import TouchGhost from './components/TouchGhost';

// Pre-load a transparent image to use for hiding the default drag ghost.
// This prevents a race condition on the first drag.
const transparentDragImage = new Image();
transparentDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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
    "Analyzing your tiles and easyplants...",
    "Exploring your space...",
    "Finding the perfect spot with AI...",
    "Designing your tiles and easyplants arrangement...",
    "Creating a photorealistic preview...",
    "Bringing your tiles and easyplants vision to life..."
];


const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'home' | 'step1' | 'step2' | 'step3'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [sceneImage, setSceneImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [persistedOrbPosition, setPersistedOrbPosition] = useState<{x: number, y: number} | null>(null);
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);
  const [debugPrompt, setDebugPrompt] = useState<string | null>(null);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // State for touch drag & drop
  const [isTouchDragging, setIsTouchDragging] = useState<boolean>(false);
  const [touchGhostPosition, setTouchGhostPosition] = useState<{x: number, y: number} | null>(null);
  const [isHoveringDropZone, setIsHoveringDropZone] = useState<boolean>(false);
  const [touchOrbPosition, setTouchOrbPosition] = useState<{x: number, y: number} | null>(null);
  const sceneImgRef = useRef<HTMLImageElement>(null);
  
  const sceneImageUrl = sceneImage ? URL.createObjectURL(sceneImage) : null;
  const productImageUrl = selectedProduct ? selectedProduct.imageUrl : null;

  const handleProductSelect = useCallback(async (product: Product) => {
    setError(null);
    try {
      // Fetch the product image and convert to File
      const response = await fetch(product.imageUrl);
      if (!response.ok) {
        throw new Error('Failed to load product image');
      }
      const blob = await response.blob();
      const file = new File([blob], `${product.name.toLowerCase().replace(' ', '-')}.jpg`, { type: 'image/jpeg' });
      
      setProductImageFile(file);
      setSelectedProduct(product);
      setCurrentStep('step3');
    } catch(err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not load the product image. Details: ${errorMessage}`);
      console.error(err);
    }
  }, []);

  const handleProductImageUpload = useCallback((file: File) => {
    // useEffect will handle cleaning up the previous blob URL
    setError(null);
    try {
        const imageUrl = URL.createObjectURL(file);
        const product: Product = {
            id: Date.now(),
            name: file.name,
            imageUrl: imageUrl,
        };
        setProductImageFile(file);
        setSelectedProduct(product);
        setCurrentStep('step3');
        setIsAddProductModalOpen(false);
    } catch(err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not load the product image. Details: ${errorMessage}`);
      console.error(err);
    }
  }, []);

  const handleInstantStart = useCallback(async () => {
    setError(null);
    try {
      // Fetch the office scene
      const sceneResponse = await fetch('/assets/office.jpg');

      if (!sceneResponse.ok) {
        throw new Error('Failed to load office scene');
      }

      // Convert scene to File object
      const sceneBlob = await sceneResponse.blob();
      const sceneFile = new File([sceneBlob], 'office.jpg', { type: 'image/jpeg' });

      // Update state with the office scene
      setSceneImage(sceneFile);
      setCurrentStep('step2');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not load office scene. Details: ${errorMessage}`);
      console.error(err);
    }
  }, []);

    const handleProductDrop = useCallback(async (position: {x: number, y: number}, relativePosition: { xPercent: number; yPercent: number; }) => {
    if (!productImageFile || !selectedProduct) {
      setError('An unexpected error occurred. Please try again.');
      return;
    }
    
    // If no scene image exists, try to load a default one
    let currentSceneImage = sceneImage;
    if (!currentSceneImage) {
      try {
        const sceneResponse = await fetch('/assets/office.jpg');
        if (sceneResponse.ok) {
          const sceneBlob = await sceneResponse.blob();
          currentSceneImage = new File([sceneBlob], 'office.jpg', { type: 'image/jpeg' });
          setSceneImage(currentSceneImage);
        } else {
          setError('Please upload a scene image first, or try the demo.');
          return;
        }
      } catch (err) {
        setError('Please upload a scene image first, or try the demo.');
        return;
      }
    }
    
    setPersistedOrbPosition(position);
    setIsLoading(true);
    setError(null);
    try {
      const { finalImageUrl, debugImageUrl, finalPrompt } = await generateCompositeImage(
        productImageFile, 
        selectedProduct.name,
        currentSceneImage,
        currentSceneImage.name,
        relativePosition
      );
      setDebugImageUrl(debugImageUrl);
      setDebugPrompt(finalPrompt);
      const newSceneFile = dataURLtoFile(finalImageUrl, `generated-scene-${Date.now()}.jpeg`);
      setSceneImage(newSceneFile);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the image. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setPersistedOrbPosition(null);
    }
  }, [productImageFile, sceneImage, selectedProduct]);


  const handleReset = useCallback(() => {
    // Let useEffect handle URL revocation
    setCurrentStep('home');
    setSelectedProduct(null);
    setProductImageFile(null);
    setSceneImage(null);
    setError(null);
    setIsLoading(false);
    setPersistedOrbPosition(null);
    setDebugImageUrl(null);
    setDebugPrompt(null);
  }, []);

  const handleChangeProduct = useCallback(() => {
    // Let useEffect handle URL revocation
    setSelectedProduct(null);
    setProductImageFile(null);
    setPersistedOrbPosition(null);
    setDebugImageUrl(null);
    setDebugPrompt(null);
  }, []);
  
  const handleChangeScene = useCallback(() => {
    setSceneImage(null);
    setCurrentStep('step1');
    setPersistedOrbPosition(null);
    setDebugImageUrl(null);
    setDebugPrompt(null);
  }, []);

  const handleStartDesign = useCallback(() => {
    setCurrentStep('step1');
  }, []);

  const handleSceneUpload = useCallback((file: File) => {
    setSceneImage(file);
    setCurrentStep('step2');
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
  
  useEffect(() => {
    // Clean up the product's object URL when the component unmounts or the URL changes
    return () => {
        if (productImageUrl && productImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(productImageUrl);
        }
    };
  }, [productImageUrl]);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!selectedProduct) return;
    // Prevent page scroll
    e.preventDefault();
    setIsTouchDragging(true);
    const touch = e.touches[0];
    setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchDragging) return;
      const touch = e.touches[0];
      setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });
      
      const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementUnderTouch?.closest<HTMLDivElement>('[data-dropzone-id="scene-uploader"]');

      if (dropZone) {
          const rect = dropZone.getBoundingClientRect();
          setTouchOrbPosition({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
          setIsHoveringDropZone(true);
      } else {
          setIsHoveringDropZone(false);
          setTouchOrbPosition(null);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTouchDragging) return;
      
      const touch = e.changedTouches[0];
      const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementUnderTouch?.closest<HTMLDivElement>('[data-dropzone-id="scene-uploader"]');

      if (dropZone && sceneImgRef.current) {
          const img = sceneImgRef.current;
          const containerRect = dropZone.getBoundingClientRect();
          const { naturalWidth, naturalHeight } = img;
          const { width: containerWidth, height: containerHeight } = containerRect;

          const imageAspectRatio = naturalWidth / naturalHeight;
          const containerAspectRatio = containerWidth / containerHeight;

          let renderedWidth, renderedHeight;
          if (imageAspectRatio > containerAspectRatio) {
              renderedWidth = containerWidth;
              renderedHeight = containerWidth / imageAspectRatio;
          } else {
              renderedHeight = containerHeight;
              renderedWidth = containerHeight * imageAspectRatio;
          }
          
          const offsetX = (containerWidth - renderedWidth) / 2;
          const offsetY = (containerHeight - renderedHeight) / 2;

          const dropX = touch.clientX - containerRect.left;
          const dropY = touch.clientY - containerRect.top;

          const imageX = dropX - offsetX;
          const imageY = dropY - offsetY;
          
          if (!(imageX < 0 || imageX > renderedWidth || imageY < 0 || imageY > renderedHeight)) {
            const xPercent = (imageX / renderedWidth) * 100;
            const yPercent = (imageY / renderedHeight) * 100;
            
            handleProductDrop({ x: dropX, y: dropY }, { xPercent, yPercent });
          }
      }

      setIsTouchDragging(false);
      setTouchGhostPosition(null);
      setIsHoveringDropZone(false);
      setTouchOrbPosition(null);
    };

    if (isTouchDragging) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouchDragging, handleProductDrop]);

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
            className="bg-pink-500 text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-pink-600 transition-all duration-200 shadow-sm hover:shadow-md"
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
              <ImageUploader 
                id="scene-uploader"
                onFileSelect={handleSceneUpload}
                imageUrl={sceneImageUrl}
              />
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
        <div className="w-full max-w-6xl mx-auto animate-fade-in">
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
              Select from our curated collection of beautiful houseplants and Mixtiles photos to design your perfect space.
            </p>
            <ProductSelector 
              products={ALL_PRODUCTS}
              onSelect={handleProductSelect}
              onAddOwnProductClick={handleAddOwnProductClick}
            />
          </div>
          
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
            Choose a product and drag it onto your space to see how it looks
          </p>
        </div>
        
        {/* Products Carousel Above */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">Choose Your Product</h3>
          <ProductSelector 
            products={ALL_PRODUCTS}
            onSelect={handleProductSelect}
            onAddOwnProductClick={handleAddOwnProductClick}
          />
        </div>
        
        {/* Space Below */}
        <div className="card p-6 max-w-8xl mx-auto relative">
          <h3 className="text-lg font-semibold text-center mb-3 text-gray-800">Your Space</h3>
          <div className="flex-grow flex items-center justify-center">
            <ImageUploader 
                ref={sceneImgRef}
                id="scene-uploader" 
                onFileSelect={handleSceneUpload} 
                imageUrl={sceneImageUrl}
                isDropZone={!isLoading}
                onProductDrop={handleProductDrop}
                persistedOrbPosition={persistedOrbPosition}
                showDebugButton={!!debugImageUrl && !isLoading}
                onDebugClick={() => setIsDebugModalOpen(true)}
                isTouchHovering={isHoveringDropZone}
                touchOrbPosition={touchOrbPosition}
            />
          </div>
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 animate-fade-in">
              <div className="text-center">
                <Spinner />
                <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Creating Magic</h3>
                <p className="text-gray-600 transition-opacity duration-500">{loadingMessages[loadingMessageIndex]}</p>
              </div>
            </div>
          )}
          
          <div className="text-center mt-4">
            {sceneImage && !isLoading && (
              <button
                  onClick={handleChangeScene}
                  className="text-sm text-pink-600 hover:text-pink-800 font-medium underline"
              >
                  Change Scene
              </button>
            )}
          </div>
        </div>
        
        {/* Status Section */}
        <div className="text-center mt-8">
           {!isLoading && (
             <div className="bg-gray-50 rounded-xl p-6 max-w-lg mx-auto animate-fade-in">
               <div className="flex items-center justify-center mb-3">
                 <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                   <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3.5M7 21h10" />
                   </svg>
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">Ready to Place</h3>
               </div>
               <p className="text-gray-600">
                  Drag the product to your desired location or click directly on the scene
               </p>
             </div>
           )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white text-zinc-800">
      <TouchGhost 
        imageUrl={isTouchDragging ? productImageUrl : null} 
        position={touchGhostPosition}
      />
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
