/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface TouchGhostProps {
  imageUrl: string | null;
  position: { x: number; y: number } | null;
}

const TouchGhost: React.FC<TouchGhostProps> = ({ imageUrl, position }) => {
  if (!imageUrl || !position) {
    return null;
  }

  const style: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 9999,
  };

  return (
    <div style={style} className="pointer-events-none">
      <div className="w-8 h-8 bg-white border-3 border-pink-500 rounded-full shadow-xl"></div>
    </div>
  );
};

export default TouchGhost;
