/**
 * Created by samhwang1990@gmail.com.
 */

export type FixedSizeArray<T extends number, U> = T extends 0
    ? void[]
    : readonly U[] & {
          0: U;
          length: T;
      };

export type Measure<T extends number> = T extends 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 ? T : never;

export type Append<T extends any[], U> = {
    0: [U];
    1: [T[0], U];
    2: [T[0], T[1], U];
    3: [T[0], T[1], T[2], U];
    4: [T[0], T[1], T[2], T[3], U];
    5: [T[0], T[1], T[2], T[3], T[4], U];
    6: [T[0], T[1], T[2], T[3], T[4], T[5], U];
    7: [T[0], T[1], T[2], T[3], T[4], T[5], T[6], U];
    8: [T[0], T[1], T[2], T[3], T[4], T[5], T[6], T[7], U];
}[Measure<T['length']>];

export type AsArray<T> = T extends any[] ? T : [];

export type Callback<E, T> = (error?: E, result?: T) => void;

export type Tap = TapOptions & {
    name: string;
    fn: Function;
};

export interface TapOptions {}

export type ArgumentNames<T extends any[]> = FixedSizeArray<T['length'], string>;
