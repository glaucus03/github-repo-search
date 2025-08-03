import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

// タイマー関連のテストを行うため、fake timersを使用
jest.useFakeTimers()

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('初期値を正しく返す', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    
    expect(result.current).toBe('initial')
  })

  it('指定した遅延時間後に値を更新する', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    expect(result.current).toBe('initial')

    // 値を変更
    rerender({ value: 'updated', delay: 500 })
    
    // まだ遅延時間が経過していないので、初期値のまま
    expect(result.current).toBe('initial')

    // 遅延時間を進める
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // 値が更新される
    expect(result.current).toBe('updated')
  })

  it('遅延時間内に複数回値が変更された場合、最後の値のみが反映される', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    // 複数回値を変更
    rerender({ value: 'update1', delay: 500 })
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    rerender({ value: 'update2', delay: 500 })
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    rerender({ value: 'final', delay: 500 })

    // まだ最初の値のまま
    expect(result.current).toBe('initial')

    // 最後の変更から500ms経過
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // 最後の値が反映される
    expect(result.current).toBe('final')
  })

  it('遅延時間が0の場合、即座に値を更新する', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 }
      }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 0 })

    // 遅延時間が0なので即座に更新
    act(() => {
      jest.runAllTimers()
    })

    expect(result.current).toBe('updated')
  })

  it('同じ値が設定された場合でも正しく動作する', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 500 }
      }
    )

    expect(result.current).toBe('test')

    // 同じ値を再設定
    rerender({ value: 'test', delay: 500 })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('test')
  })

  it('遅延時間が変更された場合、新しい遅延時間が適用される', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    rerender({ value: 'updated', delay: 1000 })

    // 500ms経過（元の遅延時間）
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // まだ更新されない（新しい遅延時間は1000ms）
    expect(result.current).toBe('initial')

    // さらに500ms経過（合計1000ms）
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // 値が更新される
    expect(result.current).toBe('updated')
  })

  it('オブジェクトや配列も正しく処理する', () => {
    const initialObj = { name: 'test', count: 1 }
    const updatedObj = { name: 'updated', count: 2 }

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 500 }
      }
    )

    expect(result.current).toEqual(initialObj)

    rerender({ value: updatedObj, delay: 500 })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toEqual(updatedObj)
  })

  it('nullやundefinedも正しく処理する', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce<string | null | undefined>(value, delay),
      {
        initialProps: { value: 'initial' as string | null | undefined, delay: 500 }
      }
    )

    rerender({ value: null, delay: 500 })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe(null)

    rerender({ value: undefined, delay: 500 })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe(undefined)
  })
})