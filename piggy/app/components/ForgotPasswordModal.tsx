'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { recoverPassword, type RecoveryState } from '@/lib/auth';
import { securityQuestions } from '@/lib/securityQuestions';
import { useToast } from './ToastProvider';
import { useSafeActionState } from '@/app/hooks/useSafeActionState';

const initialRecoveryState: RecoveryState = {};

export default function ForgotPasswordModal() {
    const [open, setOpen] = useState(false);
    const [state, action] = useSafeActionState(recoverPassword, initialRecoveryState);
    const { showToast } = useToast();

    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setCurrentStep(0);
            setAnswers({});
        }
    }, [open]);

    useEffect(() => {
        if (state?.error) {
            showToast(state.error, 'error');
        } else if (state?.success) {
            showToast('闯关成功！快把密码抱回家 💞', 'success');
        }
    }, [showToast, state?.error, state?.success]);

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    };

    const currentQuestion = securityQuestions[currentStep];
    const isLastStep = currentStep === securityQuestions.length - 1;
    const canProceed = currentQuestion && answers[currentQuestion.id];

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-xs text-pink-500 font-semibold hover:text-pink-600 transition cursor-pointer"
            >
                忘记密码？试试密保小游戏
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
                        onClick={() => setOpen(false)}
                    >
                        <div
                            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6 no-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-2 text-center">
                                <h2 className="text-2xl font-bold text-pink-600">爱情密保闯关</h2>
                                <p className="text-sm text-pink-400">
                                    连续答对 3 题就能拿回密码，只能真爱才知道哦 💞
                                </p>
                            </div>
                            <form action={action} className="space-y-6">
                                {securityQuestions.map((q) => (
                                    <input
                                        key={q.id}
                                        type="hidden"
                                        name={q.id}
                                        value={answers[q.id] || ''}
                                    />
                                ))}

                                {!state?.success && currentQuestion && (
                                    <fieldset
                                        key={currentQuestion.id}
                                        className="space-y-3 rounded-2xl border border-pink-100 p-4"
                                    >
                                        <legend className="text-sm font-semibold text-pink-600">
                                            {currentQuestion.question}
                                            <span className="ml-2 text-xs text-pink-400 font-normal">
                                                ({currentStep + 1}/{securityQuestions.length})
                                            </span>
                                        </legend>
                                        <div className="space-y-2">
                                            {currentQuestion.options.map((option) => (
                                                <label
                                                    key={option.id}
                                                    className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm cursor-pointer transition-all ${answers[currentQuestion.id] === option.id
                                                        ? 'border-pink-400 bg-pink-50 text-pink-700'
                                                        : 'border-transparent bg-pink-50/60 text-pink-600 hover:border-pink-200'
                                                        }`}
                                                    onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                                >
                                                    <input
                                                        type="radio"
                                                        className="text-pink-500 focus:ring-pink-300"
                                                        checked={answers[currentQuestion.id] === option.id}
                                                        readOnly
                                                    />
                                                    <span>{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                )}

                                {state?.success && state.password && (
                                    <div className="space-y-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-center">
                                        <p className="text-sm text-green-700 font-semibold">恭喜闯关成功！</p>
                                        <p className="text-lg font-bold text-green-600 tracking-wide">
                                            {state.password}
                                        </p>
                                        <p className="text-xs text-green-500">请妥善保管，不要被坏人看到~</p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    {!state?.success ? (
                                        isLastStep ? (
                                            <RecoverSubmitButton disabled={!canProceed} />
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setCurrentStep((prev) => prev + 1)}
                                                disabled={!canProceed}
                                                className="w-full rounded-2xl bg-gradient-to-r from-pink-400 to-purple-400 px-4 py-3 text-white font-semibold shadow-lg shadow-pink-200/70 transition hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                下一题
                                            </button>
                                        )
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="w-full rounded-2xl border border-pink-200 px-4 py-3 text-pink-500 font-semibold hover:bg-pink-50 transition"
                                    >
                                        {state?.success ? '关闭' : '先不答啦'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

function RecoverSubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending || disabled}
            className="w-full rounded-2xl bg-gradient-to-r from-pink-400 to-purple-400 px-4 py-3 text-white font-semibold shadow-lg shadow-pink-200/70 transition hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {pending ? '真爱验证中...' : '提交答案'}
        </button>
    );
}

