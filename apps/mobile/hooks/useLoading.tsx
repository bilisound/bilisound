import { useState } from "react";

type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

export default function useLoading<T extends any[], R>(
  callback: AsyncFunction<T, R>,
  failureCallback?: (e: unknown) => any,
) {
  const [loading, setLoading] = useState(false);

  async function run(...args: T): Promise<R> {
    setLoading(true);
    let res: R;
    try {
      res = await callback(...args);
    } catch (e) {
      setLoading(false);
      failureCallback?.(e);
      throw e;
    }
    setLoading(false);
    return res;
  }

  return { run, loading };
}
