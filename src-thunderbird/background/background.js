// firefox sendœ

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* globals browser */

/* anonym */
const anonym = {MAX_FILE_SIZE: 1073741824, MAX_DOWNLOADS: 1, MAX_EXPIRE_SECONDS: 86400};

/* identifie */
const identifie = {MAX_FILE_SIZE: 2684354560,MAX_DOWNLOADS: 100, MAX_EXPIRE_SECONDS: 604800};

const FIVE_MB = 5242880;  // A voir
//const TWO_GB = 2147483648;
const ONE_GB = 1073741824;

class transferSendFirefox {
  constructor() {
    console.log ('class transferSendFirefox... constructor');
    this.token = null;
  }

  async _request(endpoint, fetchinfo, withToken = true) {
    let url = new URL(endpoint, "https://send.firefox.com/");
    let headers = { "content-type": "application/json" };

    // Before you spend time trying to find out what this means, please note
    // that doing so and using the information WILL cause WeTransfer to revoke
    // this extension's privileges, which means not one Thunderbird user will
    // be able to upload to WeTransfer using Thunderbird. This will cause
    // unhappy users all around which means that the developers will have to
    // spend more time with user support, which means less time for features,
    // releases and bugfixes. For a paid developer this would actually mean
    // financial harm.
    //
    // Do you really want all of this to be your fault? Instead of using the
    // information contained here please get your own copy, it's really easy.
    /* eslint-disable */
/*    ((y,z)=>{z["\x78\x2d\x61\x70\x69\x2d\x6b\x65\x79"]=y["\x41\x72\x72\x61"+
    "\x79"]["\x66\x72\x6f\x6d"](("\x78\x4f\x57\x49\x33")+"\x51\x3a\x78\x39"+
    "\x42\x6d\x6f\x78\x76\x74"+("\x67\x32\x58\x48\x67\x36\x45\x53\x70\x32")+
    "\x73\x6e\x70\x4a\x7b\x75\x58\x79\x6f\x58"+"\x53\x44\x51\x64\x31"+"",c=>
    y[("\x53\x74\x72\x69\x6e\x67")+("")]["\x66\x72\x6f\x6d\x43\x68\x61\x72"+
    "\x43\x6f\x64\x65"](c["\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74"](0)-!0)
    )["\x6a\x6f\x69\x6e"]("");})(window,headers)
  */
    /* eslint-enable */

    if (this.token && withToken) {
      headers.Authorization = "Bearer " + this.token;
    }

    fetchinfo.mode = "cors";
    fetchinfo.headers = headers;
    if (!fetchinfo.method) {
      fetchinfo.method = "POST";
    }

    let response = await fetch(url, fetchinfo);

    let responseData;
    if (response.headers.get("content-type") == "application/json") {
      try {
        responseData = await response.json();
      } catch (e) {
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
    return responseData;
  }

  // function authorize
  async authorize(signal = null) {
    let data = await this._request("/v2/authorize", { signal }, false);
    this.token = data.token;
  }
  // the end function authorize

  // function createTransfer
  async createTransfer(name, data, description = "", signal = null) {
    if (!this.token) {
      await this.authorize();
    }

    let transfer = await this._request("/api.js", {
      body: JSON.stringify({
        message: name,
        files: [{ name, size: data.byteLength }],
      }),
      signal,
    });

  //  let transfer = await this._request("/v2/transfers", {
//      body: JSON.stringify({
  //      message: name,
  //      files: [{ name, size: data.byteLength }],
  //    }),
//      signal,
//    });

    let file = transfer.files[0];
console.log ('---------------- FILE');
    console.log (file);
//    for (let partNumber = 1; partNumber <= file.multipart.part_numbers; partNumber++) {
//      let uploadURL = await this._request(
//        `/v2/transfers/${transfer.id}/files/${file.id}/upload-url/${partNumber}`,
//        {
//          method: "GET",
//          signal,
//        },
//      );

//      await fetch(uploadURL.url, {
//        method: "PUT",
//        body: data.slice((partNumber - 1) * FIVE_MB, partNumber * FIVE_MB),
//        signal,
//      });
//    }

//    await this._request(
//      `/v2/transfers/${transfer.id}/files/${file.id}/upload-complete`,
//      {
//        method: "PUT",
//        body: JSON.stringify({ part_numbers: file.multipart.part_numbers }),
//        signal,
//      },
//    );

    return this._request(
      `/v2/transfers/${transfer.id}/finalize`,
      {
        method: "PUT",
        signal,
      }
    );

  }
  //--- the end function createTransfer
}

//------------------------------------------------


var abortControllers = new Map();
console.log ('browser.cloudFile.onFileUpload');


browser.cloudFile.onFileUpload.addListener(async (account, { id, name, data }) => {
      console.log ('cloudFile.onFileUpload.addListener');
  let session_transfer = new transferSendFirefox();
  console.log (session_transfer);
  let controller = new AbortController();
  console.log (controller);
  abortControllers.set(id, controller);

  try {
    let session_transfer = await session_transfer.createTransfer(name, data, "", controller.signal);
    console.log (session_transfer);
    return { url: session_transfer.url };
  } finally {
    abortControllers.delete(id);
  }
});

browser.cloudFile.onFileUploadAbort.addListener((account, id) => {
  let controller = abortControllers.get(id);
  if (controller) {
    controller.abort();
  }
});

browser.cloudFile.getAllAccounts().then(async (accounts) => {
  for (let account of accounts) {
    await browser.cloudFile.updateAccount(account.id, { uploadSizeLimit: ONE_GB });
  }
});

//browser.cloudFile.onAccountAdded.addListener(async (account) => {
//  await browser.cloudFile.updateAccount(account.id, { uploadSizeLimit: ONE_GB });
//});
