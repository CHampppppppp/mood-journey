export default function Loading() {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-pink-200 via-purple-200 to-pink-300 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* 可爱的猪猪加载动画 */}
        <div className="text-6xl animate-bounce">🐷</div>
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-pink-600 font-semibold">加载中...</p>
      </div>
    </div>
  );
}

