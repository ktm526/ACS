const styles = {
  container: {
    border: '2px solid #59575E',
    borderRadius: '20px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    height: '28px',
    backgroundColor: '#59575E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,  // 불필요한 여백 제거
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: '10px',
    overflowY: 'auto',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'space-between',  // IP 입력란과 버튼 한 줄에 배치
    padding: '10px',
  },
  input: {
    width: '80%',  // IP 입력란이 버튼보다 넓어짐
    padding: '10px',
    borderRadius: '5px',
    backgroundColor: '#2B2633',
    color: 'white',
    border: '1px solid #59575E',
    textAlign: 'center',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#59575E',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    height: '40px',  // 버튼 높이 고정
    width: '15%',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #707070',
  },
  amrId: {
    fontWeight: '600',
    fontSize: '16px',
  },
  divider: {
    borderBottom: '1px solid #707070',
    margin: '10px 0',
  },
  errorContainer: {
    color: 'red',
    padding: '10px',
    margin: '20px',
    textAlign: 'center',
  },
  responseContainer: {
    color: 'red',
    padding: '10px',
    margin: '20px',
    textAlign: 'center',
  },
};

export default styles;
