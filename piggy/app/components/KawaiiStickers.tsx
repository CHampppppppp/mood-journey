'use client';

import { memo } from 'react';

// 可爱小猫贴纸 - 简约线条风格
export const CatSticker = memo(({ className = '', size = 60 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`sticker-hover ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 猫耳朵 */}
    <path d="M25 35 L35 55 L45 35" stroke="#1a1a1a" strokeWidth="3" fill="#ffd6e7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M55 35 L65 55 L75 35" stroke="#1a1a1a" strokeWidth="3" fill="#ffd6e7" strokeLinecap="round" strokeLinejoin="round"/>
    {/* 猫脸 */}
    <ellipse cx="50" cy="60" rx="30" ry="25" fill="white" stroke="#1a1a1a" strokeWidth="3"/>
    {/* 眼睛 */}
    <ellipse cx="40" cy="55" rx="5" ry="6" fill="#1a1a1a"/>
    <ellipse cx="60" cy="55" rx="5" ry="6" fill="#1a1a1a"/>
    {/* 眼睛高光 */}
    <circle cx="42" cy="53" r="2" fill="white"/>
    <circle cx="62" cy="53" r="2" fill="white"/>
    {/* 鼻子 */}
    <path d="M47 62 L50 65 L53 62" fill="#ffd6e7" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round"/>
    {/* 嘴巴 */}
    <path d="M50 65 Q50 70 45 72" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M50 65 Q50 70 55 72" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 胡须 */}
    <path d="M30 60 L20 58" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
    <path d="M30 65 L20 67" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
    <path d="M70 60 L80 58" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
    <path d="M70 65 L80 67" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
    {/* 腮红 */}
    <ellipse cx="32" cy="65" rx="5" ry="3" fill="#ffb6d1" opacity="0.6"/>
    <ellipse cx="68" cy="65" rx="5" ry="3" fill="#ffb6d1" opacity="0.6"/>
  </svg>
));

CatSticker.displayName = 'CatSticker';

// 可爱小狗贴纸 - 简约线条风格
export const DogSticker = memo(({ className = '', size = 60 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`sticker-hover ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 垂耳朵 */}
    <ellipse cx="25" cy="50" rx="12" ry="20" fill="#ffd6e7" stroke="#1a1a1a" strokeWidth="3"/>
    <ellipse cx="75" cy="50" rx="12" ry="20" fill="#ffd6e7" stroke="#1a1a1a" strokeWidth="3"/>
    {/* 狗脸 */}
    <ellipse cx="50" cy="55" rx="28" ry="25" fill="white" stroke="#1a1a1a" strokeWidth="3"/>
    {/* 眼睛 */}
    <ellipse cx="40" cy="50" rx="5" ry="6" fill="#1a1a1a"/>
    <ellipse cx="60" cy="50" rx="5" ry="6" fill="#1a1a1a"/>
    {/* 眼睛高光 */}
    <circle cx="42" cy="48" r="2" fill="white"/>
    <circle cx="62" cy="48" r="2" fill="white"/>
    {/* 鼻子 */}
    <ellipse cx="50" cy="62" rx="6" ry="5" fill="#1a1a1a"/>
    <ellipse cx="50" cy="60" rx="2" ry="1" fill="white" opacity="0.5"/>
    {/* 嘴巴 */}
    <path d="M50 67 L50 72" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
    <path d="M42 75 Q50 80 58 75" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 腮红 */}
    <ellipse cx="30" cy="60" rx="5" ry="3" fill="#ffb6d1" opacity="0.6"/>
    <ellipse cx="70" cy="60" rx="5" ry="3" fill="#ffb6d1" opacity="0.6"/>
    {/* 舌头 */}
    <ellipse cx="50" cy="78" rx="5" ry="4" fill="#ffb6d1" stroke="#1a1a1a" strokeWidth="2"/>
  </svg>
));

DogSticker.displayName = 'DogSticker';

