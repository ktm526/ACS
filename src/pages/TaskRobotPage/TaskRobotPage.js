import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TaskRobotPage.css";

const POLLING_INTERVAL = 1000; // 5초마다 데이터 요청
const amr_ord_pri_ORDER = { H: 3, M: 2, L: 1 }; // 우선순위 정렬 기준

const TaskRobotPage = () => {
  const [tasks, setTasks] = useState([]);
  const [robots, setRobots] = useState([]);
  const [newTask, setNewTask] = useState({
    amr_ord_no: "",
    amr_ord_flag: "N",
    amr_ord_ty: "S",
    wo_no: "",
    item_code: "",
    serial_no: "",
    tray_no: "",
    amr_ord_dtm: "",
    loc_no_to: "",
    loc_no_fr: "",
    amr_ord_pri: "L",
  });

  useEffect(() => {
    // 초기 데이터 로드
    fetchTasks();

    // 폴링 시작
    const intervalId = setInterval(() => {
      fetchTasks();
    }, POLLING_INTERVAL);

    // 컴포넌트 언마운트 시 폴링 중단
    return () => clearInterval(intervalId);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_NODE_SERVER_IP}/SAM_IF004/TASKS`
      );
      console.log(response.data);
      setTasks(response.data.rows);
    } catch (error) {
      console.error("Error fetching tasks:", error.message);
    }
  };
  const handleDeleteTask = (task) => {
    if (window.confirm(`태스크 ${task.amr_ord_no}를 삭제하시겠습니까?`)) {
      // p_param으로 요청 데이터 감싸기
      const cancelTask = {
        p_param: {
          amr_ord_no: task.amr_ord_no, // 태스크 번호
          amr_ord_flag: "C", // 삭제 요청
        },
      };

      axios
        .post(`${process.env.REACT_APP_NODE_SERVER_IP}/SAM_IF004`, cancelTask, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          console.log("Task canceled successfully:", response.data);
          alert("작업이 성공적으로 삭제되었습니다.");
          fetchTasks(); // 태스크 목록 새로고침
        })
        .catch((error) => {
          console.error("Error canceling task:", error.message);
          alert("작업 삭제에 실패했습니다.");
        });
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(); // 로컬 시간으로 변환
  };

  // const handleSendTask = async (task) => {
  //   console.log("보내기 버튼 클릭:", task);

  //   try {
  //     const response = await axios.post(
  //       `${process.env.REACT_APP_NODE_SERVER_IP}/SEND_TASK`,
  //       task,
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     console.log("Task sent successfully:", response.data);
  //     alert("작업이 성공적으로 전송되었습니다.");
  //   } catch (error) {
  //     console.error("Error sending task:", error.message);
  //     alert("작업 전송에 실패했습니다.");
  //   }
  // };

  const handleNewTaskSubmit = async (event) => {
    event.preventDefault();

    // 현재 시간으로 전송 시간 설정
    const currentTime = new Date().toISOString(); // ISO 8601 형식

    const taskWithCurrentTime = {
      ...newTask,
      amr_ord_dtm: currentTime, // 현재 시간을 전송 시간으로 설정
    };

    console.log("새 태스크 전송:", taskWithCurrentTime);

    // p_param 필드로 감싸기
    const requestPayload = {
      p_param: {
        ...taskWithCurrentTime,
      },
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_NODE_SERVER_IP}/SAM_IF004`,
        requestPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("New task sent successfully:", response.data);
      alert("새 작업이 성공적으로 추가되었습니다.");

      // 입력 필드 초기화
      setNewTask({
        amr_ord_no: "",
        amr_ord_flag: "N",
        amr_ord_ty: "S",
        wo_no: "",
        item_code: "",
        serial_no: "",
        tray_no: "",
        loc_no_to: "",
        loc_no_fr: "",
        amr_ord_pri: "L",
      });

      fetchTasks(); // 태스크 목록 갱신
    } catch (error) {
      console.error("Error sending new task:", error.message);
      alert("새 작업 추가에 실패했습니다.");
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const amr_ord_priA = amr_ord_pri_ORDER[a.amr_ord_pri] || 0;
    const amr_ord_priB = amr_ord_pri_ORDER[b.amr_ord_pri] || 0;

    if (amr_ord_priA !== amr_ord_priB) {
      return amr_ord_priB - amr_ord_priA; // 우선순위 높은 순으로 정렬
    }
    return new Date(a.created_at) - new Date(b.created_at); // 생성 시간 오래된 순으로 정렬
  });

  return (
    <div className="page-container">
      <div className="section-container">
        <h2 className="section-title">작업 목록</h2>
        <div className="table-container">
          <div className="header-row">
            <div className="table-header-item">삭제</div>
            <div className="table-header-item">작업 번호</div>
            <div className="table-header-item">상태</div>
            <div className="table-header-item">우선순위</div>
            <div className="table-header-item">생성 시간</div>
            <div className="table-header-item">작업 유형</div>
            <div className="table-header-item">출발 위치</div>
            <div className="table-header-item">도착 위치</div>
            <div className="table-header-item">작업 명령 번호</div>
            <div className="table-header-item">제품 번호</div>
            <div className="table-header-item">시리얼 번호</div>
            <div className="table-header-item">트레이 번호</div>
          </div>
          {sortedTasks.map((task, index) => (
            <div key={index} className="table-row">
              <div className="table-cell">
                <button
                  className="delete-task-button"
                  onClick={() => handleDeleteTask(task)}
                  title="Delete Task"
                >
                  ×
                </button>
              </div>
              <div className="table-cell">{task.amr_ord_no}</div>
              <div className="table-cell">{task.status}</div>
              <div className="table-cell">{task.amr_ord_pri}</div>
              <div className="table-cell">
                {(task.amr_ord_dtm)}
              </div>
              <div className="table-cell">{task.amr_ord_ty}</div>
              <div className="table-cell">{task.loc_no_fr}</div>
              <div className="table-cell">{task.loc_no_to}</div>
              <div className="table-cell">{task.wo_no}</div>
              <div className="table-cell">{task.item_code}</div>
              <div className="table-cell">{task.serial_no}</div>
              <div className="table-cell">{task.tray_no}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 입력 폼 추가 */}
      <div className="new-task-form-container">
        <h2 className="new-task-form-title">새 태스크 추가</h2>
        <form onSubmit={handleNewTaskSubmit} className="new-task-form">
          <div className="new-task-form-group">
            <label>작업 번호 (amr_ord_no)</label>
            <input
              type="text"
              value={newTask.amr_ord_no}
              onChange={(e) =>
                setNewTask({ ...newTask, amr_ord_no: e.target.value })
              }
              required
            />
          </div>
          <div className="new-task-form-group">
            <label>취소 여부 (amr_ord_flag)</label>
            <select
              value={newTask.amr_ord_flag}
              onChange={(e) =>
                setNewTask({ ...newTask, amr_ord_flag: e.target.value })
              }
            >
              <option value="N">N</option>
              <option value="C">C</option>
            </select>
          </div>
          <div className="new-task-form-group">
            <label>작업 유형 (amr_ord_ty)</label>

            <select
              value={newTask.amr_ord_ty}
              onChange={(e) =>
                setNewTask({ ...newTask, amr_ord_ty: e.target.value })
              }
            >
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="B">B</option>
              <option value="P">P</option>
            </select>
          </div>
          <div className="new-task-form-group">
            <label>작업 명령 번호 (wo_no)</label>
            <input
              type="text"
              value={newTask.wo_no}
              onChange={(e) =>
                setNewTask({ ...newTask, wo_no: e.target.value })
              }
              required
            />
          </div>
          <div className="new-task-form-group">
            <label>제품 번호 (item_code)</label>
            <input
              type="text"
              value={newTask.item_code}
              onChange={(e) =>
                setNewTask({ ...newTask, item_code: e.target.value })
              }
              required
            />
          </div>
          <div className="new-task-form-group">
            <label>시리얼 번호 (serial_no)</label>
            <input
              type="text"
              value={newTask.serial_no}
              onChange={(e) =>
                setNewTask({ ...newTask, serial_no: e.target.value })
              }
              required
            />
          </div>
          <div className="new-task-form-group">
            <label>트레이 번호 (tray_no)</label>
            <input
              type="text"
              value={newTask.tray_no}
              onChange={(e) =>
                setNewTask({ ...newTask, tray_no: e.target.value })
              }
              required
            />
          </div>
          <div className="new-task-form-group">
            <label>출발 위치 (loc_no_fr)</label>
            <input
              type="text"
              value={newTask.loc_no_fr}
              onChange={(e) =>
                setNewTask({ ...newTask, loc_no_fr: e.target.value })
              }
              required
            />
          </div>
          <div className="new-task-form-group">
            <label>도착 위치 (loc_no_to)</label>
            <input
              type="text"
              value={newTask.loc_no_to}
              onChange={(e) =>
                setNewTask({ ...newTask, loc_no_to: e.target.value })
              }
              required
            />
          </div>
          <div className="new-task-form-group">
            <label>우선순위 (amr_ord_pri)</label>
            <select
              value={newTask.amr_ord_pri}
              onChange={(e) =>
                setNewTask({ ...newTask, amr_ord_pri: e.target.value })
              }
            >
              <option value="H">H</option>
              <option value="M">M</option>
              <option value="L">L</option>
            </select>
          </div>
          <button type="submit" className="add-task-button">
            태스크 추가
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskRobotPage;
