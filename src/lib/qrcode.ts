import QRCode from 'qrcode'

export async function generateQRCodeSVG(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#1A1A18',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  })
}

export async function generateQRCodePNG(url: string): Promise<Buffer> {
  const dataUrl = await QRCode.toDataURL(url, {
    type: 'image/png',
    margin: 2,
    width: 512,
    color: {
      dark: '#1A1A18',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  })
  // Strip data URL prefix and convert base64 to buffer
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  return Buffer.from(base64, 'base64')
}
