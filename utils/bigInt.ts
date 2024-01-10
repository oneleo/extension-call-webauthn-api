export const toString = (structHasBigInt: any): string => {
  // Resolve TypeError: Do not know how to serialize a BigInt
  // Refer: https://github.com/GoogleChromeLabs/jsbi/issues/30
  return JSON.stringify(
    structHasBigInt,
    (_, value) => {
      return typeof value === "bigint" ? value.toString() : value
    },
    2
  )
}
