import { md5 } from '../utils/md5.js'

self.onmessage = async (e) => {
  const { blob } = e.data
  if (!blob) return

  try {
    const arrayBuffer = await blob.arrayBuffer()
    // Convert ArrayBuffer to string for the MD5 function (not optimal for huge files but works for this lib)
    // Actually the MD5 lib expects string. For binary data, we should adapt or find a binary-safe MD5.
    // The provided MD5 lib uses `rstr2binl` which processes string char codes.
    // Let's use a binary string conversion.
    const binary = Array.from(new Uint8Array(arrayBuffer))
      .map((b) => String.fromCharCode(b))
      .join('')
    
    const hash = md5(binary, null, false)
    self.postMessage({ hash })
  } catch (err) {
    console.error('MD5 Worker Error:', err)
    self.postMessage({ error: err.message })
  }
}
