import { NavigationProp } from "@react-navigation/native";
import React, { useEffect, useState } from "react";

export type Maybe<T> = { [k in keyof T]?: undefined } | T;

export interface ExteriorPromise<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export function exteriorPromise<T>(): ExteriorPromise<T> {
  let resolve!: ExteriorPromise<T>["resolve"], reject!: ExteriorPromise<T>["reject"];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function usePromise<T>(
  getProm: () => Promise<T>,
  dependencies: React.DependencyList,
): T | null {
  const [result, setResult] = useState<T | null>(null);
  useEffect(() => {
    let ignore = false;
    getProm()
      .then((result) => {
        if (!ignore) setResult(result);
      })
      .catch((err) => console.error(err));
    return () => {
      ignore = true;
    };
  }, dependencies);
  return result;
}

export function useScreenOptions<ScreenOptions extends {}>(
  navigation: NavigationProp<any, any, any, any, ScreenOptions>,
  options: Partial<ScreenOptions> | (() => Partial<ScreenOptions>),
  deps: React.DependencyList = [],
) {
  useEffect(() => {
    navigation.setOptions(typeof options === "function" ? options() : options);
  }, [navigation, ...deps]);
}

export function useScreenTitle(
  navigation: NavigationProp<any, any, any, any, { title: string }>,
  title: string,
) {
  useScreenOptions(navigation, { title }, [title]);
}

export const ensureArray = <T>(x: T | T[]): T[] => (Array.isArray(x) ? x : [x]);
export const ensureArrayOrNull = <T>(x: T | null | T[]): T[] | null =>
  x && (Array.isArray(x) ? (x.length ? x : null) : [x]);
export const boolQuery = (x: "1" | "0" | null | undefined): boolean | null =>
  x === undefined
    ? null
    : // null means a query without a value, e.g. /foo/bar?tri
    x === null || x === "1"
    ? true
    : false;
