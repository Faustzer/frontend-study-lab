type AnyFunction = (this: any, ...args: any[]) => any

export function myBind<F extends AnyFunction>(
  originalFunction: F,
  thisArg: ThisParameterType<F>,
  ...presetArgs: any[]
) {
  return function (...laterArgs: any[]) {
    const allArgs = [...presetArgs, ...laterArgs]
    return originalFunction.call(thisArg, ...allArgs)
  }
}
