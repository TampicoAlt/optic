import { OpticStorage } from "~/types/Optic";

function createStorageProxy(scope: Storage): OpticStorage {
  return new Proxy(Object.setPrototypeOf({}, Storage.prototype), {
    get(t, prop: string | symbol) {
      const storage = Object.fromEntries(
        Object.entries(scope)
          .filter(([key]) => key.endsWith(`@${$optic.location.host}`))
          .map(([key, value]) => [
            key.slice(0, key.length - $optic.location.host.length - 1),
            value
          ])
      ) as any;

      if (prop === "getItem") {
        return (key: string): string | null => {
          return scope.getItem(`${key}@${$optic.location.host}`);
        };
      } else if (prop === "setItem") {
        return (key: string, value: string): void => {
          return scope.setItem(`${key}@${$optic.location.host}`, value);
        };
      } else if (prop === "removeItem") {
        return (key: string): void => {
          return scope.removeItem(`${key}@${$optic.location.host}`);
        };
      } else if (prop === "key") {
        return (index: number) => {
          return Object.keys(storage)[index];
        };
      } else if (prop === "clear") {
        return (): void => {
          Object.keys(storage).forEach((key) => {
            scope.removeItem(`${key}@${$optic.location.host}`);
          });
        };
      }

      return storage[prop];
    },
    ownKeys() {
      return Object.keys(scope)
        .filter((key) => key.endsWith(`@${$optic.location.host}`))
        .map((key) =>
          key.slice(0, key.length - $optic.location.host.length - 1)
        );
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true
      };
    },
    set(t, key: string | symbol, value: any): boolean {
      scope.setItem(`${key.toString()}@${$optic.location.host}`, value);
      return true;
    }
  });
}

$optic.sessionStorage = createStorageProxy(sessionStorage);
$optic.localStorage = createStorageProxy(localStorage);
