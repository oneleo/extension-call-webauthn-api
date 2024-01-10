export const bigIntInLog = (title: string, structHasBigInt: any) => {
  console.log(
    `${title}: ${JSON.stringify(
      structHasBigInt,
      (_, value) => {
        return typeof value === "bigint" ? value.toString() : value
      },
      2
    )}`
  )
}
