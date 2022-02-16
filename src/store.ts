type ACTION = {
  type?: string
  payload?: unknown
}

export type Reducer<T> = (currentState: T | undefined, action: ACTION) => T
export type Listener = () => void
export type Store<T> = {
  getState: () => T
  dispatch: (action: ACTION) => void
  subscribe: (newListener: Listener) => () => void
}

export const createStore = <T>(yourReducer: Reducer<T>): Store<T> => {
  let listeners: Listener[] = []
  let currentState = yourReducer(undefined, {})

  return {
    getState: () => currentState,
    dispatch: (action) => {
      currentState = yourReducer(currentState, action)

      listeners.forEach((listener) => {
        listener()
      })
    },
    subscribe: (newListener) => {
      listeners.push(newListener)

      const unsubscribe = () => {
        listeners = listeners.filter((l) => l !== newListener)
      }

      return unsubscribe
    },
  }
}
