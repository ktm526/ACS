const styles = {
  container: {
    border: "1px solid #59575E",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    height: "100%",
    backgroundColor: "#2B2633",
    position: "relative",
  },
  header: {
    width: "100%",
    height: "28px",
    backgroundColor: "#59575E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Pretendard, sans-serif",
    fontWeight: "600",
    fontSize: "14px",
    color: "white",
  },
  imageContainer: {
    border: "0px solid #59575E",
    borderRadius: "10px",
    padding: "10px",
    margin: "20px",
    width: "calc(100% - 60px)",
    display: "flex",
    justifyContent: "center",
    backgroundColor: "transparent", //'#1C1B1F', // 어두운 배경색으로 변경
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)", // 내측 그림자 추가
    overflow: "hidden",
  },
  image: {
    width: "100%", // 이미지가 컨테이너에 맞게 조정
    height: "auto",
    borderRadius: "10px",
  },
  modalTitle: {
    color: "white",
    fontFamily: "Pretendard, sans-serif",
    fontWeight: "600",
    marginBottom: "20px",
    fontSize: "24px",
    textAlign: "center",
  },
  modalContent: {
    color: "white",
    fontFamily: "Pretendard, sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  threeColumnContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: "20px", // 컬럼 간 간격
    marginTop: "20px",
  },
  column: {
    flex: 1,
    // 테이블 배경 색상 제거
    backgroundColor: "transparent",
  },
  sectionHeader: {
    color: "#E7E964", // 브랜드 컬러 사용
    borderBottom: "1px solid #59575E",
    paddingBottom: "5px",
    marginBottom: "10px",
    fontSize: "18px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableKey: {
    textAlign: "left",
    padding: "8px",
    fontWeight: "bold",
    width: "40%",
    verticalAlign: "top",
    // 배경 색상 제거
    backgroundColor: "transparent",
    borderBottom: "1px solid #59575E",
    color: "#E7E964", // 브랜드 컬러 사용
  },
  tableValue: {
    textAlign: "left",
    padding: "8px",
    width: "60%",
    // 배경 색상 제거
    backgroundColor: "transparent",
    borderBottom: "1px solid #59575E",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start", // 내용물을 왼쪽으로 붙임
    border: "2px solid red",
    borderRadius: "10px",
    backgroundColor: "#2B2633",
    color: "white", // 글씨 색상 흰색으로 설정
    width: "calc(100% - 60px)", // 테두리로부터 10px 마진을 둔 폭
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)", // 박스 그림자 추가
    marginTop: "0px",
    marginBottom: "20px",
    height: "6%",
    paddingLeft: "10px",
  },
  successContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start", // 내용물을 왼쪽으로 붙임
    border: "2px solid green",
    borderRadius: "10px",
    backgroundColor: "#2B2633",
    color: "white", // 글씨 색상 흰색으로 설정
    width: "calc(100% - 60px)", // 테두리로부터 10px 마진을 둔 폭
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)", // 박스 그림자 추가
    marginTop: "0px",
    marginBottom: "20px",
    height: "6%",
    paddingLeft: "10px",
  },
  neutralContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    border: "2px solid gray",
    borderRadius: "10px",
    backgroundColor: "#2B2633",
    color: "white",
    width: "calc(100% - 60px)",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
    marginTop: "0px",
    marginBottom: "20px",
    height: "6%",
    paddingLeft: "10px",
  },

  errorIcon: {
    width: "16px",
    height: "16px",
    marginRight: "10px",
    fill: "red", // 오류 아이콘 색상
  },
  successIcon: {
    width: "16px",
    height: "16px",
    marginRight: "10px",
    fill: "green", // 성공 아이콘 색상
  },
  neutralIcon: {
    width: "16px",
    height: "16px",
    marginRight: "10px",
    fill: "gray",
  },
  message: {
    fontFamily: "Pretendard, sans-serif",
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
  },
};

export default styles;
