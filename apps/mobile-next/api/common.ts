export interface Wrap<T> {
  data: T;
  code: number;
  msg: string;
}

export function defineWrap<T>(e: Wrap<T>) {
  return e;
}
