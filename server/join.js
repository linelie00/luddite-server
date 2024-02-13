// 필요한 모듈 불러오기
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = 8282;

// 데이터베이스 연결 설정
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'san00',
  password: '0408', 
  database: 'luddite',
  port: 3306,
});

// 데이터베이스 연결
connection.connect((err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err);
    return;
  }
  console.log('MariaDB에 연결되었습니다.');
});

// JSON 파싱 미들웨어 추가
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


 //로그인
 app.get('/login', (req, res) => {
    const loginHtml = `
    <!DOCTYPE html>
        <html>
        <head>
            <title>로그인</title>
            </head>
            <body>
                
                <form action="/login_post" method="POST">
                    <fieldset>
                        <legend>로그인</legend>

                        아이디 : <br>
                        <input type="text" name="id"><br><br>
                
                        비밀번호 : <br>
                        <input type="password" name="pw"><br><br>

                        <input type="submit" value="로그인">
                        <input type="button" value="회원 가입" onclick=register()>
                        <input type="button" value="회원 정보 수정" onclick=update()>
                    </fieldset>

                    <input type="button" value="관리자 도구" onclick=manager()>
                </form>

                <script>
                function register() {
                    window.location.href = "/join";
                }
                </script>

                <script>
                function update() {
                    window.location.href = "/update";
                }
                </script>

                <script>
                function manager() {
                    window.location.href = "/manager";
                }
                </script>
        </body>
        </html>
    `
    res.send(loginHtml);
 });

//로그인 완료
app.post('/login_post',(req, res) => {
    const id = req.body.id;
    const pw = req.body.pw;

    const sql = 'SELECT * FROM users WHERE id = ?';

    connection.query(sql, [id], (err, results) => {
        if (err) {
          console.error('쿼리 실행 오류:', err);
          res.status(500).json({ error: '로그인 실패' });
          return;
        }
    
        if (results.length === 0) {
          res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        } else {
          const user = results[0];
          if (user.pw === pw) {
            res.status(200).json({ message: `환영합니다 ${id}님!` });
          } else {
            res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
          }
        }
      });
});

//회원가입 입력받기 or 회원수정 페이지로 이동
app.get('/join',(req, res) => {
    const joinHtml = `
    <!DOCTYPE html>
        <html>
        <head>
            <title>회원 정보</title>
            </head>
            <body>
                
                <form action="/join_post" method="POST">
                    <fieldset>
                        <legend>회원가입</legend>
                        이름 : <br>
                        <input type="text" name="user_name"><br><br>

                        아이디 : <br>
                        <input type="text" name="id"><br><br>
                
                        비밀번호 : <br>
                        <input type="password" name="pw"><br><br>

                        <input type="submit" value="가입">
                        <input type="button" value="로그인" onclick=login()>
                        <input type="button" value="회원 정보 수정" onclick=update()>
                    </fieldset>

                    <input type="button" value="관리자 도구" onclick=manager()>
                </form>

                <script>
                function login() {
                    window.location.href = "/login";
                }
                </script>

                <script>
                function update() {
                    window.location.href = "/update";
                }
                </script>

                <script>
                function manager() {
                    window.location.href = "/manager";
                }
                </script>
        </body>
        </html>
    `
    res.send(joinHtml);
});

