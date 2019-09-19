const sleep: Function = async (ms?: number) => new Promise((resolve) => setTimeout(resolve, ms));

const QUERY_RETRIES = 3;
const QUERY_TIMEOUT = 1000;

export function queryRetry(): Function {
  const options: QueryOptions = { QUERY_RETRIES, QUERY_TIMEOUT };

  // tslint:disable-next-line:only-arrow-functions
  return function(target: Object, propertyKey: string, descriptor) {
    const originalFn: Function = descriptor.value;
    // tslint:disable-next-line:no-any
    descriptor.value = async function(...args: any[]) {
      try {
        // tslint:disable-next-line:no-invalid-this
        return await retryAsync.apply(this, [originalFn, args, options]);
      } catch (e) {
        e.message = `Failed for '${propertyKey}' for ${QUERY_RETRIES} times.`;
        throw e;
      }
    };

    return descriptor;
  };
}

// tslint:disable-next-line:no-any
async function retryAsync(fn: Function, args: any[], options: QueryOptions) {
  try {
    // tslint:disable-next-line:no-invalid-this
    return await fn.apply(this, args);
  } catch (error) {
    // tslint:disable-next-line:no-parameter-reassignment
    if (options.QUERY_RETRIES-- > 0) {
      await sleep(options.QUERY_TIMEOUT);

      // tslint:disable-next-line:no-invalid-this
      return retryAsync.apply(this, [fn, args, options]);
    } else {
      console.error(error);
      throw new Error(`Failed after Retries`);
    }
  }
}

interface QueryOptions {
  QUERY_RETRIES: number;
  QUERY_TIMEOUT: number;
}
