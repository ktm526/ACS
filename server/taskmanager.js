const EventEmitter = require("events");
const axios = require("axios");

class TaskManager extends EventEmitter {
  constructor(db, robotEndpoint) {
    super();
    this.db = db;
    this.robotEndpoint = robotEndpoint; // 로봇 API 엔드포인트
    this.isProcessing = false; // 현재 태스크 처리 상태
    this.startProcessing(); // 최초 태스크 처리 시작
  }

  // 우선순위 태스크 선택 (특정 태스크 제외 가능)
  async selectHighestPriorityTask(excludeTaskId = null) {
    const query = `
        SELECT * FROM sam_tasks 
        WHERE status = 'pending' 
        ${excludeTaskId ? `AND id != ${excludeTaskId}` : ""} 
        ORDER BY 
          CASE amr_ord_pri 
            WHEN 'H' THEN 1 
            WHEN 'M' THEN 2 
            WHEN 'L' THEN 3 
            ELSE 4 
          END, amr_ord_dtm ASC
        LIMIT 1
      `;

    return new Promise((resolve) => {
      this.db.get(query, (err, task) => {
        if (err) {
          console.error("Error fetching tasks:", err.message);
          resolve(null); // 오류 발생 시 null 반환
        } else {
          resolve(task); // 가장 우선순위가 높은 태스크 반환
        }
      });
    });
  }

  async hasInProgressTask(){
    const query = `
      SELECT COUNT(*) as count FROM sam_tasks
      WHERE status = 'in_progress'
    `;
    return new Promise((resolve) =>{
      this.db.get(query, (err, row) =>{
        if(err){
          console.error("Error checking in-progress tasks: ", err.message);
          resolve(false);
        }else{
          resolve(row.count >0);
        }
      })
    })
  }
  async hasCanceledTask(){
    const query = `
      SELECT COUNT(*) as count FROM sam_tasks
      WHERE status = 'canceled'
    `;
    return new Promise((resolve) =>{
      this.db.get(query, (err, row) =>{
        if(err){
          console.error("Error checking canceled tasks: ", err.message);
          resolve(false);
        }else{
          resolve(row.count >0);
        }
      })
    })
  }
  // 가상의 센서 확인 함수
  async checkSensor() {
    console.log("Checking sensor status...");
    const sensorUrl = "http://10.29.176.171/di_value/slot_0/ch_0";
    const auth = {
      username: "root",
      password: "00000000"
    }
    try{
      const response = await axios.get(sensorUrl, {
        auth,
      });
      console.log("sensor response:", response.data);
      if (response.data && typeof response.data.Val != "undefined"){
        return response.data.Val === 1;
      }else{
        console.error("Invalid response format");
        return false;
      }
    }catch(error){
      console.error("error checking sensor: ", error.message);
      return false
    }
    // 가상의 센서 확인 로직: true/false 랜덤 값 반환
  }