// 회원가입 완료
app.post('/join_post', (req, res) => {
    const user_name = req.body.user_name;
    const id = req.body.id;
    const pw = req.body.pw;

    //공백이 있는지 확인
    if(user_name === '' || id === '' || pw === '' ) {
        res.status(500).json({ error: '공백이 포함되어 있습니다.' });
    } else {

        // 중복된 아이디 있는지 확인
        const dupCheckQuery = 'SELECT * FROM users WHERE id = ?';
        connection.query(dupCheckQuery, [id], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('쿼리 실행 오류:', checkErr);
                res.status(500).json({ error: '정보 확인 중 오류 발생' });
                return;
            }

            if (checkResults.length === 0) {
                // old_pw에 현재 pw를, join_date에 가입한 날짜를, update_date에 현재 날짜를 설정
                const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                
                const sql = 'INSERT INTO users (user_name, id, pw, join_date, update_date) VALUES (?, ?, ?, ?, ?)';
                const values = [user_name, id, pw, currentDateTime, currentDateTime];
            
                connection.query(sql, values, (err, results) => {
                if (err) {
                    console.error('쿼리 실행 오류:', err);
                    res.status(500).json({ error: '아이디 추가 실패' });
                    return;
                }
                console.log('아이디가 성공적으로 추가되었습니다.');
                res.status(200).json({ message: '아이디가 추가되었습니다.' });

                });
            } else {
                res.status(401).json({ error: '아이디가 중복되었습니다.' });
            } 

        });
    }

  });


  //회원 정보 수정/삭제 페이지
  app.get('/update', (req,res) => {
    const updateHtml = `
    <!DOCTYPE html>
        <html>
        <head>
            <title>회원 수정</title>
            </head>
            <body>

                <form action="/update_post" method="POST">
                        

                    <fieldset>
                        아이디 : 
                        <input type="text" name="old_id"><br><br>
                
                        비밀번호 : 
                        <input type="password" name="old_pw"><br><br>

                        <legend>정보 수정</legend>
                        새 이름 : 
                        <input type="text" name="user_name"><br><br>

                        새 아이디 : 
                        <input type="text" name="id"><br><br>

                        새 비밀번호 : 
                        <input type="password" name="pw"><br><br>

                        <input type="submit" value="수정"><br><br>
                    </fieldset>
                </form>

                <form action="/delete" method="POST">
                <fieldset>
                    <legend>회원 탈퇴</legend>
                    아이디 : 
                    <input type="text" name="id"><br><br>

                    비밀번호 : 
                    <input type="password" name="pw"><br><br>

                    <input type="submit" value="회원 탈퇴"><br><br>
                </fieldset>
                </form>

            </body>
        </html>
    `
    res.send(updateHtml);
  });

  //회원 정보 수정 완료
  app.post('/update_post', (req, res) => {
    const user_name = req.body.user_name;
    const old_id = req.body.old_id;
    const old_pw = req.body.old_pw;
    const id = req.body.id;
    const pw = req.body.pw;
  
    // old_id와 old_pw 값이 데이터베이스에서 일치하는지 확인
    const checkQuery = 'SELECT * FROM users WHERE id = ? AND pw = ?';
    connection.query(checkQuery, [old_id, old_pw], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('쿼리 실행 오류:', checkErr);
        res.status(500).json({ error: '정보 확인 중 오류 발생' });
        return;
      }
  
      if (checkResults.length === 0) {
        res.status(401).json({ error: '기존 아이디 또는 비밀번호가 올바르지 않습니다.' });
      } else {
        // old_id와 old_pw가 일치하는 경우, 정보를 수정
        const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
        const updateQuery = 'UPDATE users SET user_name = ?, id = ?, pw = ?, old_pw = ?, update_date = ? WHERE id = ? AND pw = ?';
        const updateValues = [user_name, id, pw, old_pw, currentDateTime, old_id, old_pw];
  
        connection.query(updateQuery, updateValues, (updateErr, updateResults) => {
          if (updateErr) {
            console.error('쿼리 실행 오류:', updateErr);
            res.status(500).json({ error: '정보 수정 중 오류 발생' });
            return;
          }
          console.log('정보가 성공적으로 수정되었습니다.');
  
            res.status(200).json({ message: '정보가 수정되었습니다.' });
        });
      }
    });
  });
  

  //회원 탈퇴
  app.post('/delete', (req,res) => {
    const id = req.body.id;
    const pw = req.body.pw;


    // old_id와 old_pw 값이 데이터베이스에서 일치하는지 확인
    const checkQuery = 'SELECT * FROM users WHERE id = ? AND pw = ?';
    connection.query(checkQuery, [id, pw], (checkErr, checkResults) => {
    if (checkErr) {
        console.error('쿼리 실행 오류:', checkErr);
        res.status(500).json({ error: '정보 확인 중 오류 발생' });
        return;
    }

    if (checkResults.length === 0) {
        res.status(401).json({ error: '기존 아이디 또는 비밀번호가 올바르지 않습니다.' });
    } else {
        // old_id와 old_pw가 일치하는 경우, 회원 정보 삭제
        const deleteQuery = 'DELETE FROM users WHERE id = ? AND pw = ?';
        const deleteValues = [id, pw];

        connection.query(deleteQuery, deleteValues, (deleteErr, deleteResults) => {
        if (deleteErr) {
            console.error('쿼리 실행 오류:', deleteErr);
            res.status(500).json({ error: '회원 정보 삭제 중 오류 발생' });
            return;
        }
        console.log('회원 정보가 성공적으로 삭제되었습니다.');
        res.status(200).json({ message: `${id} 님의 회원 정보가 삭제되었습니다.` });
        });
    }
    });
});

// 관리자용 페이지
app.get('/manager',(req, res) => {
    const managerHtml = `
    <!DOCTYPE html>
        <html>
        <head>
            <title>관리자 전용 페이지</title>
            </head>
            <body>
                <label for="value">관리자 페이지</label><br>

                <form action="/search" method="POST">
                
                    <fieldset>
                        <legend>회원 조회</legend>
                        id : 
                        <input type="text" name="select"><br><br>

                        <input type="submit" value="조회"><br><br>
                    </fieldset>
                </form>

                <br><br>

                <form action="/updateMultiple" method="POST">
                <fieldset>
                    <legend>업데이트</legend>

                    set  
                    <input type="text" name="set"><br><br>

                    where  
                    <input type="text" name="where"><br><br>

                    <input type="submit" value="업데이트"><br><br>
                </fieldset>
                </form>

            </body>
        </html>
    `
    res.send(managerHtml);

});



//다중 정보 업데이트
//일치하는 회원이 없을 시 일치하는 회원이 없다고 해야함
app.post('/updateMultiple', (req, res) => {
    const set = req.body.set;
    const where = req.body.where;
    const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const checkSql = `SELECT * FROM users WHERE ${where};`;
    connection.query(checkSql, (checkErr, checkResults) => {
        if (checkErr) {
            console.error('쿼리 실행 오류:', checkErr);
            res.status(500).json({ error: '정보 확인 중 오류 발생' });
            return;
        }

        if (checkResults.length === 0) {
            res.status(401).json({ error: '일치하는 데이터가 없습니다.'});
        } else {
            const sql = `UPDATE users SET ${set}, update_date = ? WHERE ${where};`;
            connection.query(sql, [currentDateTime],(err, results) => {
                if (err) {
                    console.log(err);
                    console.error('쿼리 실행 오류:', err);
                    res.status(500).json({ error: '정보 업데이트 실패' });
                    return;
                }
            
                console.log('정보가 성공적으로 업데이트되었습니다.');
                res.status(200).json({ message: '정보가 수정되었습니다.' });

            });
        }
    });
});

//사람 조회
app.post('/search', (req, res) => {
    const select = req.body.select;

    const sql = 'SELECT * FROM users WHERE id = ?';
    const values = [select];

    connection.query(sql, values, (err, results) => {
        if (err) {
            console.error('쿼리 실행 오류:', err);
            res.status(500).json({ error: '조회 실패' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ message: '일치하는 id가 없습니다.' });
            return;
        }
        res.status(200).json({ people: results });
    });
});
  
  
  

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

//http://localhost:8228/login