import { useCallback, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import { bigIntInLog } from "~utils/bigIntInLog"

function IndexPopup() {
  const buttonWebauthnWindow = useCallback(async () => {
    const response = await sendToBackground({
      name: "webauthnWindow",
      body: {
        creation: {
          user: "Test User",
          challenge: "5r264oeeza45DAAnFgSNLybypGsY64GeIa2C5UqbmRk"
        },
        request: {
          credentialId: "jyZ19cHuw8toyyZDHxz7dOVmZ00fRSsvm1WSMV9dfRc",
          challenge: "5r264oeeza45DAAnFgSNLybypGsY64GeIa2C5UqbmRk"
        }
      }
    })
    bigIntInLog("[popup] response", response)
  }, [])

  return (
    <div
      style={{
        padding: 16
      }}>
      <button onClick={buttonWebauthnWindow}>Open Webauthn window</button>
    </div>
  )
}

export default IndexPopup
