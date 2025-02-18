const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const { sendTcpRequest } = require("./tcpClient"); // TCP 요청 모듈 임포트
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const net = require("net"); // TCP 연결을 위한 모듈 추가
const moment = require("moment"); // 날짜 형식 변환을 위해 moment.js를 사용할 수 있습니다.
const session = require("express-session");
const EventEmitter = require("events");
const path = require("path");
const { red } = require("@mui/material/colors");
const { Manager } = require("socket.io-client");
const TaskManager = require("./taskmanager");

const robot_ip = "http://10.29.176.165:8000";
//const SAM_URL = "https://n108d.lignex1.com:4434/SAM/restapi/inf/acs/";
const SAM_URL = "http://10.29.143.175:8083/SAM/restapi/inf/acs/";

// 데이터베이스 파일 생성 및 테이블 초기화
const db = new sqlite3.Database("./logData.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    //console.log('Connected to the SQLite database.');

    // 테이블 생성 쿼리
    db.run(
      `
      CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT, -- 고유 ID
          timestamp TEXT NOT NULL,             -- 시간
          robot_id TEXT NOT NULL,              -- 로봇 ID
          status TEXT NOT NULL,                -- 상태 (정상, 경고, 에러)
          type CHAR(1) NOT NULL,               -- 유형 (T, W, E)
          message TEXT NOT NULL                -- 메시지
      )
    `,
      (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
        } else {
          //console.log('Logs table initialized.');
        }
      }
    );
  }
});
// Express app setup
const app = express();
let robots = {};
const taskManager = new TaskManager(db, robot_ip + "/SAM_IF004");

// Apply CORS middleware to Express app
app.use(express.json()); // JSON 파싱 미들웨어
app.set("trust proxy", true); // 프록시 신뢰 설정 추가

