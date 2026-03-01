'use client';

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';

function DockItem({ children, className = '', onClick, mouseX, spring, distance, magnification, baseItemSize }) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-xl cursor-pointer ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(160deg, #2c2c2c 0%, #141414 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)',
      }}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      whileTap={{ scale: 0.93 }}
    >
      {Children.map(children, child => cloneElement(child, { isHovered }))}
    </motion.div>
  );
}

function DockLabel({ children, className = '', ...rest }) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on('change', latest => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.92 }}
          animate={{ opacity: 1, y: -10, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.92 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`${className} absolute -top-7 left-1/2 w-fit whitespace-pre rounded-md px-2.5 py-1 text-[11px] font-medium tracking-wide`}
          role="tooltip"
          style={{
            x: '-50%',
            color: 'rgba(255,255,255,0.9)',
            background: 'rgba(18,18,18,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            fontFamily: '"SF Pro Text", system-ui, sans-serif',
            letterSpacing: '0.04em',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = '' }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ color: 'rgba(255,255,255,0.8)', width: '55%', height: '55%' }}
    >
      {children}
    </div>
  );
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50
}) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div style={{ height, scrollbarWidth: 'none' }} className="mx-2 flex max-w-full items-center">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`${className} absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-end w-fit gap-2 rounded-2xl pb-2.5 px-3`}
        style={{
          height: panelHeight,
          background: 'rgba(10,10,10,0.92)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.03),
            0 8px 40px rgba(0,0,0,0.8),
            0 2px 8px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.06)
          `,
          backdropFilter: 'blur(28px) saturate(160%)',
        }}
        role="toolbar"
        aria-label="Application dock"
      >
        {/* Top edge highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            width: '80%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)',
            borderRadius: '999px',
          }}
        />

        {/* Bottom edge shadow line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '15%',
            width: '70%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.6), transparent)',
            borderRadius: '999px',
          }}
        />

        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}