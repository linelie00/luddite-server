// 필요한 모듈 불러오기
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const port = 8282;   
const server = require('http').createServer(app);

app.use(cors());
app.use(express.json());

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
app.post('/use/login', (req, res) => {
    const id = req.body.id;
    const pw = req.body.pw;
  
    const sql = 'SELECT * FROM users WHERE id = ?';
  
    connection.query(sql, [id], (err, results) => {
      if (err) {
        console.error('쿼리 실행 오류:', err);
        res.status(500).json({ error: '데이터베이스 오류가 발생했습니다.' });
        return;
      }
  
      if (results.length === 0) {
        res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      } else {
        const user = results[0];
        if (user.pw === pw) {
          // 북마크 데이터가 null이면 빈 배열을 클라이언트에게 보냄
          const bookmarksArray = user.bookmarks ? user.bookmarks.split('/') : [];
  
          // 클라이언트에게 북마크 배열을 응답
          res.status(200).json({ message: `환영합니다 ${id}님!`, bookmarks: bookmarksArray, user_name: user.user_name });
        } else {
          res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        }
      }
    });
  });
  

//회원가입
app.post('/use/signup', (req, res) => {
  const user_name = req.body.user_name;
  const id = req.body.id;
  const pw = req.body.pw;

  // 공백이 있는지 확인
  if (user_name === '' || id === '' || pw === '') {
      res.status(500).json({ error: '공백이 포함되어 있습니다.' });
  } else {
      // 이름이 10글자 이상인 경우
      if (user_name.length >= 10) {
          res.status(500).json({ error: '이름은 10글자 이하여야 합니다.' });
      } else {
          // 아이디가 20글자 이상인 경우
          if (id.length >= 20) {
              res.status(500).json({ error: '아이디는 20글자 이하여야 합니다.' });
          } else {
              // 비밀번호가 15글자 이상인 경우
              if (pw.length >= 15) {
                  res.status(500).json({ error: '비밀번호는 15글자 이하여야 합니다.' });
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
          }
      }
  }
});

  
//북마크 수정
  app.post('/use/updateBookmarks', (req, res) => {
    const id = req.body.id; // 클라이언트에서 받아온 아이디
    const bookmarksArray = req.body.bookmarks; // 클라이언트에서 받아온 북마크 배열
  
    // 북마크 배열을 문자열로 변환하여 '/'로 구분하여 합침
    const bookmarksString = bookmarksArray.join('/');
  
    // 데이터베이스에 북마크 문자열을 업데이트하는 SQL 쿼리
    const sql = 'UPDATE users SET bookmarks = ? WHERE id = ?';
  
    // 데이터베이스 쿼리 실행
    connection.query(sql, [bookmarksString, id], (err, result) => {
      if (err) {
        console.error('쿼리 실행 오류:', err);
        res.status(500).json({ error: '데이터베이스 오류가 발생했습니다.' });
        return;
      }
  
      // 쿼리 실행 성공 시 클라이언트에 성공 응답 전송
      res.status(200).json({ message: '북마크가 성공적으로 업데이트되었습니다.' });
    });
  });

  //회원 정보 수정
  app.post('/use/update', (req, res) => {
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
  
        const updateQuery = 'UPDATE users SET user_name = ?, id = ?, pw = ?, update_date = ? WHERE id = ? AND pw = ?';
        const updateValues = [user_name, id, pw, currentDateTime, old_id, pw];
  
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


  //아이디 중복 확인
app.post('/use/checkId', (req, res) => {
  const id = req.body.id;

  // 공백 체크
  if (!id.trim()) {
    return res.status(400).json({ error: '아이디를 입력해주세요.' });
  }

  // 아이디 길이 체크 (20글자 초과)
  if (id.length > 20) {
    return res.status(400).json({ error: '아이디는 20글자 이하여야 합니다.' });
  }

  const sql = 'SELECT * FROM users WHERE id = ?';

  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error('쿼리 실행 오류:', err);
      return res.status(500).json({ error: '데이터베이스 오류가 발생했습니다.' });
    }

    if (results.length === 0) {
      // 아이디가 중복되지 않은 경우
      res.status(200).json({ message: '사용 가능한 아이디입니다.' });
    } else {
      // 아이디가 중복된 경우
      res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });
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

//비밀번호 수정

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