const styles = {
  container: {
    border: "2px solid #59575E",
    borderRadius: "20px",
    height: "100%",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
    overflow: "hidden",
    padding: "0",
  },
  headerRow: {
    display: "grid",
    padding: "0px 20px",
    gridTemplateColumns: "repeat(6, 1fr)", // 7개의 열로 나누어 제목을 가로로 표시
    backgroundColor: "#59575E",
    fontFamily: "Pretendard, sans-serif",
    fontWeight: "600",
    fontSize: "14px",
    color: "white",
    textAlign: "center",
    height: "28px", // 충분한 높이로 제목 영역 설정
    alignItems: "center", // 세로 가운데 정렬
  },
  tableContainer: {
    width: "100%",
    height: "100%",
    overflowY: "auto",
    borderSpacing: "0",
    borderCollapse: "collapse",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)", // 7개의 셀을 가로로 나열
    padding: "5px 20px",
  },
  tableCell: {
    fontSize: "12px",
    fontWeight: "200",
    textAlign: "center",
    padding: "5px",
    verticalAlign: "middle",
  },
  tableHeaderItem: {
    //padding: '10px',
    fontWeight: "600",
    fontSize: "14px",
    //backgroundColor: '#48464F',
    color: "white",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  rowDivider: {
    height: "1px",
    backgroundColor: "#707070",
    margin: "0 15px",
  },
};

export default styles;