  // 태스크 전송 시도
  async sendTask(task) {
    const taskData = {
      amr_ord_no: task.amr_ord_no,
      amr_ord_dtm: task.amr_ord_dtm,
      amr_ord_ty: task.amr_ord_ty,
      amr_ord_pri: task.amr_ord_pri,
      loc_no_fr: task.loc_no_fr,
      loc_no_to: task.loc_no_to,
      wo_no: task.wo_no,
      item_code: task.item_code,
      serial_no: task.serial_no,
      tray_no: task.tray_no,
    };

    console.log("Sending task:", taskData);

    try {
      // 상태를 'sending'으로 업데이트
      await this.updateTaskStatus(task.id, "sending");

      const response = await axios.post(this.robotEndpoint, taskData, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("Task sent successfully:", response.data);
      if (response.status != 200){
        // 실패 시 상태를 'pending'으로 되돌림
        await this.updateTaskStatus(task.id, "pending");
        return false; // 전송 실패
      }
      else{
        // 태스크 상태를 IN_PROGRESS로 업데이트
        await this.updateTaskStatus(task.id, "in_progress");
        return true; // 전송 성공
      }
    } catch (error) {
      console.error("Error sending task:", error.message);

      
    }
  }

  // 태스크 상태 업데이트
  async updateTaskStatus(taskId, status) {
    const query = `
        UPDATE sam_tasks 
        SET status = ?, updated_at = ? 
        WHERE id = ?
      `;
    const updatedAt = new Date().toISOString();

    return new Promise((resolve) => {
      this.db.run(query, [status, updatedAt, taskId], (err) => {
        if (err) {
          console.error("Error updating task status:", err.message);
          resolve(false);
        } else {
          console.log(`Task ID ${taskId} updated to ${status}`);
          resolve(true);
        }
      });
    });
  }

  // 작업 프로세스 시작
  async startProcessing() {
    while (true) {
      if (this.isProcessing) {
        await this.delay(1000); // 1초 대기 후 다시 확인
        continue;
      }
      const inProgress = await this.hasInProgressTask();
      const hasCanceled = await this.hasCanceledTask();
      if(inProgress){
        console.log("Task is already in progress. Retrying in 5 sec...");
        await this.delay(5000);
        continue;
      }else if(hasCanceled){
        let task = await this.selectHighestPriorityTask();
        if (!task) {
          console.log("No pending tasks. Retrying in 5 seconds...");
          await this.delay(5000); // 5초 후 다시 시도
          continue;
        }
        while(task){
          console.log("Selected task:", task);
          if(task.amr_ord_pri == "H"){
            this.isProcessing = true;
            if (task.amr_ord_ty === "P") {
              console.log("Task requires sensor check.");
    
              const sensorStatus = await this.checkSensor();
    
              if (sensorStatus) {
                console.log("Sensor check TRUE. Selecting next task.");
                task = await this.selectHighestPriorityTask(task.id); // 현재 태스크 제외하고 다음 태스크 선택
                continue; // 다음 태스크로 진행
              }
              console.log("Sensor check FALSE. Proceeding with task.");
            }
    
            // 20초 내에 태스크 전송 시도
            const success = await Promise.race([
              this.sendTask(task),
              this.delay(20000).then(() => false), // 20초 타임아웃 처리
            ]);
    
            if (!success) {
              console.log(
                "Task sending timed out or failed. Resetting task to pending."
              );
              await this.updateTaskStatus(task.id, "pending"); // 타임아웃 시 상태 복구
            }
    
            this.isProcessing = false; // 처리 상태 해제
            const query = `DELETE FROM sam_tasks WHERE status = ?`;
            this.db.run(query, ['canceled'])

            break; // 현재 태스크 완료 후 루프 종료
          }else{
            console.log("Waiting for manual order...Retrying in 5 seconds...");
            await this.delay(5000); // 5초 후 다시 시도
            continue;
          }
        }
      }else{
        let task = await this.selectHighestPriorityTask();

        if (!task) {
          console.log("No pending tasks. Retrying in 5 seconds...");
          await this.delay(5000); // 5초 후 다시 시도
          continue;
        }
  
        while (task) {
          console.log("Selected task:", task);
  
          this.isProcessing = true; // 처리 상태 설정
  
          // 작업 유형이 P인 경우 센서 확인
          if (task.amr_ord_ty === "P") {
            console.log("Task requires sensor check.");
  
            const sensorStatus = await this.checkSensor();
  
            if (sensorStatus) {
              console.log("Sensor check TRUE. Selecting next task.");
              task = await this.selectHighestPriorityTask(task.id); // 현재 태스크 제외하고 다음 태스크 선택
              continue; // 다음 태스크로 진행
            }
            console.log("Sensor check FALSE. Proceeding with task.");
          }
  
          // 20초 내에 태스크 전송 시도
          const success = await Promise.race([
            this.sendTask(task),
            this.delay(20000).then(() => false), // 20초 타임아웃 처리
          ]);
  
          if (!success) {
            console.log(
              "Task sending timed out or failed. Resetting task to pending."
            );
            await this.updateTaskStatus(task.id, "pending"); // 타임아웃 시 상태 복구
          }
  
          this.isProcessing = false; // 처리 상태 해제
          break; // 현재 태스크 완료 후 루프 종료
      }
      }
    }
  }

  // 유틸리티: 비동기 딜레이
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = TaskManager;
