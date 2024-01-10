import { runtime, windows, type Runtime } from "webextension-polyfill"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import { toString } from "~utils/bigInt"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const webauthnWindowUrl = `${runtime.getURL(
    "tabs/webauthn.html"
  )}?user=${encodeURI(req.body.creation.user)}&challengeCreation=${
    req.body.creation.challenge
  }&credentialId=${req.body.request.credentialId}&challengeRequest=${
    req.body.request.challenge
  }`
  const response = await webauthnWindowAsync(webauthnWindowUrl)
  console.log(`[background] Webauthn window closed: ${toString(response)}`)
  res.send({
    response
  })
}

export default handler

export function webauthnWindowAsync(createWindowUrl: string) {
  return new Promise(async (resolve, reject) => {
    let webauthnRegistration
    let webauthnAuthentication
    try {
      // Create a new popup window
      const createdWindow = await windows.create({
        url: createWindowUrl,
        focused: true,
        type: "popup",
        width: 480,
        height: 720
      })

      // Define a listener for window removal
      const removedListener = (removedWindowId: number) => {
        if (removedWindowId === createdWindow.id) {
          windows.onRemoved.removeListener(removedListener)
          if (!webauthnAuthentication && !webauthnRegistration) {
            reject(
              "[background] webauthnAuthentication and webauthnRegistration are undefined"
            )
          }
          if (webauthnRegistration) {
            resolve(webauthnRegistration)
          }
          if (webauthnAuthentication) {
            resolve(webauthnAuthentication)
          }
        }
      }
      // Add the window removal listener
      windows.onRemoved.addListener(removedListener)

      // Define a listener for port communication
      const portListener = (port: Runtime.Port) => {
        if (port.name === "port_createWebauthn") {
          // Listener for credential messages from the new window
          port.onMessage.addListener((message) => {
            if ("error" in message) {
              reject(message.error)
            }
            webauthnRegistration = message
            webauthnAuthentication = undefined
            console.log(`[background] credential: ${toString(webauthnRegistration)}`)
            port.postMessage({ out: "got credential!" })
          })
        }
        if (port.name === "port_requestWebauthn") {
          // Listener for signature messages from the new window
          port.onMessage.addListener((message) => {
            if ("error" in message) {
              reject(message.error)
            }
            webauthnAuthentication = message
            webauthnRegistration = undefined
            console.log(`[background] signature: ${toString(webauthnAuthentication)}`)
            port.postMessage({ out: "got signature!" })
          })
        }
        // Remove the port listener on disconnect
        port.onDisconnect.addListener(() => {
          runtime.onConnect.removeListener(portListener)
        })
      }
      // Add the port listener
      runtime.onConnect.addListener(portListener)
    } catch (e) {
      // Reject the Promise if an error occurs
      reject(e)
      return
    }
  })
}
