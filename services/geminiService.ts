/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// Helper to get intrinsic image dimensions from a File object
const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      if (!event.target?.result) {
        return reject(new Error('Failed to read file.'));
      }
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = err => reject(new Error(`Image load error: ${err}`));
    };
    reader.onerror = err => reject(new Error(`File reader error: ${err}`));
  });
};

// Helper to crop a square image back to an original aspect ratio, removing padding.
const cropToOriginalAspectRatio = (
  imageDataUrl: string,
  originalWidth: number,
  originalHeight: number,
  targetDimension: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageDataUrl;
    img.onload = () => {
      // Re-calculate the dimensions of the content area within the padded square image
      const aspectRatio = originalWidth / originalHeight;
      let contentWidth, contentHeight;
      if (aspectRatio > 1) {
        // Landscape
        contentWidth = targetDimension;
        contentHeight = targetDimension / aspectRatio;
      } else {
        // Portrait or square
        contentHeight = targetDimension;
        contentWidth = targetDimension * aspectRatio;
      }

      // Calculate the top-left offset of the content area
      const x = (targetDimension - contentWidth) / 2;
      const y = (targetDimension - contentHeight) / 2;

      const canvas = document.createElement('canvas');
      // Set canvas to the final, un-padded dimensions
      canvas.width = contentWidth;
      canvas.height = contentHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context for cropping.'));
      }

      // Draw the relevant part of the square generated image onto the new, smaller canvas
      ctx.drawImage(
        img,
        x,
        y,
        contentWidth,
        contentHeight,
        0,
        0,
        contentWidth,
        contentHeight
      );

      // Return the data URL of the newly cropped image
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = err =>
      reject(new Error(`Image load error during cropping: ${err}`));
  });
};

// New resize logic inspired by the reference to enforce a consistent aspect ratio without cropping.
// It resizes the image to fit within a square and adds padding, ensuring a consistent
// input size for the AI model, which enhances stability.
const resizeImage = (file: File, targetDimension: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      if (!event.target?.result) {
        return reject(new Error('Failed to read file.'));
      }
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetDimension;
        canvas.height = targetDimension;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context.'));
        }

        // Fill the canvas with a neutral background to avoid transparency issues
        // and ensure a consistent input format for the model.
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, targetDimension, targetDimension);

        // Calculate new dimensions to fit inside the square canvas while maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let newWidth, newHeight;

        if (aspectRatio > 1) {
          // Landscape image
          newWidth = targetDimension;
          newHeight = targetDimension / aspectRatio;
        } else {
          // Portrait or square image
          newHeight = targetDimension;
          newWidth = targetDimension * aspectRatio;
        }

        // Calculate position to center the image on the canvas
        const x = (targetDimension - newWidth) / 2;
        const y = (targetDimension - newHeight) / 2;

        // Draw the resized image onto the centered position
        ctx.drawImage(img, x, y, newWidth, newHeight);

        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(
                new File([blob], file.name, {
                  type: 'image/jpeg', // Force jpeg to handle padding color consistently
                  lastModified: Date.now(),
                })
              );
            } else {
              reject(new Error('Canvas to Blob conversion failed.'));
            }
          },
          'image/jpeg',
          0.95
        );
      };
      img.onerror = err => reject(new Error(`Image load error: ${err}`));
    };
    reader.onerror = err => reject(new Error(`File reader error: ${err}`));
  });
};

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (
  file: File
): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const arr = dataUrl.split(',');
  if (arr.length < 2) throw new Error('Invalid data URL');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1])
    throw new Error('Could not parse MIME type from data URL');

  const mimeType = mimeMatch[1];
  const data = arr[1];
  return { inlineData: { mimeType, data } };
};

// Helper to convert File to a data URL string
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Generates a composite image using a multi-modal AI model.
 * The model takes a product image (plant or gallery wall) and a scene image to generate a new image
 * with the product placed logically based on its category.
 * @param productImage The file for the product to be placed (plant or gallery wall).
 * @param productSize The size category of the product (small, medium, large, huge, gallery-wall).
 * @param productType The type of product ('plant' or 'tile').
 * @param environmentImage The file for the background environment.
 * @param environmentDescription A text description of the environment.
 * @returns A promise that resolves to an object containing the base64 data URL of the generated image and the final prompt.
 */