// 爱心贴纸
export const HeartSticker = memo(({ className = '', size = 40 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`sticker-hover ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M50 85 C20 60 10 40 25 25 C40 10 50 25 50 35 C50 25 60 10 75 25 C90 40 80 60 50 85Z" 
      fill="#ffd6e7" 
      stroke="#1a1a1a" 
      strokeWidth="3"
    />
    {/* 高光 */}
    <ellipse cx="35" cy="35" rx="8" ry="5" fill="white" opacity="0.6" transform="rotate(-30 35 35)"/>
  </svg>
));

HeartSticker.displayName = 'HeartSticker';

// 星星贴纸
export const StarSticker = memo(({ className = '', size = 40 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`sticker-hover animate-sparkle ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M50 10 L58 40 L90 40 L65 58 L75 90 L50 70 L25 90 L35 58 L10 40 L42 40 Z" 
      fill="#ffd6e7" 
      stroke="#1a1a1a" 
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
));

StarSticker.displayName = 'StarSticker';

// 肉球贴纸
export const PawSticker = memo(({ className = '', size = 50 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`sticker-hover ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 主肉垫 */}
    <ellipse cx="50" cy="60" rx="22" ry="18" fill="#ffd6e7" stroke="#1a1a1a" strokeWidth="3"/>
    {/* 小肉垫 */}
    <ellipse cx="30" cy="35" rx="10" ry="12" fill="#ffd6e7" stroke="#1a1a1a" strokeWidth="3"/>
    <ellipse cx="50" cy="28" rx="10" ry="12" fill="#ffd6e7" stroke="#1a1a1a" strokeWidth="3"/>
    <ellipse cx="70" cy="35" rx="10" ry="12" fill="#ffd6e7" stroke="#1a1a1a" strokeWidth="3"/>
  </svg>
));

PawSticker.displayName = 'PawSticker';

// 睡觉小猫贴纸
export const SleepyCatSticker = memo(({ className = '', size = 80 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 80" 
    className={`sticker-hover ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 身体 */}
    <ellipse cx="50" cy="55" rx="40" ry="20" fill="white" stroke="#1a1a1a" strokeWidth="3"/>
    {/* 头 */}
    <ellipse cx="25" cy="40" rx="20" ry="18" fill="white" stroke="#1a1a1a" strokeWidth="3"/>
    {/* 耳朵 */}
    <path d="M12 25 L18 38 L28 25" stroke="#1a1a1a" strokeWidth="3" fill="#ffd6e7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 25 L32 38 L38 25" stroke="#1a1a1a" strokeWidth="3" fill="#ffd6e7" strokeLinecap="round" strokeLinejoin="round"/>
    {/* 闭眼 */}
    <path d="M18 40 Q23 45 28 40" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 腮红 */}
    <ellipse cx="15" cy="48" rx="4" ry="2" fill="#ffb6d1" opacity="0.6"/>
    <ellipse cx="35" cy="48" rx="4" ry="2" fill="#ffb6d1" opacity="0.6"/>
    {/* 尾巴 */}
    <path d="M85 45 Q95 30 80 25" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* ZZZ */}
    <text x="40" y="20" fill="#1a1a1a" fontSize="12" fontWeight="bold">z</text>
    <text x="48" y="15" fill="#1a1a1a" fontSize="10" fontWeight="bold">z</text>
    <text x="54" y="10" fill="#1a1a1a" fontSize="8" fontWeight="bold">z</text>
  </svg>
));

SleepyCatSticker.displayName = 'SleepyCatSticker';

// 开心小狗贴纸
export const HappyDogSticker = memo(({ className = '', size = 70 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`sticker-hover ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 垂耳朵 */}
    <ellipse cx="22" cy="45" rx="10" ry="18" fill="#ffd6e7" stroke="#1a1a1a" strokeWidth="3"/>
    <ellipse cx="78" cy="45" rx="10" ry="18" fill="#ffd6e7" stroke="#1a1a1a" strokeWidth="3"/>
    {/* 狗脸 */}
    <ellipse cx="50" cy="50" rx="25" ry="22" fill="white" stroke="#1a1a1a" strokeWidth="3"/>
    {/* 眯眯眼 - 开心表情 */}
    <path d="M35 45 Q40 40 45 45" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M55 45 Q60 40 65 45" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* 鼻子 */}
    <ellipse cx="50" cy="55" rx="5" ry="4" fill="#1a1a1a"/>
    {/* 嘴巴 - 大大的笑 */}
    <path d="M38 62 Q50 75 62 62" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* 舌头 */}
    <ellipse cx="50" cy="68" rx="6" ry="5" fill="#ffb6d1" stroke="#1a1a1a" strokeWidth="2"/>
    {/* 腮红 */}
    <ellipse cx="30" cy="55" rx="4" ry="2" fill="#ffb6d1" opacity="0.7"/>
    <ellipse cx="70" cy="55" rx="4" ry="2" fill="#ffb6d1" opacity="0.7"/>
    {/* 尾巴 (摇动效果通过动画实现) */}
    <path d="M90 60 Q100 50 95 35" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
));

HappyDogSticker.displayName = 'HappyDogSticker';

// 闪闪发光效果
export const Sparkles = memo(({ className = '' }: { className?: string }) => (
  <div className={`absolute pointer-events-none ${className}`}>
    <div className="absolute -top-2 -left-2">
      <StarSticker size={20} className="animate-sparkle" />
    </div>
    <div className="absolute top-0 right-0" style={{ animationDelay: '0.3s' }}>
      <StarSticker size={15} className="animate-sparkle" />
    </div>
    <div className="absolute -bottom-2 left-1/2" style={{ animationDelay: '0.6s' }}>
      <StarSticker size={18} className="animate-sparkle" />
    </div>
  </div>
));

Sparkles.displayName = 'Sparkles';

