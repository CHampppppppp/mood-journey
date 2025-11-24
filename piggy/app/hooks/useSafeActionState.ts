'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import * as ReactDom from 'react-dom';

type ActionFn<State> = (
  prevState: State,
  formData: FormData
) => State | Promise<State>;

type ActionStateTuple<State> = readonly [State, (formData: FormData) => void, boolean];

function useActionStatePolyfill<State>(
  action: ActionFn<State>,
  initialState: State
): ActionStateTuple<State> {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const dispatch = useCallback(
    (formData: FormData) => {
      startTransition(async () => {
        const nextState = await action(stateRef.current, formData);
        stateRef.current = nextState;
        setState(nextState);
      });
    },
    [action]
  );

  return [state, dispatch, isPending] as const;
}

type ReactDomWithActionState = typeof ReactDom & {
  useActionState?: <State>(
    action: ActionFn<State>,
    initialState: State
  ) => ActionStateTuple<State>;
};

const domUseActionState = (ReactDom as ReactDomWithActionState).useActionState;
const actionStateImplementation: <State>(
  action: ActionFn<State>,
  initialState: State
) => ActionStateTuple<State> =
  typeof domUseActionState === 'function'
    ? domUseActionState
    : useActionStatePolyfill;

export function useSafeActionState<State>(
  action: ActionFn<State>,
  initialState: State
): ActionStateTuple<State> {
  return actionStateImplementation(action, initialState);
}


