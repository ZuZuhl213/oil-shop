export class RequestBodyTooLargeError extends Error {}

export async function readRequestBody(request: Request, maxBodyBytes: number): Promise<ArrayBuffer> {
  if (!request.body) return new ArrayBuffer(0);
  const reader = request.body.getReader();
  let bytes = new Uint8Array(0);
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Check before retaining or copying this chunk, including dishonest Content-Length.
      if (value.byteLength > maxBodyBytes - size) throw new RequestBodyTooLargeError();
      const nextSize = size + value.byteLength;
      if (nextSize > bytes.byteLength) {
        const capacity = Math.min(maxBodyBytes, Math.max(nextSize, bytes.byteLength * 2, 16_384));
        const expanded = new Uint8Array(capacity);
        expanded.set(bytes.subarray(0, size));
        bytes = expanded;
      }
      bytes.set(value, size);
      size = nextSize;
    }
    return size === bytes.byteLength ? bytes.buffer : bytes.buffer.slice(0, size);
  } catch (error) {
    // Cancellation may fail or stay pending; it must not delay the error response.
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}
