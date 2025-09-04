<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Tuc5dMKvboPh2UH4cQJoinuJ1xhAOcdL

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Recent Improvements

### Enhanced Plant Realism (Latest Update)

- **Improved AI Prompts**: Enhanced Gemini AI instructions to create more realistic 3D plant renderings
- **Better Shadow Integration**: More detailed instructions for realistic contact shadows and ambient occlusion
- **Depth Enhancement**: Added CSS 3D effects and perspective transforms for generated images
- **Anti-Photoshop Measures**: Specific instructions to avoid flat, 2D-looking plant placements
- **Lighting Consistency**: Better guidance for matching scene lighting and creating cohesive compositions

The plants should now appear more naturally integrated with realistic depth, shadows, and lighting that matches your scene.
