/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateCompositeImage } from './services/geminiService';
import { Product } from './components/types';
import { PLANT_PRODUCTS, MIXTILES_PRODUCTS } from './constants/products';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import DebugModal from './components/DebugModal';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  if (arr.length < 2) throw new Error('Invalid data URL');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1])
    throw new Error('Could not parse MIME type from data URL');

  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const loadingMessages = [
  'Analyzing your space for product placement...',
  'Finding the perfect spots for your products...',
  'Placing plants and gallery walls...',
  'Creating realistic product integration...',
  'Adding shadows and lighting effects...',
  'Finalizing your space design...',
];

const sceneLoadingMessages = [
  'Processing your space image...',
  'Analyzing room layout and surfaces...',
  'Preparing for product placement...',
  'Setting up your design canvas...',
];

// Demo spaces data
const DEMO_SPACES = [
  {
    id: 'corporate-office',
    name: 'Corporate Office',
    imagePath: '/assets/spaces/corporate office.png',
  },
  {
    id: 'living-room-1',
    name: 'Living Room 1',
    imagePath: '/assets/spaces/living room 1.jpeg',
  },
  // {
  //     id: 'living-room-2',
  //     name: 'Living Room 2',
  //     imagePath: '/assets/spaces/living room 2.jpeg'
  // },
  {
    id: 'personal-office',
    name: 'Personal Office',
    imagePath: '/assets/spaces/personal office.jpg',
  },
];

// Clean plant data fetched from assets/plants directory
const PLANT_ASSETS = [
  {
    id: 'anthurium-red',
    name: 'Anthurium Red',
    imageUrl: '/assets/plants/anthurium-red.webp',
    size: 'sm',
  },

  {
    id: 'snake-plant',
    name: 'Snake Plant',
    imageUrl: '/assets/plants/snake-plant.webp',
    size: 'sm',
  },
  {
    id: 'pothos',
    name: 'Pothos',
    imageUrl: '/assets/plants/pothos.webp',
    size: 'sm',
  },
  {
    id: 'fiddle-leaf-fig',
    name: 'Fiddle Leaf Fig',
    imageUrl: '/assets/plants/fiddle-leaf-fig.webp',
    size: 'lg',
  },
  {
    id: 'money-tree',
    name: 'Money Tree',
    imageUrl: '/assets/plants/money-tree.webp',
    size: 'md',
  },
];

// Combined products array for both plants and tiles
const ALL_PRODUCTS = [
  ...PLANT_ASSETS.map(plant => ({
    id: plant.id,
    name: plant.name,
    imageUrl: plant.imageUrl,
    size: plant.size,
    type: 'plant' as const,
  })),
  ...MIXTILES_PRODUCTS.map(tile => ({
    id: tile.id.toString(),
    name: tile.name,
    imageUrl: tile.imageUrl,
    size: 'gallery-wall' as const,
    type: 'tile' as const,
    pictureCount: tile.pictureCount,
  })),
];

