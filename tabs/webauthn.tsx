import { useCallback, useEffect, useState } from "react"
import { runtime, type Runtime } from "webextension-polyfill"

import { toString } from "~utils/bigInt"
import { objectFromUrlParams } from "~utils/url"
import { createWebauthn, requestWebauthn } from "~utils/webauthn"

export const Webauthn = () => {
  const [webauthnCreation, setWebauthnCreation] = useState<{
    user?: string
    challenge?: string
  }>()
  const [webauthnRequest, setWebauthnRequest] = useState<{
    credentialId?: string
    challenge: string
  }>()
  const [tabId, setTabId] = useState<number | undefined>()
  const [cred, setCred] = useState<{
    origin: string
    credentialId: string
    publicKeyX: string | number | bigint
    publicKeyY: string | number | bigint
  }>()
  // Record the latest Credential ID for signing in future WebAuthn requests.
  const [credId, setCredId] = useState<string>("")
  const [sig, setSig] = useState<{
    authenticatorData: string
    clientDataJson: string
    sigantureR: string | number | bigint
    signatureS: string | number | bigint
  }>()
  const [port, setPort] = useState<Runtime.Port | null>(null)

  // When a Content Script requests window or tab creation via Service Worker Messaging, passing req.sender.tab.id to the newly created window or tab is recommended. This facilitates sending processed information back to the original Content Script using the specified tabId.
  useEffect(() => {
    const urlParams = window.location.href.split("?")
    const params = objectFromUrlParams(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    )
    setTabId(params.tabId ? params.tabId : undefined)
    setWebauthnCreation({
      user: params.user,
      challenge: params.challengeCreation
    })
    setWebauthnRequest({
      credentialId: params.credentialId,
      challenge: params.challengeRequest
    })

    let runtimePort: Runtime.Port
    // The challengeRequest is the only required parameter.
    if (params.challengeRequest) {
      runtimePort = runtime.connect({
        name: "port_requestWebauthn"
      })
    } else {
      runtimePort = runtime.connect({
        name: "port_createWebauthn"
      })
    }
    setPort(runtimePort)
    runtimePort.onMessage.addListener((message) => {
      console.log(
        `[tab][createWebauthn] runtimePort: ${JSON.stringify(message, null, 2)}`
      )
    })
    return () => {
      runtimePort.disconnect()
    }
  }, [])

  const buttonCreateWebauthn = useCallback(async () => {
    try {
      const credential = await createWebauthn(webauthnCreation)
      console.log(`[tab] credential: ${toString(credential)}`)
      setCred(credential)

      // send to background that create this window
      port.postMessage({
        origin: credential.origin,
        credentialId: credential.credentialId,
        publicKeyX: credential.publicKeyX.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
        publicKeyY: credential.publicKeyY.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
      })
    } catch (error) {
      console.error("Error creating webauthn:", error)
    }
  }, [webauthnCreation, port])

  const buttonRequestWebauthn = useCallback(async () => {
    try {
      const signature = await requestWebauthn(
        cred?.credentialId
          ? { ...webauthnRequest, credentialId: cred.credentialId }
          : webauthnRequest
      )
      console.log(`[tab] signature: ${toString(signature)}`)
      setSig(signature)

      // send to background that create this window
      port.postMessage({
        authenticatorData: signature.authenticatorData,
        clientDataJson: signature.clientDataJson,
        sigantureR: signature.sigantureR.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
        signatureS: signature.signatureS.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
      })
    } catch (error) {
      console.error("Error requesting webauthn:", error)
    }
  }, [webauthnCreation, cred, port])

  const buttonCloseWindow = () => {
    window.onbeforeunload = null
    window.close()
  }

  return (
    <>
      <div>
        <button onClick={buttonCreateWebauthn}>Create Webauthn</button>
        <button onClick={buttonRequestWebauthn}>Request Webauthn</button>
        <button onClick={buttonCloseWindow}>Close Window</button>
      </div>
      {cred === undefined ? (
        <div></div>
      ) : (
        <div>
          <p>Webauthn credential: {toString(cred)}</p>
        </div>
      )}
      {sig === undefined ? (
        <div></div>
      ) : (
        <div>
          <p>Webauthn signature: {toString(sig)}</p>
        </div>
      )}
    </>
  )
}

export default Webauthn
