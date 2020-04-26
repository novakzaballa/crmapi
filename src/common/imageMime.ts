var signatures = [{
    signature: "/9j/",
    mime: "image/jpeg",
    extension: ".jpg"
  },
  {
    signature: "R0lGOD",
    mime: "image/gif",
    extension: ".gif"
  },
  {
    signature: "iVBORw0KGgo",
    mime: "image/png",
    extension: ".png"
  }
];

export function detectMimeType(b64) {
  for (let i = 0; i < signatures.length; i++) {
    if (b64.slice(0,11).indexOf(signatures[i].signature) === 0) {
      return { mime: signatures[i].mime, extension: signatures[i].extension};
    }
  }
}
