export function serializeMemory<T extends { mediaSizeBytes?: bigint | null }>(
  memory: T,
) {
  return {
    ...memory,
    mediaSizeBytes:
      memory.mediaSizeBytes === null || memory.mediaSizeBytes === undefined
        ? null
        : Number(memory.mediaSizeBytes),
  };
}

export function serializeNullableMemory<
  T extends { mediaSizeBytes?: bigint | null },
>(memory: T | null) {
  return memory ? serializeMemory(memory) : null;
}
