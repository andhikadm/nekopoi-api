/**
 * Polyfill Web APIs missing on older Node 18 runtimes.
 * Cheerio → undici expects global File at import time.
 * Must run via Vitest setupFiles before any test imports cheerio.
 */
import { Blob as NodeBlob } from 'node:buffer';

type GlobalWithWebApis = typeof globalThis & {
  File?: unknown;
  Blob?: unknown;
};

const g = globalThis as GlobalWithWebApis;
const BlobCtor = (typeof g.Blob !== 'undefined' ? g.Blob : NodeBlob) as typeof Blob;

if (typeof g.Blob === 'undefined') {
  g.Blob = BlobCtor;
}

if (typeof g.File === 'undefined') {
  class FilePolyfill extends BlobCtor {
    readonly name: string;
    readonly lastModified: number;
    readonly webkitRelativePath = '';

    constructor(fileBits: BlobPart[], fileName: string, options: FilePropertyBag = {}) {
      super(fileBits, options);
      this.name = String(fileName ?? '');
      this.lastModified =
        options.lastModified !== undefined ? Number(options.lastModified) : Date.now();
    }

    get [Symbol.toStringTag](): string {
      return 'File';
    }
  }

  g.File = FilePolyfill;
}
