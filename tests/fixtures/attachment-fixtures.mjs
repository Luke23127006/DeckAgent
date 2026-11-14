import { crc32, deflateRawSync, deflateSync } from 'node:zlib'

export function noisyAttachmentPng(side = 1024) {
  const scanlines = Buffer.alloc((side * 4 + 1) * side)
  let seed = 123456789
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const offset = y * (side * 4 + 1) + 1 + x * 4
    for (let channel = 0; channel < 3; channel++) {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
      scanlines[offset + channel] = seed & 255
    }
    scanlines[offset + 3] = 255
  }
  const chunk = (type, value) => {
    const label = Buffer.from(type)
    const header = Buffer.alloc(4); header.writeUInt32BE(value.length)
    const check = Buffer.alloc(4); check.writeUInt32BE(crc32(Buffer.concat([label, value])))
    return Buffer.concat([header, label, value, check])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(side, 0); header.writeUInt32BE(side, 4); header[8] = 8; header[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))])
}

/** Controlled ZIP fixtures with valid local/central metadata; never used by product code. */
export function attachmentZip(entries) {
  const locals = []
  const records = []
  let offset = 0
  for (const { name, bytes, attributes = 0 } of entries) {
    const filename = Buffer.from(name)
    const data = Buffer.from(bytes)
    const compressed = deflateRawSync(data)
    const checksum = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x800, 6)
    local.writeUInt16LE(8, 8)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(filename.length, 26)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(0x314, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x800, 8)
    central.writeUInt16LE(8, 10)
    central.writeUInt32LE(checksum, 16)
    central.writeUInt32LE(compressed.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(filename.length, 28)
    central.writeUInt32LE(attributes >>> 0, 38)
    central.writeUInt32LE(offset, 42)
    locals.push(local, filename, compressed)
    records.push(central, filename)
    offset += local.length + filename.length + compressed.length
  }
  const directory = Buffer.concat(records)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, directory, end])
}
