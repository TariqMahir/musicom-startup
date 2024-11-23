// src/components/audioPlayer/audioPlayer.js
import React, { useEffect, useRef } from 'react';
import 'components/audioPlayer/mplaya'; // Ensure this path is correct

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.setAttribute('src', src);
    }
  }, [src]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <m-playa ref={audioRef} src={src}></m-playa>
    </div>
  );
};

export default AudioPlayer;