export const generateCompositeImage = async (
  productImage: File,
  productSize: string,
  productType: 'plant' | 'tile',
  environmentImage: File,
  environmentDescription: string
): Promise<{ finalImageUrl: string; finalPrompt: string }> => {
  console.log('Starting product placement image generation process...');
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  // Get original scene dimensions for final cropping
  const { width: originalWidth, height: originalHeight } =
    await getImageDimensions(environmentImage);

  // Define standard dimension for model inputs
  const MAX_DIMENSION = 1024;

  // STEP 1: Prepare images by resizing
  console.log('Resizing product and scene images...');
  const resizedProductImage = await resizeImage(productImage, MAX_DIMENSION);
  const resizedEnvironmentImage = await resizeImage(
    environmentImage,
    MAX_DIMENSION
  );

  // STEP 2: Generate composite image with logical product placement
  console.log(
    'Preparing to generate composite image with logical product placement...'
  );

  const productImagePart = await fileToPart(resizedProductImage);
  const environmentImagePart = await fileToPart(resizedEnvironmentImage);

  // Generate placement instructions based on product type and size
  const getPlacementInstructions = (
    type: 'plant' | 'tile',
    size: string
  ): string => {
    if (type === 'tile') {
      return "Place the gallery wall (3-4 pictures arranged together) on a wall surface in the room. Look for empty wall spaces, above furniture like sofas or beds, in hallways, or on feature walls. Position it at eye level (typically 57-60 inches from the floor) and ensure it complements the room's existing decor and color scheme. The gallery wall should be properly sized and oriented for the wall space, maintaining the same shape and arrangement of the 3-4 pictures together.";
    }

    // Plant placement instructions
    switch (size.toLowerCase()) {
      case 'small':
        return 'Place the plant on elevated surfaces like desks, tables, shelves, or countertops where there is reasonable space. Choose locations that make sense for small plants - near windows, on side tables, or on work surfaces.';
      case 'medium':
        return 'Place the plant on the floor near furniture, in corners, or on larger surfaces like coffee tables or dining tables. Position it where it complements the existing furniture without blocking walkways.';
      case 'large':
        return "Place the plant on the floor in open spaces, corners, or as a focal point in the room. Ensure it has enough space around it and doesn't obstruct movement or block important views.";
      case 'huge':
        return "Place the plant on the floor in large open areas where it can serve as a statement piece. Position it in corners, near windows, or as a room divider. Make sure it has plenty of space and doesn't overwhelm the room.";
      default:
        return 'Place the plant in a logical location that makes sense for its size and the room layout.';
    }
  };

  const prompt = `
**Role:**
You are a visual composition expert specializing in product placement. Your task is to take a product image (plant or gallery wall) and seamlessly integrate it into a room scene, placing it logically based on the product's category.

**Specifications:**
-   **Product to add:**
    The first image provided. It may be surrounded by black padding or background, which you should ignore and treat as transparent and only keep the product.
-   **Room scene to use:**
    The second image provided. It may also be surrounded by black padding, which you should ignore.
-   **Product Category:** ${productType}
-   **Placement Instructions (Crucial):**
    ${getPlacementInstructions(productType, productSize)}
    -   You should only place the product once in the most logical location.
    -   Do not add any other items or objects - only place the product that was provided.
-   **Final Image Requirements:**
    -   The output image's style, lighting, shadows, reflections, and camera perspective must exactly match the original scene.
    -   Do not just copy and paste the product. You must intelligently re-render it to fit the context. Adjust the product's perspective and orientation to its most natural position, scale it appropriately, and ensure it casts realistic shadows according to the scene's light sources.
    -   The product must have proportional realism. A small plant cannot be bigger than a sofa, and a gallery wall should be appropriately sized for the wall space.
    -   You must not return the original scene image without product placement. The product must always be present in the composite image.
    -   Do not add any other items, decorations, or objects beyond the single product provided.

The output should ONLY be the final, composed image. Do not add any text or explanation.
`;

  const textPart = { text: prompt };

  console.log('Sending images and product placement prompt...');

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts: [productImagePart, environmentImagePart, textPart] },
  });

  console.log('Received response.');

  const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(
    part => part.inlineData
  );

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    console.log(`Received image data (${mimeType}), length:`, data.length);
    const generatedSquareImageUrl = `data:${mimeType};base64,${data}`;

    console.log('Cropping generated image to original aspect ratio...');
    const finalImageUrl = await cropToOriginalAspectRatio(
      generatedSquareImageUrl,
      originalWidth,
      originalHeight,
      MAX_DIMENSION
    );

    return { finalImageUrl, finalPrompt: prompt };
  }

  console.error('Model response did not contain an image part.', response);
  throw new Error('The AI model did not return an image. Please try again.');
};
