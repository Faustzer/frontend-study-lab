type Curry<Args extends unknown[], ReturnValue> = Args extends [infer FirstArg, ...infer RestArgs]
  ? (arg: FirstArg) => Curry<RestArgs, ReturnValue>
  : ReturnValue

export function curry<Args extends unknown[], ReturnValue>(
  func: (...args: Args) => ReturnValue,
): Curry<Args, ReturnValue> {
  function curried(...args: unknown[]): unknown {
    if (args.length >= func.length) {
      return func(...args as Args)
    }

    return (...nextArgs: unknown[]) => curried(...args, ...nextArgs)
  }

  return curried as Curry<Args, ReturnValue>
}
