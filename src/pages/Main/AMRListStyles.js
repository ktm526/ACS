const styles = {
  container: {
    border: "2px solid #59575E",
    borderRadius: "20px",
    overflow: "hidden",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backdropFilter: "blur(10px)", // 글래스모피즘 효과
    marginBottom: "20px",
  },
  header: {
    height: "28px",
    backgroundColor: "#59575E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
  },
  content: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    borderRadius: "10px",
    transition: "transform 0.3s ease, background 0.3s ease", // 부드러운 전환 효과
  },
  leftSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "10px",
  },
  amrId: {
    display: "flex",
    alignItems: "center",
    fontWeight: "600",
    fontSize: "16px",
    marginLeft: "10px",
  },
  statusIndicator: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  divider: {
    border: "none",
    borderBottom: "1px solid #707070",
    margin: "10px 0",
  },
};

export default styles;
