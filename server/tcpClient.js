const net = require('net');

function createMovementRequest(direction) {
  // 16바이트 헤더 생성 및 JSON 데이터 직렬화
  const syncHeader = 0x5A;
  const version = 0x01;
  const serialNumber = Math.floor(Math.random() * 65536);
  const apiNumber = 2010; // Open Loop Motion
  const reserved = Buffer.alloc(6, 0x00);

  let vx = 0, vy = 0, w = 0;
  switch (direction) {
    case 'up':
      vx = 0.5;
      break;
    case 'down':
      vx = -0.5;
      break;
    case 'left':
      vx = -0.5; // 좌측 이동
      break;
    case 'right':
      vx = 0.5; // 우측 이동
      break;
    case 'rotate-left':
      w = 0.5; // 좌회전
      break;
    case 'rotate-right':
      w = -0.5; // 우회전
      break;
    default:
      break;
  }

  const data = JSON.stringify({ vx, vy, w });
  const dataLength = Buffer.byteLength(data);
  const buffer = Buffer.alloc(16 + dataLength);

  buffer.writeUInt8(syncHeader, 0);
  buffer.writeUInt8(version, 1);
  buffer.writeUInt16BE(serialNumber, 2);
  buffer.writeUInt32BE(dataLength, 4);
  buffer.writeUInt16BE(apiNumber, 8);
  reserved.copy(buffer, 10);
  buffer.write(data, 16);

  return buffer;
}

function sendTcpRequest(ipAddress, direction) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const PORT = 19205; // Robot Control API 포트

    client.connect(PORT, ipAddress, () => {
      const requestBuffer = createMovementRequest(direction);
      client.write(requestBuffer);
    });

    let responseBuffer = Buffer.alloc(0);

    client.on('data', (data) => {
      responseBuffer = Buffer.concat([responseBuffer, data]);

      if (responseBuffer.length >= 16) {
        const header = parseHeader(responseBuffer.slice(0, 16));
        const dataArea = responseBuffer.slice(16, 16 + header.dataLength);
        const jsonData = JSON.parse(dataArea.toString());
        resolve(jsonData);
        console.log(jsonData)
        client.destroy();
      }
    });

    client.on('error', (err) => {
      reject(`Connection error: ${err.message}`);
      client.destroy();
    });

    client.on('close', () => {
      console.log('Connection closed');
    });
  });
}

function parseHeader(buffer) {
  return {
    syncHeader: buffer.readUInt8(0),
    version: buffer.readUInt8(1),
    serialNumber: buffer.readUInt16BE(2),
    dataLength: buffer.readUInt32BE(4),
    apiNumber: buffer.readUInt16BE(8),
    reserved: buffer.slice(10, 16),
  };
}

module.exports = { sendTcpRequest };
