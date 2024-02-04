import path from 'path'
import { app, ipcMain, ipcRenderer } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
const readline = require('readline');

const sdk = require('node-appwrite');
const client = new sdk.Client();

var authenticatedUser = {}
var authMode = "locked"

const databases = new sdk.Databases(client);

client
  .setEndpoint('https://is.rams7729.org/v1')
  .setProject('gatekeeper')
  .setKey('f51649b62dad0aad83b304bf650fd67dab4c66ea411fff5496aa48808f01a48bebdb69b9b54677af7ed759874e508e37e6724b7289a98cd190259d19a684846d8b33ec175c9f22107560333886078b544229a1cae3e3ee4939f479c50f76902116b867ed02ff7c27d2c4d1c956d24e8783eedc0e10d9732f1fe8785b34daa1af');


function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }))
}

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

; (async () => {
  await app.whenReady()

  const mainWindow = createWindow('Gate Service', {
    width: 600,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }
})()

ipcMain.on("check_requests", async function (event, args) {
  getRequests(event)
})

ipcMain.on("getAuthUser", async function (event, args) {
  event.sender.send("authUser", authenticatedUser)
})

ipcMain.on("getAuthMode", async function (event, args) {
  event.sender.send("authMode", authMode)
})

ipcMain.on("setAuthMode", async function (event, args) {
  if (authenticatedUser.gate_role === "wildcard") {
    authMode = args
  }
})

ipcMain.on("unlock", async function (event, args) {
  if ((authenticatedUser.gate_role === "wildcard") || (authenticatedUser.gate_role == "leadership" && authMode === "authenticate") || authMode === "unlocked") {
    console.log("Unlocked");
    await databases.updateDocument("security_profiles", "auth_attempts", authenticatedUser.attempt_id, { unlocked: true, entertained: true });
    authenticatedUser = {}
  }
})

ipcMain.on("abort", async function (event, args) {
  await databases.updateDocument("security_profiles", "auth_attempts", authenticatedUser.attempt_id, { unlocked: false, entertained: true });
  authenticatedUser = {}
})

ipcMain.on("cancel_request", async function (event, args) {
  await databases.updateDocument("security_profiles", "match_requests", args.$id, { succeeded: false, entertained: true });
})

ipcMain.on("start_fingerprint_scan", async function (event, args) {
  let fingerprint_id = await askQuestion("Enter Fingerprint ID")
  let match_requests = await databases.listDocuments("security_profiles", "match_requests", [sdk.Query.equal("entertained", false)]);
  if (match_requests.total > 0) {
    await databases.createDocument("security_profiles", "fingerprints", sdk.ID.unique(), {
      label: match_requests.documents[0].label,
      user: match_requests.documents[0].user.member_id,
      fingerprint_id: fingerprint_id,
      match_request: match_requests.documents[0].$id
    })
    await databases.updateDocument("security_profiles", "match_requests", match_requests.documents[0].$id, { succeeded: true, entertained: true });
    let user = {
      request: true,
      first_name: match_requests.documents[0].user.first_name,
      last_name: match_requests.documents[0].user.last_name,
      member_id: match_requests.documents[0].user.member_id,
      position_name: match_requests.documents[0].user.position_name,
      label: match_requests.documents[0].label,
    }
    event.sender.send("fingerprint_scanned", user)
  } else {
    let fingerprint = await databases.listDocuments("security_profiles", "fingerprints", [sdk.Query.equal("fingerprint_id", fingerprint_id)]);
    if (fingerprint.total === 0) {
      event.sender.send("aborted", null)
    } else {
      let user = {
        request: false,
        first_name: fingerprint.documents[0].user.first_name,
        last_name: fingerprint.documents[0].user.last_name,
        member_id: fingerprint.documents[0].user.member_id,
        position_name: fingerprint.documents[0].user.position_name,
        label: fingerprint.documents[0].label,
        gate_role: fingerprint.documents[0].user.gate_role
      }
      let attempt = await databases.createDocument("security_profiles", "auth_attempts", sdk.ID.unique(), {
        user: user.member_id,
        fingerprint: fingerprint.documents[0].$id,
        entertained: false,
        unlocked: false
      })
      authenticatedUser = {
        attempt_id: attempt.$id,
        ...user
      }
      event.sender.send("fingerprint_scanned", user)
    }
  }

})

ipcMain.on("start_card_scan", async function (event, args) {
  let card_id = await askQuestion("Enter Card ID")
  let match_requests = await databases.listDocuments("security_profiles", "match_requests", [sdk.Query.equal("entertained", false)]);
  if (match_requests.total > 0) {
    await databases.createDocument("security_profiles", "cards", sdk.ID.unique(), {
      label: match_requests.documents[0].label,
      user: match_requests.documents[0].user.member_id,
      card_id: card_id,
      match_request: match_requests.documents[0].$id
    })
    await databases.updateDocument("security_profiles", "match_requests", match_requests.documents[0].$id, { succeeded: true, entertained: true });
    let user = {
      request: true,
      first_name: match_requests.documents[0].user.first_name,
      last_name: match_requests.documents[0].user.last_name,
      member_id: match_requests.documents[0].user.member_id,
      position_name: match_requests.documents[0].user.position_name,
      label: match_requests.documents[0].label,
    }
    event.sender.send("card_scanned", user)
  } else {
    let card = await databases.listDocuments("security_profiles", "cards", [sdk.Query.equal("card_id", card_id)]);
    if (card.total === 0) {
      event.sender.send("aborted", null)
    } else {
      let user = {
        request: false,
        first_name: card.documents[0].user.first_name,
        last_name: card.documents[0].user.last_name,
        member_id: card.documents[0].user.member_id,
        position_name: card.documents[0].user.position_name,
        label: card.documents[0].label,
        gate_role: card.documents[0].user.gate_role
      }
      let attempt = await databases.createDocument("security_profiles", "auth_attempts", sdk.ID.unique(), {
        user: user.member_id,
        card: card.documents[0].$id,
        entertained: false,
        unlocked: false
      })
      authenticatedUser = {
        attempt_id: attempt.$id,
        ...user
      }
      event.sender.send("card_scanned", user)
    }
  }

})


async function getRequests(event) {
  let match_requests = await databases.listDocuments("security_profiles", "match_requests", [sdk.Query.equal("entertained", false)]);
  if (match_requests.total > 0) {
    event.sender.send("match_request", match_requests.documents[0])
  }
}

app.on('window-all-closed', () => {
  app.quit()
})