app.use(
  cors({
    origin: "*", // Replace with your React app's origin if needed
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Create HTTP server
const server = http.createServer(app);

// 세션 설정
app.use(
  session({
    secret: "your-secret-key", // 세션 암호화 키
    resave: false, // 매 요청마다 세션 저장 여부
    saveUninitialized: false, // 초기화되지 않은 세션 저장 여부
    cookie: {
      httpOnly: true, // 클라이언트에서 쿠키 접근 불가
      secure: false, // HTTPS에서만 동작 (개발 환경에서는 false)
      maxAge: 1000 * 60 * 60, // 세션 유지 시간 (1시간)
    },
  })
);
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // 간단한 사용자 인증 로직 (데모용)
  if (username === "admin" && password === "admin1234") {
    req.session.user = { username }; // 세션에 사용자 정보 저장
    return res.status(200).json({ message: "Login successful" });
  }

  res.status(401).json({ message: "Invalid credentials" });
});
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("connect.sid"); // 세션 쿠키 삭제
    res.status(200).json({ message: "Logged out successfully" });
  });
});
app.get("/api/auth-check", (req, res) => {
  if (req.session.user) {
    return res
      .status(200)
      .json({ isAuthenticated: true, user: req.session.user });
  }
  res.status(401).json({ isAuthenticated: false });
});
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Socket.IO setup with proper CORS configuration
const io = socketIo(server, {
  cors: {
    origin: "*", // Replace with your React app's origin if needed
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

// Handle Socket.IO connections
// Socket.IO 설정 및 로봇 데이터 관리
io.on("connection", (socket) => {
  //console.log('Client connected:', socket.id);
  let clientType = null;

  socket.on("ConnectRobot", (data) => {
    clientType = "robot";
    //console.log(socket.id);
    const robotNum = data.uid;
    const clientIpAddress = socket.handshake.address.replace(/^::ffff:/, "");
    //console.log("new", data.uid)
    // 중복 UID 방지 로직 추가
    const existingRobot = Object.values(robots).find(
      (robot) => robot.uid == robotNum
    );
    ////console.log('robots',Object.values(robots)[0]);
    if (existingRobot) {
      console.error(
        `Duplicate UID detected: ${robotNum}. Ignoring connection.`
      );
      socket.emit("connectionError", {
        message: `Robot with UID ${robotNum} already connected.`,
      });
      return;
    } else if (data.RobotInfo && data.RobotInfo.Position) {
      robots[0] = {
        ...data, // 로봇 전체 데이터 저장
        robotNum,
        CurrentIP: clientIpAddress,
      };

      //console.log(`Robot connected1: ${robotNum} with IP ${clientIpAddress}`);

      // 모든 로봇 정보를 배열로 emit
      io.emit("updateRobotInfo", Object.values(robots));
    } else {
      console.error(
        `Error: Position data missing for robot ${clientIpAddress}`
      );
    }
  });

  socket.on("SetRobotData", (data) => {
    const { RobotInfo } = data;
    const robotNum = data.uid;
    const existingRobot = Object.values(robots).find(
      (robot) => robot.uid == robotNum
    );
    //console.log(socket.id);
    if (RobotInfo && RobotInfo.Position) {
      robots[0] = {
        ...robots[socket.id],
        ...data, // 기존 로봇 정보 갱신
      };

      io.emit("updateRobotInfo", Object.values(robots));
    } else {
      console.error(
        `Error: Position data missing in SetRobotData for robot ${data.uid}`
      ); 
    }
  });

  socket.on("disconnect", () => {
    if (clientType === "robot") {
      delete robots[socket.id];
      io.emit("updateRobotInfo", Object.values(robots));
    }
  });
});

// Endpoint to get a list of connected robot IPs
app.get("/api/connected-robots", (req, res) => {
  const connectedRobots = Object.values(robots)
    .map((robots) => robots.RobotInfo.CurrentIP)
    .filter((ip, index, self) => ip && self.indexOf(ip) === index); // Filter out duplicates and empty values
  res.json(connectedRobots);
});

// Serve the Socket.IO client script
app.use(
  "/socket.io",
  express.static(__dirname + "/node_modules/socket.io/client-dist")
);

// Apply CORS headers to all responses
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Replace with your React app's origin if needed
  res.header("Access-Control-Allow-Methods", "GET, POST");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// 새로 추가한 HTTP 엔드포인트: 특정 방향으로 이동
app.post("/api/move", async (req, res) => {
  //console.log(req.body)
  const { ip, direction } = req.body;

  if (!ip || !direction) {
    return res.status(400).json({ error: "IP와 방향은 필수 입력 사항입니다." });
  }

  try {
    const response = await sendTcpRequest(ip, direction);
    res.json(response); // TCP 응답을 그대로 반환
  } catch (error) {
    res.status(500).json({ error: "TCP 요청 실패", details: error });
    //console.log(error)
  }
});

app.post("/api/lift", (req, res) => {
  const { action, ipAddress, height } = req.body;
  //console.log(req.body);

  if (!action || !["up", "down", "move", "stop"].includes(action)) {
    return res.status(400).json({
      error: 'Invalid action. Must be "up", "down", "move", or "stop".',
    });
  }

  if (!ipAddress) {
    return res.status(400).json({ error: "IP 주소가 필요합니다." });
  }

  const net = require("net");
  const client = new net.Socket();
  const PORT = 19210; // 리프트 제어 API 포트

  let requestBuffer;
  if (action === "up") {
    requestBuffer = createLiftUpRequest();
  } else if (action === "down") {
    requestBuffer = createLiftDownRequest();
  } else if (action === "move") {
    if (height === undefined) {
      return res
        .status(400)
        .json({ error: "Height is required for move action." });
    }
    requestBuffer = createMoveRequest(height);
  } else if (action === "stop") {
    requestBuffer = createStopRequest();
  }

  client.connect(PORT, ipAddress, () => {
    client.write(requestBuffer);
  });

  client.on("data", (data) => {
    // 응답을 로깅하고 클라이언트에 전달
    //console.log('Response from lift API:', data.toString());
    res.status(200).json({
      message: "Lift action performed successfully",
      response: data.toString(),
    });
    client.destroy(); // 연결 종료
  });

  client.on("error", (err) => {
    console.error("Error connecting to lift API:", err.message);
    res.status(500).json({ error: "Error performing lift action" });
    client.destroy();
  });
});

// 요청 생성 함수
function createLiftUpRequest() {
  return createLiftRequest(6070); // Jacking Load API 번호
}

function createLiftDownRequest() {
  return createLiftRequest(6071); // Jack Unload API 번호
}

function createMoveRequest(height) {
  const apiNumber = 0x17b9; // 6073 in hexadecimal

  const syncHeader = 0x5a;
  const version = 0x01;
  const serialNumber = Math.floor(Math.random() * 65536);
  const reserved = Buffer.alloc(6, 0x00);

  // JSON data area with height field
  const jsonData = JSON.stringify({ height: parseFloat(height) }); // height를 float으로 변환
  const dataLength = Buffer.byteLength(jsonData);

  const buffer = Buffer.alloc(16 + dataLength);
  buffer.writeUInt8(syncHeader, 0);
  buffer.writeUInt8(version, 1);
  buffer.writeUInt16BE(serialNumber, 2);
  buffer.writeUInt32BE(dataLength, 4);
  buffer.writeUInt16BE(apiNumber, 8);
  reserved.copy(buffer, 10);
  buffer.write(jsonData, 16);

  return buffer;
}

function createStopRequest() {
  return createLiftRequest(6061); // Stop API 번호
}

function createLiftRequest(apiNumber, data = {}) {
  const syncHeader = 0x5a;
  const version = 0x01;
  const serialNumber = Math.floor(Math.random() * 65536);
  const reserved = Buffer.alloc(6, 0x00);

  const jsonData = JSON.stringify(data);
  const dataLength = Buffer.byteLength(jsonData);

  const buffer = Buffer.alloc(16 + dataLength);
  buffer.writeUInt8(syncHeader, 0);
  buffer.writeUInt8(version, 1);
  buffer.writeUInt16BE(serialNumber, 2);
  buffer.writeUInt32BE(dataLength, 4);
  buffer.writeUInt16BE(apiNumber, 8);
  reserved.copy(buffer, 10);
  buffer.write(jsonData, 16);

  return buffer;
}

app.post("/SEND_TASK", (req, res) => {
  const { amr_ord_no } = req.body;
  if (!amr_ord_no) {
    return res.status(400).json({
      result: "failed",
      message: "need amr_ord_no",
    });
  }
  db.get(
    `SELECT * FROM sam_tasks WHERE amr_ord_no = ?`,
    [amr_ord_no],
    async (err, row) => {
      if (err) {
        console.error("DB Query Error", err.message);
        return res.status(500).json({
          result: "failed",
          message: "db select fail",
        });
      }
      if (!row) {
        return res.status(404).json({
          result: "failed",
          message: "no such task exists",
        });
      }
      try {
        const taskData = {
          amr_ord_no: String(row.amr_ord_no),
          amr_ord_dtm: String(row.amr_ord_dtm),
          amr_ord_ty: String(row.amr_ord_ty),
          amr_ord_pri: String(row.amr_ord_pri),
          loc_no_fr: String(row.loc_no_fr),
          loc_no_to: String(row.loc_no_to),
          wo_no: String(row.wo_no),
          item_code: String(row.item_code),
          serial_no: String(row.serial_no),
          tray_no: String(row.tray_no),
          amr_ord_flag: String(row.amr_ord_flag),
        };

        console.log(taskData);
        const response = await axios.post(`${robot_ip}/SAM_IF004`, taskData, {
          headers: { "Content-Type": "application/json" },
        });
        res.status(200).json({
          result: "success",
          data: response.data,
        });
      } catch (error) {
        console.error("robot communication Error", error.message);
        res.status(500).json({
          result: "failed",
          message: "amr is offline",
        });
      }
    }
  );
});

function saveLogToDatabase(robot_id, logData) {
  const timestamp = new Date().toISOString();
  db.run(
    `INSERT INTO logs (timestamp, robot_id, logData) VALUES (?, ?, ?)`,
    [timestamp, robot_id, logData],
    (err) => {
      if (err) {
        console.error("Error inserting log:", err.message);
      } else {
        console.log("Log saved to database.", timestamp);
      }
    }
  );
}

app.post("/api/save-log", (req, res) => {
  const {
    AMR_NO: robot_id,
    AMR_ORDER_TC_NUM: order_num,
    AMR_WORK_STATE: work_state,
    AMR_WORK_RESULT: work_result,
    AMR_ERROR_CODE: error_code,
  } = req.body;

  if (!robot_id || !order_num || !work_state) {
    return res.status(400).json({
      error: "robot_id, order_num, work_state는 필수 입력 사항입니다.",
    });
  }

  // 시간 생성
  const timestamp = new Date().toISOString();

  // 상태 결정
  const status = error_code?.startsWith("10000")
    ? "정상"
    : error_code?.startsWith("40000")
    ? "경고"
    : error_code?.startsWith("50000") || error_code?.startsWith("60000")
    ? "에러"
    : "알 수 없음";

  // 유형 결정
  const type = error_code?.startsWith("10000")
    ? "T" // Task
    : error_code?.startsWith("40000")
    ? "W" // Warning
    : error_code?.startsWith("50000") || error_code?.startsWith("60000")
    ? "E" // Error
    : "U"; // Unknown

  // 메시지 생성
  const message = `${order_num};${work_result ? "성공" : "실패"};${
    error_code || ""
  };`;

  // 데이터베이스 저장
  db.run(
    `INSERT INTO logs (timestamp, robot_id, status, type, message) VALUES (?, ?, ?, ?, ?)`,
    [timestamp, robot_id, status, type, message],
    (err) => {
      if (err) {
        console.error("Error inserting log:", err.message);
        return res.status(500).json({ error: "Failed to save log" });
      } else {
        // WebSocket으로 클라이언트에 새 로그 전송
        io.emit("newLog", { timestamp, robot_id, status, type, message });

        res.status(200).json({ message: "Log saved successfully" });
      }
    }
  );
});
app.get("/api/logs", (req, res) => {
  const query = `
    SELECT timestamp, 
           robot_id, 
           status, 
           type, 
           message 
    FROM logs 
    ORDER BY timestamp DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Database error:", err.message);
      return res
        .status(500)
        .json({ error: "Failed to fetch logs from database" });
    }
    res.status(200).json(rows);
  });
});

// 새로운 /api/monitoring 엔드포인트 추가
app.post("/api/monitoring", (req, res) => {
  const {
    AMR_ID,
    모니터링_상태_보내는_시간,
    AMR_상태,
    AMR_현재_위치_x,
    AMR_현재_위치_y,
    AMR_현재_각도_r,
    AMR_비상,
    AMR_배터리상태,
    AMR_배터리_잔량,
    센서_상태,
    에러코드,
    총운용시간,
    총리프트운용시간,
    일운용시간,
    일리프트운용시간,
    총_명령_수행_횟수,
    일_명령_수행_횟수,
    총이동거리,
    일이동거리,
  } = req.body;

  // DB에 로그 저장
  const logData = {
    모니터링_상태_보내는_시간,
    에러코드,
  };
  saveLogToDatabase(AMR_ID, JSON.stringify(logData));

  // 성공적으로 수신했음을 응답
  res.status(200).json({ message: "Monitoring data received successfully." });
});
// TaskList 배열을 초기화하여 데이터를 저장

app.post("/SAM/TASK_INFORM_MESSAGE", async (req, res) => {
  const {
    AMR_ORDER_TC_NUM,
    WORK_ORDER,
    PRODUCT_NO,
    SERIAL_NO,
    WMS_ORDER_SND_TIME,
    TRAY_NO,
    ORDER_LOC_FROM,
    ORDER_LOC_TO,
    Priority,
    CANCEL_YN,
  } = req.body;

  const createdAt = new Date().toISOString(); // ISO 8601 형식의 타임스탬프

  if (CANCEL_YN === "N") {
    const query = `
      INSERT INTO tasks (
        amr_order_tc_num, work_order, product_no, serial_no, tray_no,
        order_loc_from, order_loc_to, priority, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `;

    db.run(
      query,
      [
        AMR_ORDER_TC_NUM,
        WORK_ORDER,
        PRODUCT_NO,
        SERIAL_NO,
        TRAY_NO,
        ORDER_LOC_FROM,
        ORDER_LOC_TO,
        Priority,
        createdAt,
        createdAt,
      ],
      (err) => {
        if (err) {
          console.error("Error inserting task:", err.message);
          return res.status(500).json({ error: "Failed to add task" });
        }
        //console.log('Task added to database:', { AMR_ORDER_TC_NUM, createdAt });
        res.status(200).json({ message: "Task added successfully", createdAt });
      }
    );
  } else if (CANCEL_YN === "C") {
    console.log("cancling");
    const query = `DELETE FROM tasks WHERE amr_order_tc_num = ?`;

    db.run(query, [AMR_ORDER_TC_NUM], (err) => {
      if (err) {
        console.error("Error deleting task:", err.message);
        return res.status(500).json({ error: "Failed to delete task" });
      }
      //console.log(`Task with AMR_ORDER_TC_NUM ${AMR_ORDER_TC_NUM} deleted from database.`);
      res.status(200).json({ message: "Task deleted successfully" });
    });
  } else {
    res.status(400).json({ error: 'Invalid CANCEL_YN value. Use "Y" or "N".' });
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sam_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amr_ord_no TEXT UNIQUE,
      amr_ord_dtm TEXT,
      amr_ord_ty TEXT,
      amr_ord_pri TEXT,
      loc_no_fr TEXT,
      loc_no_to TEXT,
      wo_no TEXT,
      item_code TEXT,
      serial_no TEXT,
      tray_no TEXT,
      amr_ord_flag TEXT,
      status TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);
});

app.post("/SAM_IF004", async (req, res) => {
  const { p_param } = req.body;

  const { amr_ord_flag, amr_ord_no } = p_param;
  console.log('handling 004')
  console.log(p_param)
  if (amr_ord_flag === "N") {
    db.run(
      `INSERT INTO sam_tasks (
        amr_ord_no, amr_ord_dtm, amr_ord_ty, amr_ord_pri, loc_no_fr, loc_no_to, wo_no, item_code, serial_no, tray_no, amr_ord_flag, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p_param.amr_ord_no,
        p_param.amr_ord_dtm,
        p_param.amr_ord_ty,
        p_param.amr_ord_pri,
        p_param.loc_no_fr,
        p_param.loc_no_to,
        p_param.wo_no,
        p_param.item_code,
        p_param.serial_no,
        p_param.tray_no,
        p_param.amr_ord_flag,
        "pending",
      ],
      (err) => {
        if (err) {
          console.error("DB Insert Error:", err.message);
          return res.status(400).json({
            result: { return_msg: "Failed to Insert Data: " + err.message },
            data: [p_param.amr_ord_no],
          });
        }
        return res.status(200).json({
          result: { return_msg: "S" },
          data: [p_param.amr_ord_no],
        });
      }
    );
  } else if (amr_ord_flag === "C") {
    //TC ORDER TO AMR
    const query = `
      SELECT EXISTS (SELECT 1 FROM sam_tasks WHERE amr_ord_no = ? AND status = 'in_progress') AS isInProgress
    `;
    db.get(query, amr_ord_no, (err, row) => {
      if (err) {
        console.error('Error in query');
      }else{
        if(row.isInProgress === 1){
          TC_ORDER = {amr_no: "IM-01",
            amr_work_dtm: new Date().toISOString().replace(/[-:T]/g,'').slice(0, 14),
            amr_work_control : "TC",
            user_id: "ACSSY"}
          const robotEndpoint = `${robot_ip}/SAM_IF007`;
          axios.post(robotEndpoint, TC_ORDER);
          const query = `
          SELECT message FROM logs ORDER BY id DESC LIMIT 1
          `
          db.get(query, (err,row) =>{
            if (row  && (row.message.includes('LIFT START') || row.message.includes('IM-01-01-01'))){
              API_SAM_IF005(
                amr_ord_no,
                "IM-01",
                "S",
                new Date().toISOString().replace(/[-:T]/g,'').slice(0, 14),
                "FALSE"
              );
              taskManager.updateTaskStatus(amr_ord_no, 'canceled')
            }else{
              API_SAM_IF005(
                amr_ord_no,
                "IM-01",
                "M",
                new Date().toISOString().replace(/[-:T]/g,'').slice(0, 14),
                "FALSE"
              );
              db.run(
                `DELETE FROM sam_tasks WHERE amr_ord_no = ?`,
                [amr_ord_no],
                (err) => {
                  if (err) {
                    console.error("DB DELETE ERROR:", err.message);
                    return res.status(500).json({
                      result: { return_msg: "Failed to Delete Data" },
                      data: [amr_ord_no],
                    });
                  }
                  return res.status(200).json({
                    result: { return_msg: "S" },
                    data: [amr_ord_no],
                  });
                }
              );
            }
          })
        }else{
          // db.run(
          //   `DELETE FROM sam_tasks WHERE amr_ord_no = ?`,
          //   [amr_ord_no],
          //   (err) => {
          //     if (err) {
          //       console.error("DB DELETE ERROR:", err.message);
          //       return res.status(500).json({
          //         result: { return_msg: "Failed to Delete Data" },
          //         data: [amr_ord_no],
          //       });
          //     }
          //     return res.status(200).json({
          //       result: { return_msg: "S" },
          //       data: [amr_ord_no],
          //     });
          //   }
          // );
          return res.status(404).json({
            result: {return_msg: "can't delete pending task in ACS"},
            data: [amr_ord_no],
          })
        }
      }
    })
    
    

  }
});

app.get("/SAM_IF004/TASKS", (req, res) => {
  db.all(
    `SELECT 
      amr_ord_no, 
      status, 
      amr_ord_pri, 
      loc_no_fr, 
      loc_no_to, 
      amr_ord_dtm, 
      amr_ord_ty, 
      wo_no, 
      item_code, 
      serial_no, 
      tray_no 
    FROM sam_tasks`,
    (err, rows) => {
      if (err) {
        console.error("DB Query Error:", err.message);
        return res.status(500).json({
          result: "DB no response",
          data: null,
        });
      }
      res.status(200).json({
        rows,
      });
    }
  );
});

app.post("/SAM_IF006", async (req, res) => {
  console.log('IF006 requested:', req.body)
  const p_param = req.body;
  if (!p_param) {
    return res.status(400).json({
      result: { return_msg: "Invalid request : Missing p_param" },
      data: [],
    });
  }
  const payload = {
    p_param,
  };
  try {
    const samResponse = await axios.post(SAM_URL + '/SAM_IF006', payload);
    if (samResponse.data) {
      return res.status(200).json({
        result: { return_msg: "S" },
        data: samResponse.data,
      });
    } else {
      return res.status(500).json({
        result: { return_msg: "Failed to retrieve data from robot" },
        data: [],
      });
    }
  } catch (error) {
    console.error("Error communicating with robot:", error.message);
    return res.status(500).json({
      result: { return_msg: "Failed to connect AMR" },
      data: [],
    });
  }
});
// POST Endpoint: /SAM_IF007
app.post("/SAM_IF007", async (req, res) => {
  try {
    const { p_if_id, p_param } = req.body;

    // 요청 데이터 검증
    if (p_if_id !== "SAM_IF007" || !p_param) {
      return res.status(400).json({
        result: { return_msg: "Invalid Request Data" },
        data: [],
      });
    }
    console.log(p_param)
    // 로봇에 데이터 전달
    const robotEndpoint = `${robot_ip}/SAM_IF007`;
    const response = await axios.post(robotEndpoint, p_param );
    

    // 로봇으로부터 응답 처리
    if (response.data) {
      return res.json({
        result: { return_msg: "S" },
        data: response.data.data || [],
      });
    } else {
      return res.json({
        result: { return_msg: "AMR 제어 정보 연결에 실패했습니다." },
        data: [],
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      result: { return_msg: "AMR 제어 정보 연결에 실패했습니다." },
      data: [],
    });
  }
});

// 공통 엔드포인트: /SAM_IF
app.post("/SAM_IF", async (req, res) => {
  const { p_if_id, p_param } = req.body;
  console.log(p_if_id, p_param)
  try {
    if (!p_if_id || !p_param) {
      return res.status(400).json({
        result: { return_msg: "Invalid Request Data" },
        data: [],
      });
    }

    // p_if_id에 따라 로직 분기
    if (p_if_id === "SAM_IF004") {
      // SAM_IF004 처리
      const { amr_ord_flag, amr_ord_no } = p_param;
      console.log('handling 004')
  console.log(p_param)
      if (amr_ord_flag === "N") {
        db.run(
          `INSERT INTO sam_tasks (
            amr_ord_no, amr_ord_dtm, amr_ord_ty, amr_ord_pri, loc_no_fr, loc_no_to, wo_no, item_code, serial_no, tray_no, amr_ord_flag, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p_param.amr_ord_no,
            p_param.amr_ord_dtm,
            p_param.amr_ord_ty,
            p_param.amr_ord_pri,
            p_param.loc_no_fr,
            p_param.loc_no_to,
            p_param.wo_no,
            p_param.item_code,
            p_param.serial_no,
            p_param.tray_no,
            p_param.amr_ord_flag,
            "pending",
          ],
          (err) => {
            if (err) {
              console.error("DB Insert Error:", err.message);
              return res.status(400).json({
                result: { return_msg: "Failed to Insert Data: " + err.message },
                data: {amr_ord_no: p_param.amr_ord_no},
              });
            }
            return res.status(200).json({
              result: { return_msg: "S" },
              data: {amr_ord_no: p_param.amr_ord_no},
            });
          }
        );
      } else if (amr_ord_flag === "C") {
        db.run(
          `DELETE FROM sam_tasks WHERE amr_ord_no = ?`,
          [amr_ord_no],
          (err) => {
            if (err) {
              console.error("DB DELETE ERROR:", err.message);
              return res.status(500).json({
                result: { return_msg: "Failed to Delete Data" },
                data: {amr_ord_no: p_param.amr_ord_no},
              });
            }
            return res.status(200).json({
              result: { return_msg: "S" },
              data: {amr_ord_no: p_param.amr_ord_no},
            });
          }
        );
      }
    } else if (p_if_id === "SAM_IF007") {
      // SAM_IF007 처리
      const robotEndpoint = `${robot_ip}/SAM_IF007`;
      console.log('handling 007')
      try {
        console.log(p_param)
        const response = await axios.post(robotEndpoint, p_param);
        if (response.data) {
          return res.status(200).json({
            result: { return_msg: "S" },
            data: response.data.data || [],
          });
        } else {
          return res.status(500).json({
            result: { return_msg: "AMR 제어 정보 연결에 실패했습니다." },
            data: [],
          });
        }
      } catch (robotError) {
        console.error("Error communicating with robot:", robotError.message);
        return res.status(500).json({
          result: { return_msg: "AMR 제어 정보 연결에 실패했습니다." },
          data: [],
        });
      }
    } else {
      // 잘못된 p_if_id 처리
      return res.status(400).json({
        result: { return_msg: "Unsupported p_if_id" },
        data: [],
      });
    }
  } catch (error) {
    console.error("Server Error:", error.message);
    return res.status(500).json({
      result: { return_msg: "Internal Server Error" },
      data: [],
    });
  }
});

app.post("/STEP_INFORM_MESSAGE", (req, res) => {
  const { RCV_DTM, AMR_NO, AMR_ORDER_TC_NUM, CANCEL_YN, AMR_WORK_STATE } =
    req.body;
  res
    .status(200)
    .json({ message: "STEP_INFORM_MESSAGE data received successfully." });
});

app.post("/FULL_INFORM_MESSAGE", (req, res) => {
  const { RCV_DTM, AMR_ORDER_TC_NUM, CANCEL_YN } = req.body;
  res
    .status(200)
    .json({ message: "FULL_INFORM_MESSAGE data received successfully." });
});
app.post("/AMR_STATUS_MESSAGE", (req, res) => {
  const { RCV_DTM, AMR_NO, AMR_TIME } = req.body;
  res
    .status(200)
    .json({ message: "AMR_STATUS_MESSAGE data received successfully." });
});
// TCP 요청 함수 정의

async function getMapList(ipAddress) {
  const client = new net.Socket();
  const PORT = 19204; // 로봇 TCP 포트 번호 설정
  const requestBuffer = Buffer.from([
    0x5a, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x05, 0x14, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]); // 요청 메시지

  return new Promise((resolve, reject) => {
    client.connect(PORT, ipAddress, () => {
      client.write(requestBuffer);
    });

    let responseBuffer = Buffer.alloc(0); // 응답 데이터를 저장할 버퍼

    client.on("data", (data) => {
      responseBuffer = Buffer.concat([responseBuffer, data]); // 수신된 데이터를 버퍼에 추가

      // 최소한 헤더 크기(16바이트) 이상의 데이터가 수신된 경우 헤더를 파싱
      if (responseBuffer.length >= 16) {
        const header = parseHeader(responseBuffer.slice(0, 16)); // 헤더 파싱
        const expectedDataLength = 16 + header.dataLength;

        // 모든 데이터가 수신되었는지 확인
        if (responseBuffer.length >= expectedDataLength) {
          const dataArea = responseBuffer.slice(16, expectedDataLength); // 데이터 영역 추출
          try {
            const jsonData = JSON.parse(dataArea.toString());
            resolve(jsonData);
          } catch (error) {
            reject("Failed to parse JSON data");
          } finally {
            client.destroy(); // 연결 종료
          }
        }
      }
    });

    client.on("error", (err) => {
      reject(`Connection error: ${err.message}`);
      client.destroy();
    });

    client.on("close", () => {
      //console.log('Connection closed');
    });
  });
}

// 헤더 파싱 함수
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

app.post("/api/get-map-list", async (req, res) => {
  //console.log(req.body);
  const { ip } = req.body;
  //console.log("mapip",ip)
  if (!ip) {
    return res.status(400).json({ error: "IP 주소는 필수 입력 사항입니다." });
  }

  try {
    const mapListResponse = await getMapList(ip);
    res.json(mapListResponse); // TCP 응답을 JSON 형식으로 반환
    //console.log(mapListResponse)
  } catch (error) {
    res.status(500).json({ error: "Failed to get map list", details: error });
  }
});

function downloadMap(ip, mapName) {
  const PORT = 19207; // 로봇 TCP 포트 번호
  const requestBody = JSON.stringify({ map_name: mapName });
  const requestBodyBuffer = Buffer.from(requestBody);
  const dataLength = requestBodyBuffer.length;

  // 헤더 버퍼 생성
  const headerBuffer = Buffer.alloc(16); // 16바이트 헤더

  // 헤더 필드 작성
  headerBuffer.writeUInt8(0x5a, 0); // syncHeader
  headerBuffer.writeUInt8(0x01, 1); // version
  headerBuffer.writeUInt16BE(0x0000, 2); // serialNumber
  headerBuffer.writeUInt32BE(dataLength, 4); // dataLength
  headerBuffer.writeUInt16BE(0x0fab, 8); // apiNumber
  // reserved 필드는 이미 0으로 초기화되어 있음

  // 전체 메시지 생성
  const message = Buffer.concat([headerBuffer, requestBodyBuffer]);

  //console.log("message:", message);

  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let responseBuffer = Buffer.alloc(0); // 수신된 데이터를 저장할 버퍼

    client.connect(PORT, ip, () => {
      //console.log(`Connected to robot at ${ip}`);
      client.write(message); // 요청 데이터 전송
    });

    client.on("data", (data) => {
      responseBuffer = Buffer.concat([responseBuffer, data]); // 데이터 추가

      // 최소 응답 헤더 크기(16바이트) 확인
      if (responseBuffer.length >= 16) {
        const header = parseHeader_file(responseBuffer.slice(0, 16)); // 헤더 파싱
        const expectedLength = 16 + header.dataLength; // 예상 응답 길이 계산

        // 데이터가 충분히 수신되었는지 확인
        if (responseBuffer.length >= expectedLength) {
          const dataArea = responseBuffer.slice(16, expectedLength); // 데이터 영역 추출
          try {
            const jsonData = JSON.parse(dataArea.toString()); // JSON 데이터 파싱
            resolve(jsonData); // 성공적으로 응답 처리
          } catch (error) {
            reject(`Failed to parse response JSON: ${error.message}`);
          } finally {
            client.destroy(); // 소켓 연결 종료
          }
        }
      }
    });

    client.on("error", (err) => {
      console.error(`TCP communication error: ${err.message}`);
      reject(`TCP error: ${err.message}`); // 에러 메시지 전달
      client.destroy(); // 소켓 연결 종료
    });

    client.on("close", () => {
      //console.log('Connection closed'); // 연결 종료 로그
    });

    client.on("timeout", () => {
      console.error("TCP request timed out"); // 타임아웃 처리
      reject("TCP request timed out");
      client.destroy();
    });
  });
}

// 헤더 파싱 함수
function parseHeader_file(buffer) {
  return {
    syncHeader: buffer.readUInt8(0), // Sync Header
    version: buffer.readUInt8(1), // Protocol Version
    serialNumber: buffer.readUInt16BE(2), // Serial Number
    dataLength: buffer.readUInt32BE(4), // 데이터 길이
    apiNumber: buffer.readUInt16BE(8), // API 번호
    reserved: buffer.slice(10, 16), // 예약 필드
  };
}

// API 엔드포인트 정의
// 기존의 downloadMap 함수에서 user_objects 정보를 포함하도록 수정합니다.
app.post("/api/get-map-file", async (req, res) => {
  const { ip, mapName } = req.body;
  //console.log("mapfile-------", ip, mapName);
  if (!ip || !mapName) {
    return res
      .status(400)
      .json({ error: "IP 주소와 맵 이름은 필수 입력 사항입니다." });
  }

  try {
    // 맵 데이터 가져오기
    const mapData = await downloadMap(ip, mapName);
    res.json({
      mapData,
    });
  } catch (error) {
    console.error("Failed to download map:", error);
    res.status(500).json({ error: "Failed to download map", details: error });
  }
});
let latestRobotData = null; // 수신된 로봇 데이터를 저장할 변수

// API 엔드포인트 정의
app.post("/api/robot-data", async (req, res) => {
  const { robotIP } = req.body;

  if (!robotIP) {
    return res.status(400).json({ error: "Robot IP is required" });
  }

  try {
    const data = await fetchRobotData(robotIP);
    res.json(data);
  } catch (error) {
    console.error("Error fetching robot data:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch robot data", details: error.message });
  }
});

function fetchRobotData(robotIP) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let responseBuffer = Buffer.alloc(0);

    client.connect(19301, robotIP, () => {
      //console.log(`robotpush, Connected to robot at ${robotIP}`);
    });

    client.on("data", (data) => {
      responseBuffer = Buffer.concat([responseBuffer, data]);

      // 최소 응답 헤더 크기(16바이트) 확인
      while (responseBuffer.length >= 16) {
        const header = parseHeader(responseBuffer.slice(0, 16));
        const expectedLength = 16 + header.dataLength;

        if (responseBuffer.length >= expectedLength) {
          const packet = responseBuffer.slice(0, expectedLength);
          responseBuffer = responseBuffer.slice(expectedLength); // 처리한 패킷 제거

          const dataArea = packet.slice(16); // 데이터 영역 추출
          try {
            const jsonData = JSON.parse(dataArea.toString());
            // user_objects 정보가 있으면 반환
            if (jsonData.user_objects) {
              //console.log('User Objects (Obstacles):', jsonData.user_objects);
            }
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          } finally {
            client.destroy(); // 연결 종료
            //console.log('Connection destroyed after receiving data.');
          }
        } else {
          // 전체 패킷이 아직 수신되지 않음
          break;
        }
      }
    });

    client.on("close", () => {
      //console.log('Connection to robot closed');
    });

    client.on("error", (err) => {
      console.error(`TCP communication error: ${err.message}`);
      reject(err);
      client.destroy(); // 에러 발생 시 연결 종료
    });

    client.on("timeout", () => {
      console.error("TCP request timed out");
      reject(new Error("TCP request timed out"));
      client.destroy(); // 타임아웃 발생 시 연결 종료
    });
  });
}

// 헤더 파싱 함수
function parseHeader_file(buffer) {
  return {
    syncHeader: buffer.readUInt8(0), // Sync Header
    version: buffer.readUInt8(1), // Protocol Version
    serialNumber: buffer.readUInt16BE(2), // Serial Number
    dataLength: buffer.readUInt32BE(4), // 데이터 길이
    apiNumber: buffer.readUInt16BE(8), // API 번호
    reserved: buffer.slice(10, 16), // 예약 필드
  };
}

// Test 용 가짜 데이터 반환 API 엔드포인트
app.post("/api/get-map-list-mock", (req, res) => {
  const mockResponse = {
    create_on: "2024-02-01T13:45:25.905+0800",
    current_map: "CDD14-2",
    current_map_md5: "164e4c8a36448afa2250bc2fd2da041f",
    map_files_info: [
      { modified: "2023-10-17 14:01:53", name: "CDD14-2.smap", size: 4830450 },
      {
        modified: "2023-03-09 14:53:38",
        name: "Hairou_L0910wms_1_1.smap",
        size: 283894,
      },
      {
        modified: "2022-11-08 15:14:12",
        name: "bk_default_202208101736_1.smap.smap",
        size: 29236927,
      },
      { modified: "2023-10-13 15:54:59", name: "default.smap", size: 16972 },
      {
        modified: "2022-09-22 17:31:56",
        name: "default.test.1.2.6.smap",
        size: 542650,
      },
      { modified: "2022-08-09 17:13:58", name: "festo.smap", size: 30399837 },
      { modified: "2022-07-15 11:53:10", name: "festo_2.smap", size: 30399812 },
      { modified: "2022-09-09 16:24:53", name: "test_1.smap", size: 6318814 },
    ],
    maps: [
      "CDD14-2",
      "Hairou_L0910wms_1_1",
      "bk_default_202208101736_1.smap",
      "default",
      "default.test.1.2.6",
      "festo",
      "festo_2",
      "test_1",
    ],
    ret_code: 0,
  };

  res.json(mockResponse);
});

app.post("/proxy/amr-get-message", async (req, res) => {
  const { ip } = req.body;
  console.log("got amr-get-message");
  if (!ip) {
    return res.status(400).json({ error: "IP 주소가 필요합니다." });
  }

  try {
    // 쿼리 파라미터로 amr_id 추가
    const response = await axios.get(`${robot_ip}/AMR_GET_MESSAGE`, {
      params: {
        amr_id: "test", // amr_id를 쿼리로 전달
      },
    });
    console.log(response.data);

    // 로봇의 응답 전달
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching AMR settings:", error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || "Failed to fetch AMR settings.",
    });
  }
});
app.post("/proxy/amr-set-message", async (req, res) => {
  const {
    ip,
    idleSpeed,
    transportSpeed,
    liftHeight1,
    liftHeight2,
    liftHeight3,
  } = req.body;

  if (!ip) {
    return res.status(400).json({ error: "IP 주소가 필요합니다." });
  }

  try {
    // AMR로 전송할 데이터 준비
    const payload = {
      AMR_NO: "test", // AMR ID는 고정값으로 전달
      AMR_SET: "AMR SETTING",
      AMR_SPD_EMPTY: idleSpeed.toString(),
      AMR_SPD_LOAD: transportSpeed.toString(),
      AMR_LIFT_TABLE: liftHeight1.toString(),
      AMR_LIFT_1STEP: liftHeight1.toString(),
      AMR_LIFT_2STEP: liftHeight2.toString(),
      AMR_LIFT_3STEP: liftHeight3.toString(),
    };

    //console.log(`Sending data to AMR ${ip}:`, payload);

    // 로봇 IP로 POST 요청 전달
    const response = await axios.post(`${robot_ip}/AMR_SET_MESSAGE`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    //console.log(`Response from AMR ${ip}:`, response.data);

    // 클라이언트로 AMR의 응답 전달
    res.json(response.data);
  } catch (error) {
    console.error("Error setting AMR settings:", error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || "Failed to set AMR settings.",
    });
  }
});

app.get("/api/tasks", (req, res) => {
  const { status } = req.query;

  taskManager.getTasks(status, (err, rows) => {
    if (err) {
      console.error("Error fetching tasks:", err.message);
      return res.status(500).json({ error: "Failed to fetch tasks" });
    }
    res.status(200).json(rows);
  });
});
app.post("/TASK_PROCESS_MESSAGE", (req, res) => {
  const {
    AMR_NO,
    AMR_ORDER_TC_NUM,
    AMR_WORK_STATE,
    AMR_MOVE_DATE,
    LIFT_WORK_START_DATE,
    LIFT_WORK_END_DATE,

    AMR_WORK_RESULT,
    AMR_ERROR_CODE,
    AMR_MOVE_FROM,
    AMR_MOVE_TO,
  } = req.body;
  console.log(req.body);
  //AMR_ORD_NO -> im-01
  //AMR_OPER_DTM doesn't exist
  //

  if (!AMR_NO || !AMR_ORDER_TC_NUM || !AMR_WORK_STATE) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let status = "알 수 없음";
  let type = "U";
  let message = `${AMR_ORDER_TC_NUM};${AMR_WORK_RESULT ? "성공" : "실패"};`;
  const updatedAt = new Date().toISOString().replace(/[-:T]/g,'').slice(0, 14);
  if (AMR_WORK_RESULT == 'FALSE'){
    const query = `DELETE FROM sam_tasks WHERE amr_ord_no = ?`;
      
    switch(AMR_WORK_STATE){
    case "MOVE START":
      API_SAM_IF005(
        AMR_ORDER_TC_NUM,
        AMR_NO,
        "M",
        AMR_MOVE_DATE,
        "FALSE"
      );
      if(AMR_MOVE_FROM != 'IM-01-01-01'){
        db.run(query, [AMR_ORDER_TC_NUM], (err) => {
          if (err) {
            console.error("Error deleting task:", err.message);
          }
          //console.log(`Task with AMR_ORDER_TC_NUM ${AMR_ORDER_TC_NUM} deleted from database.`);
          console.log('task deleted'+AMR_ORDER_TC_NUM)
          
        });
      }else{
        taskManager.updateTaskStatus(AMR_ORDER_TC_NUM, 'canceled')
      }
      
      break;
    case "LIFT START":
      API_SAM_IF005(
        AMR_ORDER_TC_NUM,
        AMR_NO,
        "S",
        LIFT_WORK_START_DATE,
        "FALSE"
      );
      taskManager.updateTaskStatus(AMR_ORDER_TC_NUM, 'canceled')
      break;

    case "LIFT END":
      API_SAM_IF005(
        AMR_ORDER_TC_NUM,
        AMR_NO,
        "E",
        LIFT_WORK_END_DATE,
        "FALSE"
      );
      db.run(query, [AMR_ORDER_TC_NUM], (err) => {
        if (err) {
          console.error("Error deleting task:", err.message);
        }
        //console.log(`Task with AMR_ORDER_TC_NUM ${AMR_ORDER_TC_NUM} deleted from database.`);
        console.log('task deleted'+AMR_ORDER_TC_NUM)
        
      });
      break;
    }
  }
  else{
  switch (AMR_WORK_STATE) {

    case "MOVE START":
      API_SAM_IF005(
        AMR_ORDER_TC_NUM,
        AMR_NO,
        "M",
        AMR_MOVE_DATE,
        "TRUE"
      );
      break;
    case "LIFT START":
      API_SAM_IF005(
        AMR_ORDER_TC_NUM,
        AMR_NO,
        "S",
        LIFT_WORK_START_DATE,
        "TRUE"

      );
      break;

    case "LIFT END":
      API_SAM_IF005(
        AMR_ORDER_TC_NUM,
        AMR_NO,
        "E",
        LIFT_WORK_END_DATE,
        "TRUE"
      );
      break;

    case "STOP":
      break;

    case "ESTOP":
      break;
    case "TASK END":
      console.log("taskended--------------------")
      const query = `DELETE FROM sam_tasks WHERE amr_ord_no = ?`;
      db.run(query, [AMR_ORDER_TC_NUM], (err) => {
        if (err) {
          console.error("Error deleting task:", err.message);
        }
        //console.log(`Task with AMR_ORDER_TC_NUM ${AMR_ORDER_TC_NUM} deleted from database.`);
        console.log('task deleted'+AMR_ORDER_TC_NUM)
        
      });
      break;
    default:
      return res.status(400).json({ error: "Invalid AMR_WORK_STATE" });
  }}

  if (AMR_ERROR_CODE) {
    const errorCodeStr = String(AMR_ERROR_CODE);
    if (errorCodeStr.startsWith("1")) {
      status = "정상";
      type = "T";
    } else if (errorCodeStr.startsWith("4")) {
      status = "경고";
      type = "W";
    } else if (errorCodeStr.startsWith("5") || errorCodeStr.startsWith("6")) {
      status = "에러";
      type = "E";
    }
    message += `${AMR_ERROR_CODE};`;
  }

  if (AMR_MOVE_FROM || AMR_MOVE_TO) {
    message += `From: ${AMR_MOVE_FROM || "Unknown"} To: ${
      AMR_MOVE_TO || "Unknown"
    }`;
  }

  const timeStamp = new Date();
  message += AMR_WORK_STATE;

  const query = `
    INSERT INTO logs (timestamp, robot_id, status, type, message)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [timeStamp, AMR_NO, status, type, message];

  db.run(query, values, function (err) {
    if (err) {
      console.error("Database error:", err.message);
      return res
        .status(500)
        .json({ error: "Failed to save log to the database" });
    }

    res.status(200).json({
      message: "Task processed and log saved successfully",
      data: { timeStamp, robotId: AMR_NO, status, type, message },
    });
  });
});

//1206 ADDED. function for ACS(TASK_INFORM_MESSAGE) -> translate -> SAM
async function API_SAM_IF005(
  amr_ord_no,
  amr_no,
  amr_oper_step,
  amr_oper_dtm,
  amr_oper_result
) {
  try {
    const requestData = {
      p_if_id: "SAM_IF005",
      p_param: {
        amr_ord_no,
        amr_no,
        amr_oper_step,
        amr_oper_dtm,
        amr_oper_result,
      },
    };
    console.log(requestData);
    const response = await axios.post(SAM_URL + "/SAM_IF005", requestData);
    return response.data;
  } catch (err) {
    console.error("Error sending msg to SAM");
    return err;
  }
}

app.post("/SEND_ALL_TASKS", async (req, res) => {
  let isProcessing = false; // 현재 태스크가 처리 중인지 확인

  const processNextTask = () => {
    if (isProcessing) {
      //console.log('A task is already in progress. Waiting for completion...');
      return;
    }

    isProcessing = true;

    taskManager.getTasks("pending", (err, tasks) => {
      if (err) {
        console.error("Error fetching tasks:", err.message);
        isProcessing = false;
        return;
      }

      if (!tasks.length) {
        //console.log('No pending tasks to process.');
        isProcessing = false;
        return;
      }

      const currentTask = tasks[0]; // 가장 오래된 태스크 선택
      //console.log('Processing task:', currentTask);

      // FastAPI 서버로 태스크 전송
      const dataToSend = {
        AMR_ORDER_TC_NUM: String(currentTask.amr_order_tc_num),
        WORK_ORDER: String(currentTask.work_order),
        PRODUCT_NO: String(currentTask.product_no),
        SERIAL_NO: String(currentTask.serial_no),
        ACS_ORDER_SND_TIME: String(
          new Date().toISOString().replace(/[-:.TZ]/g, "")
        ), // ISO 형식 타임스탬프
        TRAY_NO: String(currentTask.tray_no),
        ORDER_LOC_FROM: String(currentTask.order_loc_from),
        ORDER_LOC_TO: String(currentTask.order_loc_to),
      };

      axios
        .post(`${robot_ip}/TASK_INFORM_MESSAGE`, dataToSend, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          //console.log('Task sent successfully:', response.data);

          // 태스크 상태를 'IN_PROGRESS'로 업데이트
          taskManager.updateTaskStatus(currentTask.id, "IN_PROGRESS", (err) => {
            if (err) {
              console.error(
                `Error updating task status for ID ${currentTask.id}:`,
                err.message
              );
            } else {
              //console.log(`Task ID ${currentTask.id} status updated to 'IN_PROGRESS'.`);
            }
          });
        })
        .catch((error) => {
          console.error("Error sending task to FastAPI server:", error.message);
        })
        .finally(() => {
          isProcessing = false;
        });
    });
  };

  // 첫 태스크 처리 시작
  processNextTask();

  res
    .status(200)
    .json({ message: "Task processing initiated. Check logs for progress." });

  // 태스크 완료 시 다음 태스크 처리
  taskManager.onTaskFinished(() => {
    //console.log('Task finished. Starting next task...');
    processNextTask();
  });
});

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  console.log("page load");
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start the server
const PORT = 3343;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
// class TaskManager extends EventEmitter {
//   constructor(db) {
//     super();
//     this.db = db;
//     this.initializeDatabase();
//   }

//   initializeDatabase() {
//     this.db.run(
//       `
//       CREATE TABLE IF NOT EXISTS tasks (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         amr_order_tc_num TEXT UNIQUE, -- AMR 명령 번호는 고유해야 함
//         work_order TEXT,
//         product_no TEXT,
//         serial_no TEXT,
//         tray_no TEXT,
//         order_loc_from TEXT,
//         order_loc_to TEXT,
//         priority INTEGER,
//         status TEXT, -- 'pending', 'in_progress', 'finished', 'failed'
//         created_at TEXT,
//         updated_at TEXT
//       )
//     `,
//       (err) => {
//         if (err) console.error("Error initializing task table:", err.message);
//       }
//     );
//   }

//   addTask(taskData, callback) {
//     const {
//       amr_order_tc_num,
//       work_order,
//       product_no,
//       serial_no,
//       tray_no,
//       order_loc_from,
//       order_loc_to,
//       priority,
//     } = taskData;

//     const createdAt = new Date().toISOString();
//     const query = `
//       INSERT INTO tasks
//       (amr_order_tc_num, work_order, product_no, serial_no, tray_no, order_loc_from, order_loc_to, priority, status, created_at, updated_at)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
//     `;
//     this.db.run(
//       query,
//       [
//         amr_order_tc_num,
//         work_order,
//         product_no,
//         serial_no,
//         tray_no,
//         order_loc_from,
//         order_loc_to,
//         priority,
//         createdAt,
//         createdAt,
//       ],
//       callback
//     );
//   }

//   updateTaskStatus(taskId, status, callback) {
//     const updatedAt = new Date().toISOString();
//     const query = `
//       UPDATE tasks
//       SET status = ?, updated_at = ?
//       WHERE id = ?
//     `;
//     this.db.run(query, [status, updatedAt, taskId], callback);
//   }

//   updateTaskStatusByOrderNumber(orderNumber, status, callback) {
//     const updatedAt = new Date().toISOString();
//     const query = `
//       UPDATE tasks
//       SET status = ?, updated_at = ?
//       WHERE amr_order_tc_num = ?
//     `;
//     this.db.run(query, [status, updatedAt, orderNumber], callback);
//   }

//   getTasks(status, callback) {
//     const query = status
//       ? `SELECT * FROM tasks WHERE status = ? ORDER BY created_at ASC`
//       : `SELECT * FROM tasks ORDER BY created_at ASC`;
//     this.db.all(query, status ? [status] : [], callback);
//   }

//   getTaskByOrderNumber(orderNumber, callback) {
//     const query = `
//       SELECT * FROM tasks WHERE amr_order_tc_num = ?
//     `;
//     this.db.get(query, [orderNumber], callback);
//   }

//   onTaskFinished(callback) {
//     this.on("taskFinished", callback);
//   }

//   emitTaskFinished(orderNumber) {
//     this.emit("taskFinished", orderNumber);
//   }
// }

// const taskManager = new TaskManager(db);
