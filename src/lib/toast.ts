import { sileo, type SileoOptions, type SileoPosition, type SileoStyles, type SileoButton, type SileoState } from 'sileo';

export interface SileoPromiseOptions<T = unknown> {
  loading: SileoOptions;
  success: SileoOptions | ((data: T) => SileoOptions);
  error: SileoOptions | ((err: unknown) => SileoOptions);
  action?: SileoOptions | ((data: T) => SileoOptions);
  position?: SileoPosition;
}

type ToastInput = string | SileoOptions;

function normalizeOptions(input: ToastInput, extraOpts?: Partial<SileoOptions>): SileoOptions {
  if (typeof input === 'string') {
    return {
      title: input,
      ...extraOpts,
    };
  }
  return {
    ...input,
    ...extraOpts,
  };
}

export const toast = {
  success: (input: ToastInput, opts?: Partial<SileoOptions>) =>
    sileo.success(normalizeOptions(input, opts)),
  error: (input: ToastInput, opts?: Partial<SileoOptions>) =>
    sileo.error(normalizeOptions(input, opts)),
  warning: (input: ToastInput, opts?: Partial<SileoOptions>) =>
    sileo.warning(normalizeOptions(input, opts)),
  info: (input: ToastInput, opts?: Partial<SileoOptions>) =>
    sileo.info(normalizeOptions(input, opts)),
  action: (opts: SileoOptions) =>
    sileo.action(opts),
  show: (opts: SileoOptions) =>
    sileo.show(opts),
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    opts: SileoPromiseOptions<T>
  ) => sileo.promise(promise, opts),
  dismiss: (id: string) => sileo.dismiss(id),
  clear: (position?: SileoPosition) => sileo.clear(position),
};

export { sileo };
export type { SileoOptions, SileoPosition, SileoStyles, SileoButton, SileoState };
