import React, { useRef, useState } from 'react';

/**
 * Card3D: Interactive 3D perspective tilt container with layered depth.
 * Applies subtle mouse-tracking rotation and dynamic ambient reflection.
 */
export const Card3D = ({
  children,
  className = '',
  intensity = 10,
  depth = 20,
  onClick,
  as: Component = 'div',
  ...props
}) => {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [reflectionPos, setReflectionPos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(${depth}px)`
    );

    setReflectionPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
    setReflectionPos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <Component
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: transformStyle,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
        transformStyle: 'preserve-3d',
      }}
      className={`relative rounded-2xl bg-white border border-[#E5EDE7] shadow-card hover:shadow-3d-hover transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Ambient 3D sheen overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(circle at ${reflectionPos.x}% ${reflectionPos.y}%, rgba(220, 239, 227, 0.45) 0%, transparent 60%)`,
          opacity: reflectionPos.opacity,
        }}
      />
      <div className="relative z-0 h-full">{children}</div>
    </Component>
  );
};