const App: React.FC = () => {
  // Initialize currentStep from URL or default to 'home'
  const getInitialStep = (): 'home' | 'step1' | 'step2' | 'step3' => {
    const urlParams = new URLSearchParams(window.location.search);
    const step = urlParams.get('step');
    return step === 'home' || step === 'step1' || step === 'step2' || step === 'step3'
      ? step
      : 'home';
  };

  const [currentStep, setCurrentStep] = useState<'home' | 'step1' | 'step2' | 'step3'>(
    getInitialStep()
  );
  const [sceneImage, setSceneImage] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    imageUrl: string;
    size: string;
    type: 'plant' | 'tile';
    pictureCount?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSceneLoading, setIsSceneLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [sceneLoadingMessageIndex, setSceneLoadingMessageIndex] = useState(0);
  const [debugPrompt, setDebugPrompt] = useState<string | null>(null);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [selectedDemoSpace, setSelectedDemoSpace] = useState<string | null>(
    null
  );
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [isResultReady, setIsResultReady] = useState<boolean>(false);

  const sceneImageUrl = sceneImage ? URL.createObjectURL(sceneImage) : null;

  // Helper function to update URL with current step
  const updateStepInUrl = (step: 'home' | 'step1' | 'step2' | 'step3') => {
    const url = new URL(window.location.href);
    url.searchParams.set('step', step);
    window.history.replaceState({}, '', url.toString());
  };

  // Wrapper function to update both state and URL
  const setCurrentStepWithUrl = (step: 'home' | 'step1' | 'step2' | 'step3') => {
    setCurrentStep(step);
    updateStepInUrl(step);
  };

  // Handle manual product selection (plants or tiles)
  const handleProductSelect = useCallback(
    (product: {
      id: string;
      name: string;
      imageUrl: string;
      size: string;
      type: 'plant' | 'tile';
      pictureCount?: number;
    }) => {
      setSelectedProduct(product);
    },
    []
  );

  const handleApplyProducts = useCallback(async () => {
    if (!sceneImage) {
      setError('Please upload a scene image first.');
      return;
    }

    if (!selectedProduct) {
      setError('Please select a product first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch the product image and convert to File
      const response = await fetch(selectedProduct.imageUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to load product image for ${selectedProduct.name}`
        );
      }
      const blob = await response.blob();
      const productFile = new File(
        [blob],
        `${selectedProduct.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        { type: 'image/jpeg' }
      );

      // Generate composite image with the selected product using size-based logical placement
      const { finalImageUrl, finalPrompt } = await generateCompositeImage(
        productFile,
        selectedProduct.size,
        selectedProduct.type,
        sceneImage,
        'A room interior scene',
        selectedProduct.pictureCount
      );

      // Update the scene with the new composite image
      const newSceneFile = dataURLtoFile(
        finalImageUrl,
        `generated-scene-${Date.now()}.jpeg`
      );
      setSceneImage(newSceneFile);
      setFinalResult(finalImageUrl);
      setDebugPrompt(finalPrompt);
      setIsResultReady(true);
      setCurrentStepWithUrl('step3');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to apply product. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [sceneImage, selectedProduct]);

  const handleInstantStart = useCallback(
    async (spaceId?: string) => {
      setError(null);
      try {
        // Use selected space or default to first space
        const spaceToUse = spaceId || selectedDemoSpace || DEMO_SPACES[0].id;
        const space =
          DEMO_SPACES.find(s => s.id === spaceToUse) || DEMO_SPACES[0];

        // Fetch the selected demo space
        const sceneResponse = await fetch(space.imagePath);

        if (!sceneResponse.ok) {
          throw new Error(`Failed to load ${space.name} scene`);
        }

        // Convert scene to File object
        const sceneBlob = await sceneResponse.blob();
        const sceneFile = new File([sceneBlob], `${space.name}.jpg`, {
          type: 'image/jpeg',
        });

        // Update state with the selected scene
        setSceneImage(sceneFile);
        setCurrentStepWithUrl('step2');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Could not load demo scene. Details: ${errorMessage}`);
        console.error(err);
      }
    },
    [selectedDemoSpace]
  );

  const handleReset = useCallback(() => {
    // Let useEffect handle URL revocation
    setCurrentStepWithUrl('home');
    setSceneImage(null);
    setError(null);
    setIsLoading(false);
    setIsSceneLoading(false);
    setDebugPrompt(null);
    setFinalResult(null);
    setIsResultReady(false);
    setSelectedProduct(null);
  }, []);

  const handleTryAgain = useCallback(() => {
    setFinalResult(null);
    setIsResultReady(false);
    setSelectedProduct(null);
    setError(null);
  }, []);

  const handleTryDifferentProduct = useCallback(() => {
    setFinalResult(null);
    setIsResultReady(false);
    setError(null);
  }, []);

  const handleChangeScene = useCallback(() => {
    setSceneImage(null);
    setCurrentStepWithUrl('step1');
    setDebugPrompt(null);
  }, []);

  const handleStartDesign = useCallback(() => {
    setCurrentStepWithUrl('step1');
  }, []);

  const handleSceneUpload = useCallback(async (file: File) => {
    setIsSceneLoading(true);
    setError(null);

    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSceneImage(file);
      setCurrentStepWithUrl('step2');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not process scene image. Details: ${errorMessage}`);
    } finally {
      setIsSceneLoading(false);
    }
  }, []);

  // Initialize URL state on component mount
  useEffect(() => {
    updateStepInUrl(currentStep);
  }, []); // Only run once on mount

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
        setSceneLoadingMessageIndex(
          prev => (prev + 1) % sceneLoadingMessages.length
        );
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSceneLoading]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
      setLoadingMessageIndex(0); // Reset on start
      interval = setInterval(() => {
        setLoadingMessageIndex(
          prevIndex => (prevIndex + 1) % loadingMessages.length
        );
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
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.382 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-red-800">
            Oops! Something went wrong
          </h2>
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
            Space Design made easy
          </h2>

          <button
            onClick={handleStartDesign}
            className="bg-pink-500 text-white px-6 py-3 rounded-md font-medium hover:bg-pink-600 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Let's start
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
              onClick={() => setCurrentStepWithUrl('home')}
              className="inline-flex items-center text-pink-600 hover:text-pink-800 font-medium transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Home
            </button>
          </div>

          {/* Step 1: Upload Space */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-4">
              <span className="text-pink-600 font-bold text-lg">1</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Choose a Space
            </h2>

            {/* Demo Spaces Section */}
            <div className="mb-8">
              <p className="text-sm text-gray-500 text-center mb-6">
                Click on any space below to try the demo
              </p>
              <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto mb-6">
                {DEMO_SPACES.map(space => (
                  <div
                    key={space.id}
                    onClick={() => {
                      setSelectedDemoSpace(space.id);
                      handleInstantStart(space.id);
                    }}
                    className={`bg-white rounded-lg shadow-sm border-2 p-3 text-center cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 w-48 ${
                      selectedDemoSpace === space.id
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="aspect-square w-full bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      <img
                        src={space.imagePath}
                        alt={space.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {space.name}
                    </h4>
                    {selectedDemoSpace === space.id && (
                      <div className="text-xs text-pink-600 mt-1 font-medium">
                        ✓ Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
                Or Upload Your Own Space
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Upload a photo of your room or space where you want to place our
                products
              </p>
            </div>

            <div className="card p-6 max-w-md mx-auto">
              {isSceneLoading ? (
                <div className="min-h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Spinner />
                    <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                      Processing Your Space
                    </h3>
                    <p className="text-gray-600 transition-opacity duration-500">
                      {sceneLoadingMessages[sceneLoadingMessageIndex]}
                    </p>
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
              onClick={() => setCurrentStepWithUrl('step1')}
              className="inline-flex items-center text-pink-600 hover:text-pink-800 font-medium transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Step 1
            </button>
          </div>

          {/* Step 2: Choose Product */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-4">
              <span className="text-pink-600 font-bold text-lg">2</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Choose Your Product
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Select a plant or gallery wall for your space. You can only choose
              one item.
            </p>
          </div>

          {/* Available Plants Showcase - Clean Layout - Only show when not showing result */}
          {!isResultReady && (
            <>
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-center mb-6 text-gray-800">
                  Available Products
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
                  {ALL_PRODUCTS.map(product => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className={`bg-white rounded-lg shadow-sm border-2 p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                        selectedProduct?.id === product.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <div className="aspect-square w-full bg-gray-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate flex-1 text-left">
                          {product.name}
                        </h4>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                            selectedProduct?.id === product.id
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {product.type === 'plant' ? product.size?.toUpperCase() : 'GALLERY WALLS'}
                        </span>
                      </div>
                      {selectedProduct?.id === product.id && (
                        <div className="text-xs text-pink-600 mt-2 font-medium">
                          ✓ Selected
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-500 mb-2">
                    {selectedProduct
                      ? `Selected: ${selectedProduct.name} (${selectedProduct.type}) - AI will find the best location`
                      : 'Click a product to select it. You can only choose one item.'}
                  </p>
                  {selectedProduct && (
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* Apply Product Button */}
              <div className="text-center mb-8">
                <button
                  onClick={handleApplyProducts}
                  disabled={isLoading}
                  className="bg-pink-500 text-white px-8 py-4 rounded-lg font-medium hover:bg-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto text-lg"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Analyzing Space & Placing Product...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-6 h-6 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      {selectedProduct
                        ? `Place ${selectedProduct.name}`
                        : 'Place Perfect Product'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Show the result or original space */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-center mb-4 text-gray-800">
              {isResultReady ? 'Your Design Result' : 'Your Space'}
            </h3>
            <div className="card p-2 max-w-2xl mx-auto">
              <img
                src={isResultReady && finalResult ? finalResult : sceneImageUrl}
                alt={
                  isResultReady ? 'Your design result' : 'Your uploaded space'
                }
                className="w-full h-auto max-h-96 rounded-lg object-contain"
              />
            </div>
            <div className="text-center mt-4">
              {isResultReady ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-blue-600 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3 text-left">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">
                          Preview Model Notice
                        </h4>
                        <p className="text-sm text-blue-700">
                          This is a preview model of nano bana. Preview models
                          are not stable and will improve soon.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-x-4">
                    <button
                      onClick={handleReset}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium underline"
                    >
                      Start Over
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleChangeScene}
                  className="text-sm text-pink-600 hover:text-pink-800 font-medium underline"
                >
                  Change Space
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Step 3: Final Result
    if (currentStep === 'step3') {
      return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
          {/* Go Back Button */}
          <div className="text-left mb-6">
            <button
              onClick={() => setCurrentStepWithUrl('step2')}
              className="inline-flex items-center text-pink-600 hover:text-pink-800 font-medium transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Step 2
            </button>
          </div>

          {/* Step 3: Final Result */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-4">
              <span className="text-pink-600 font-bold text-lg">3</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Your Design Result
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Here's how your {selectedProduct?.name} looks in your space!
            </p>
          </div>

          {/* Improvement Suggestions */}
          <div className="mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Help us improve the model
              </h3>
              <ul className="text-sm text-gray-700 space-y-2 text-left">
                <li className="flex items-start">
                  <span className="text-pink-500 mr-2">•</span>
                  <span>Real sizes of the assets - provide actual dimensions for more accurate scaling</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-500 mr-2">•</span>
                  <span>Better quality of the images - higher resolution product photos for sharper results</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-500 mr-2">•</span>
                  <span>Time to play with it so who sees it can understand - more interaction time helps users better understand the tool's capabilities</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Final Result Image */}
          <div className="mb-8">
            <div className="card p-2 max-w-2xl mx-auto">
              <img
                src={finalResult || ''}
                alt="Your design result"
                className="w-full h-auto max-h-96 rounded-lg object-contain"
              />
            </div>
          </div>

          {/* Preview Model Notice */}
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3 text-left">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    Preview Model Notice
                  </h4>
                  <p className="text-sm text-blue-700">
                    This is a preview model of nano bana. Preview models
                    are not stable and will improve soon.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center">
            <div className="space-x-4">
              <button
                onClick={handleReset}
                className="bg-pink-500 text-white px-6 py-3 rounded-md font-medium hover:bg-pink-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Start Over
              </button>
              <button
                onClick={() => setCurrentStepWithUrl('step2')}
                className="bg-gray-500 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Try Different Product
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-white text-zinc-800">
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
      <Footer />
      <DebugModal
        isOpen={isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
        prompt={debugPrompt}
      />
    </div>
  );
};

export default App;
