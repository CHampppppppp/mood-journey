'use client';

import { useFormStatus } from 'react-dom';
import { X } from 'lucide-react';
import { logout } from '@/lib/auth';

export default function LogoutButton() {
  return (
    <form action={logout}>
      <LogoutSubmit />
    </form>
  );
}

function LogoutSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded-full border-3 border-black bg-white px-3 py-1.5 text-xs font-bold text-black shadow-[2px_2px_0_#1a1a1a] hover:shadow-[3px_3px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-60 transition-all"
      aria-label="退出登录"
    >
      {pending ? (
        <span className="flex items-center gap-1">
          <span className="animate-spin text-xs">🐱</span>
          bye~
        </span>
      ) : (
        <X size={14} strokeWidth={3} />
      )}
    </button>
  );
}
