import LoginForm from './LoginForm';
import ForgotPasswordModal from './ForgotPasswordModal';
import { CatSticker, DogSticker, HeartSticker, StarSticker, PawSticker } from './KawaiiStickers';
import Image from 'next/image';

export default function LoginScreen() {
    return (
        <div className="min-h-screen w-full bg-white pattern-dots flex items-center justify-center px-4 py-10 relative overflow-hidden">
            {/* 装饰性贴纸 - 绝对定位在背景 */}
            <div className="absolute inset-0 pointer-events-none">
                {/* 左上角装饰 */}
                <div className="absolute top-10 left-10 animate-float">
                    <CatSticker size={80} />
                </div>
                {/* 右上角装饰 */}
                <div className="absolute top-20 right-16 animate-float" style={{ animationDelay: '0.5s' }}>
                    <DogSticker size={70} />
                </div>
                {/* 左下角装饰 */}
                <div className="absolute bottom-20 left-16 animate-float" style={{ animationDelay: '1s' }}>
                    <PawSticker size={50} />
                </div>
                {/* 右下角装饰 */}
                <div className="absolute bottom-32 right-10 animate-float" style={{ animationDelay: '0.3s' }}>
                    <HeartSticker size={45} />
                </div>
                {/* 散落的星星 */}
                <div className="absolute top-1/4 left-1/4">
                    <StarSticker size={30} />
                </div>
                <div className="absolute top-1/3 right-1/4">
                    <StarSticker size={25} />
                </div>
                <div className="absolute bottom-1/4 left-1/3">
                    <StarSticker size={28} />
                </div>
            </div>

            {/* 主卡片 */}
            <div className="w-full max-w-md card-manga rounded-3xl p-8 space-y-6 text-center relative z-10">
                {/* Makima 贴画装饰 */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full overflow-hidden border-4 border-black shadow-lg sticker-hover">
                    <Image 
                        src="/makima2.jpg" 
                        alt="Makima" 
                        width={80} 
                        height={80}
                        className="w-full h-full object-cover"
                    />
                </div>
                
                <div className="space-y-3">
                    {/* 漫画风格标题 */}
                    <p className="text-sm uppercase tracking-[0.4em] text-black font-bold">
                        ★ PIGGY ONLY ★
                    </p>
                    <h1 className="text-3xl manga-text-pink">
                        宝宝の秘密本
                    </h1>
                    <p className="text-sm text-gray-600 font-medium">
                        只有知道暗号的你才能打开 ♡
                    </p>
                </div>

                {/* 可爱分隔线 */}
                <div className="flex items-center justify-center gap-3 py-2">
                    <div className="h-0.5 w-12 bg-black"></div>
                    <PawSticker size={24} />
                    <div className="h-0.5 w-12 bg-black"></div>
                </div>

                <LoginForm />
                
                <div className="text-xs text-gray-500 space-y-2">
                    <ForgotPasswordModal />
                </div>

                {/* 底部装饰猫咪 */}
                <div className="flex justify-center gap-2 pt-2">
                    <HeartSticker size={20} />
                    <HeartSticker size={24} />
                    <HeartSticker size={20} />
                </div>
            </div>
        </div>
    );
}
