const styles = {
  container: {
    backgroundColor: "#2B2633",
    minHeight: "100vh",
    color: "white",
    padding: "20pt 40px", // 좌우 여백 40px
    boxSizing: "border-box",
  },
  pageTitle: {
    fontSize: "21px", // 제목 크기
    fontWeight: "600",
    fontFamily: "Pretendard, sans-serif",
    textAlign: "left", // 제목 왼쪽 정렬
    marginBottom: "20px",
  },
  contentRow: {
    display: "flex",
    flexDirection: "row",
    flex: 1,
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    flex: 4,
    paddingRight: "20px",
  },
  rightColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  monitoringSection: {
    flex: 2, // Monitoring 컴포넌트가 전체 왼쪽 컬럼의 75% 차지
    marginBottom: "20px", // AMRTable과의 간격 설정
  },
  amrTableSection: {
    flex: 1, // AMR Table이 전체 왼쪽 컬럼의 25% 차지
  },
};

export default styles;
