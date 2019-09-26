// firefox send dev for thunderbird
//regarder fichier streams.md ~/wwwMozilla/send/docs/notes




/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var LIMITS = {
  "ANON": {
    "MAX_FILE_SIZE": 1073741824,
    "MAX_DOWNLOADS": 1,
    "MAX_EXPIRE_SECONDS": 86400
  },
  "MAX_FILE_SIZE": 2684354560,
  "MAX_DOWNLOADS": 100,
  "MAX_EXPIRE_SECONDS": 604800,
  "MAX_FILES_PER_ARCHIVE": 64,
  "MAX_ARCHIVES_PER_USER": 16
};
var DEFAULTS = {
  "DOWNLOAD_COUNTS": [1, 2, 3, 4, 5, 20, 50, 100],
  "EXPIRE_TIMES_SECONDS": [300, 3600, 86400, 604800],
  "EXPIRE_SECONDS": 86400
};
var PREFS = {};
var downloadMetadata = {};
var AUTH_CONFIG = {
  "authorization_endpoint": "https://accounts.firefox.com/authorization",
  "issuer": "https://accounts.firefox.com",
  "jwks_uri": "https://oauth.accounts.firefox.com/v1/jwks",
  "token_endpoint": "https://oauth.accounts.firefox.com/v1/token",
  "userinfo_endpoint": "https://profile.accounts.firefox.com/v1/profile",
  "claims_supported": ["aud", "exp", "iat", "iss", "sub"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "response_types_supported": ["code", "token"],
  "scopes_supported": ["openid", "profile", "email"],
  "subject_types_supported": ["public"],
  "token_endpoint_auth_methods_supported": ["client_secret_post"],
  "key_scope": "https://identity.mozilla.com/apps/send",
  "client_id": "1f30e32975ae5112"
};

var SENTRY_CONFIG = {
  dsn: 'https://19f0b72804bf4066a5cf854251a96de3@sentry.prod.mozaws.net/252',
  release: 'v3.0.18',
  beforeSend: function(data) {
    var hash = window.location.hash;
    if (hash) {
      return JSON.parse(JSON.stringify(data).replace(new RegExp(hash.slice(1), 'g'), ''));
    }
    return data;
  }
};


/*
var rand = function() {
    return Math.random().toString(36).substr(2); // remove `0.`
};

var TOKEN = function() {
    return rand() + rand(); // to make it longer
};
*/

/********************************************************************************************/
/********************************************************************************************/

class transferSendFirefox {

  constructor() {
    console.log('Etape01 : class transferSendFirefox... constructor');
    this.token = null;
  }

  async _request(endpoint, fetchinfo, withToken = true) {
    console.log("Etape07 : request");

    //    let url = new URL(endpoint, "https://api.send.firefox.com");
    //    let url = new URL(endpoint, "http://localhost:8080/");
    let url = new URL(endpoint, "https://send.firefox.com");
    let headers = {
      "content-type": "application/json"
    };

    // fetch info
    if (!fetchinfo.method) {
      fetchinfo.method = "POST";
    }
    fetchinfo.headers = headers;
    fetchinfo.auth_config = AUTH_CONFIG;

    console.log("fetchinfo:");
    console.log(fetchinfo);

    let response = await fetch(url, fetchinfo);
    console.log('----> response');
    console.log(response);

    let responseData;
    if (response.headers.get("content-type") == "application/json") {
      try {
        console.log('it s TRUE');
        responseData = await response.json();
      } catch (e) {
        console.log('err');
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        throw e;
      }

      if (responseData.success === false || responseData.error) {
        throw new Error(responseData.error);
      }
    } else {
      responseData = await response.text();
    }
    console.log('---> Return reponseData : ');
    console.log(responseData);
    return responseData;

  }


  async authorize(signal = null) {
    console.log('Etape05 : Async authorize - IDENTIFICATION - INIT');

    ///app.webmanifest
    // api/info
    let data = await this._request("/share", {
      signal
    }, false);

    ///api/metrics
    console.log(data);
    this.token = data.token;
    //  this.token = TOKEN;
    console.log("reponse token : ");
    console.log(token);

    console.log('Etape06 : Async authorize... END');

  }

  async createTransfer(name, data, description = "", signal = null) {
    console.log('Etape03: createTransfer');

    if (!this.token) {
      console.log('Etape03 B : Magic Authorize : TODO');
      //      await this.authorize();
    }

    console.log('Etape04 : suite4');

    let transfer = await this._request("/share", {
      body: JSON.stringify({
        message: name,
        files: [{
          name,
          size: data.byteLength
        }],
      }),
      signal,
    });

    console.log('Etape04 B : transfer PREPA');
    console.log(transfer);

    let file = transfer.files[0];
    console.log('---------------- FILE');
    console.log(file);
    console.log(file.multipart.part_numbers);
    for (let partNumber = 1; partNumber <= file.multipart.part_numbers; partNumber++) {
      console.log('-------->envoie fichier');
      console.log(this._request);

      let uploadURL = await this._request(
        `/share/${transfer.id}`, {
          method: "GET",
          signal,
        },
      );

      await fetch(uploadURL.url, {
        method: "PUT",
        body: data.slice((partNumber - 1) * LIMITS['ANON']['MAX_FILE_SIZE'], partNumber * LIMITS['ANON']['MAX_FILE_SIZE']),
        signal,
      });

    }

    await this._request(
      `/share/${transfer.id}`, {
        method: "PUT",
        body: JSON.stringify({
          part_numbers: file.multipart.part_numbers
        }),
        signal,
      },
    );

    return this._request(
      `/share/${transfer.id}`, {
        method: "PUT",
        signal,
      }
    );


  }

}

/********************************************************************************************/
/********************************************************************************************/
/********************************************************************************************/

var abortControllers = new Map();

//-------cloudFile onFileUpload---------------------------
browser.cloudFile.onFileUpload.addListener(async (account, {
  id,
  name,
  data
}) => {
  console.log('Etape 0:browser.cloudFile.onFileUpload');
  let session = new transferSendFirefox();
  let controller = new AbortController();
  abortControllers.set(id, controller);

  try {
    console.log("Etape02 : create transfer");
    console.log('id : ' + id + ' ///// name : ' + name);
    console.log(data);
    console.log(controller.signal);
    let transfer = await session.createTransfer(name, data, "", controller.signal);
    console.log('+++++ transfer');
    console.log(transfer);
    return {
      url: transfer.url
    };
  } finally {
    console.log('-----------------------------------');
    console.log('- ABORT Etape02 : create transfer -');
    console.log('-----------------------------------');
    abortControllers.delete(id);
  }
});

console.log('*************************');
console.log('Etape20:onFileUploadAbort');
console.log('*************************');
//--------cloudFile onFileUploadAbort-------------------------------
browser.cloudFile.onFileUploadAbort.addListener((account, id) => {
  let controller = abortControllers.get(id);
  console.log(controller);
  if (controller) {
    controller.abort();
  }
});


console.log('**********************');
console.log('Etape30:getAllAccounts');
console.log('**********************');
//-----------------------------------------------
browser.cloudFile.getAllAccounts().then(async (accounts) => {
  for (let account of accounts) {
    await browser.cloudFile.updateAccount(account.id, {
      configured: true,
      uploadSizeLimit: LIMITS['ANON']['MAX_FILE_SIZE'],
    });
  }
});

/*
console.log('**********************');
console.log('Etape40:onAccountAdded');
console.log('**********************');
browser.cloudFile.onAccountAdded.addListener(async (account) => {
  await browser.cloudFile.updateAccount(account.id, {
    configured: true,
    uploadSizeLimit: TWO_GB,
  });
});

*/
