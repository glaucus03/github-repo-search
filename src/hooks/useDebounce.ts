// デバウンス処理用のカスタムHook
import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * 値をデバウンスするHook
 * @param value デバウンスしたい値
 * @param delay デバウンス遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * コールバック関数をデバウンスするHook
 * @param callback デバウンスしたいコールバック関数
 * @param delay デバウンス遅延時間（ミリ秒）
 * @param deps 依存配列
 * @returns デバウンスされたコールバック関数
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const callbackRef = useRef(callback)

  // コールバックを最新に保つ
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, ...deps]
  ) as T

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * デバウンス状態を管理するHook
 * @param delay デバウンス遅延時間（ミリ秒）
 * @returns [isPending, startDelay, cancelDelay]
 */
export function useDebounceState(delay: number) {
  const [isPending, setIsPending] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const startDelay = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsPending(true)

    timeoutRef.current = setTimeout(() => {
      setIsPending(false)
    }, delay)
  }, [delay])

  const cancelDelay = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      setIsPending(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [isPending, startDelay, cancelDelay] as const
}

/**
 * 検索用に最適化されたデバウンスHook
 * @param initialValue 初期値
 * @param delay デバウンス遅延時間（ミリ秒）
 * @param minLength 最小文字数（この文字数未満の場合はデバウンスしない）
 * @returns [value, debouncedValue, setValue, isDebouncing]
 */
export function useSearchDebounce(
  initialValue: string = '',
  delay: number = 300,
  minLength: number = 2
) {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 最小文字数未満の場合は即座に更新
    if (value.length < minLength) {
      setDebouncedValue(value)
      setIsDebouncing(false)
      return
    }

    setIsDebouncing(true)

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
      setIsDebouncing(false)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay, minLength])

  // 値をクリアする関数
  const clear = useCallback(() => {
    setValue('')
    setDebouncedValue('')
    setIsDebouncing(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // 即座に値を更新する関数
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setDebouncedValue(value)
    setIsDebouncing(false)
  }, [value])

  return {
    value,
    debouncedValue,
    setValue,
    isDebouncing,
    clear,
    flush,
  }
}