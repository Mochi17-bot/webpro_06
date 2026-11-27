"use strict";

const express = require("express");
const app = express();

app.set('view engine', 'ejs');
app.use("/public", express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));

let station = [
  { id:1, code:"JE01", name:"東京駅"},
  { id:2, code:"JE07", name:"舞浜駅"},
  { id:3, code:"JE12", name:"新習志野駅"},
  { id:4, code:"JE13", name:"幕張豊砂駅"},
  { id:5, code:"JE14", name:"海浜幕張駅"},
  { id:6, code:"JE05", name:"新浦安駅"},
];

let station2 = [
  { id:1, code:"JE01", name:"東京駅", change:"総武本線，中央線，etc", passengers:403831, distance:0 },
  { id:2, code:"JE02", name:"八丁堀駅", change:"日比谷線", passengers:31071, distance:1.2 },
  { id:3, code:"JE05", name:"新木場駅", change:"有楽町線，りんかい線", passengers:67206, distance:7.4 },
  { id:4, code:"JE07", name:"舞浜駅", change:"舞浜リゾートライン", passengers:76156, distance:12.7 },
  { id:5, code:"JE12", name:"新習志野駅", change:"", passengers:11655, distance:28.3 },
  { id:6, code:"JE17", name:"千葉みなと駅", change:"千葉都市モノレール", passengers:16602, distance:39.0 },
  { id:7, code:"JE18", name:"蘇我駅", change:"内房線，外房線", passengers:31328, distance:43.0 },
];

let nextStationId = station2.length + 1;

function findStationIndex(number) {
  if (!/^\d+$/.test(number)) return -1;
  const id = Number(number) + 1;
  return station2.findIndex(station => station.id === id);
}

function readStationForm(body) {
  const { code, name, change = "", passengers, distance } = body;
  if (![code, name, change, passengers, distance].every(value => typeof value === "string")) {
    return null;
  }

  const passengerCount = Number(passengers);
  const distanceKm = Number(distance);
  if (!code.trim() || !name.trim() || !passengers.trim() || !distance.trim()
      || !Number.isSafeInteger(passengerCount) || passengerCount < 0
      || !Number.isFinite(distanceKm) || distanceKm < 0) {
    return null;
  }
  return {
    code: code.trim(),
    name: name.trim(),
    change: change.trim(),
    passengers: passengerCount,
    distance: distanceKm
  };
}

app.get("/keiyo2", (req, res) => {
  res.render('keiyo2', { data: station2 });
});

app.get("/keiyo2/create", (req, res) => {
  res.redirect('/public/keiyo2_new.html');
});

app.get("/keiyo2/:number", (req, res) => {
  const index = findStationIndex(req.params.number);
  if (index === -1) return res.status(404).send('駅が見つかりません。');
  res.render('keiyo2_detail', { id: station2[index].id - 1, data: station2[index] });
});

app.post("/keiyo2", (req, res) => {
  const data = readStationForm(req.body);
  if (!data) return res.status(400).send('駅コード、駅名、乗降客数、距離を確認してください。');
  station2.push({ id: nextStationId, ...data });
  nextStationId += 1;
  res.redirect(303, '/keiyo2');
});

app.get("/keiyo2/edit/:number", (req, res) => {
  const index = findStationIndex(req.params.number);
  if (index === -1) return res.status(404).send('駅が見つかりません。');
  res.render('keiyo2_edit', { id: station2[index].id - 1, data: station2[index] });
});

app.post("/keiyo2/update/:number", (req, res) => {
  const index = findStationIndex(req.params.number);
  if (index === -1) return res.status(404).send('駅が見つかりません。');
  const data = readStationForm(req.body);
  if (!data) return res.status(400).send('駅コード、駅名、乗降客数、距離を確認してください。');
  station2[index] = { id: station2[index].id, ...data };
  res.redirect(303, '/keiyo2');
});

app.post("/keiyo2/delete/:number", (req, res) => {
  const index = findStationIndex(req.params.number);
  if (index === -1) return res.status(404).send('駅が見つかりません。');
  station2.splice(index, 1);
  res.redirect(303, '/keiyo2');
});

app.get("/keiyo", (req, res) => {
  // 本来ならここにDBとのやり取りが入る
  res.render('db2', { data: station });
});

app.get("/keiyo_add", (req, res) => {
  let id = req.query.id;
  let code = req.query.code;
  let name = req.query.name;
  let newdata = { id: id, code: code, name: name };
  station.push(newdata);
  // 登録後の画面を切り替えて、スライド26・27ページの動きを比較する。
  if (req.query.next === 'input') {
    return res.redirect('/public/keiyo_add.html');
  }
  res.render('db2', { data: station });
});

app.get("/hello1", (req, res) => {
  const message1 = "Hello world";
  const message2 = "Bon jour";
  res.render('show', { greet1:message1, greet2:message2});
});

app.get("/hello2", (req, res) => {
  res.render('show', { greet1:"Hello world", greet2:"Bon jour"});
});

app.get("/icon", (req, res) => {
  res.render('icon', { filename:"./public/Apple_logo_black.svg", alt:"Apple Logo"});
});

app.get("/omikuji1", (req, res) => {
  const num = Math.floor( Math.random() * 6 + 1 );
  let luck = '';
  if( num==1 ) luck = '大吉';
  else if( num==2 ) luck = '中吉';

  res.send( '今日の運勢は' + luck + 'です' );
});

app.get("/omikuji2", (req, res) => {
  const num = Math.floor( Math.random() * 6 + 1 );
  let luck = '';
  if( num==1 ) luck = '大吉';
  else if( num==2 ) luck = '中吉';

  res.render( 'omikuji2', {result:luck} );
});

app.get("/janken", (req, res) => {
  let hand = req.query.hand;
  let win = Number( req.query.win );
  let total = Number( req.query.total );
  console.log( {hand, win, total});
  const num = Math.floor( Math.random() * 3 + 1 );
  let cpu = '';
  let judgement = '';
  if( num==1 ) cpu = 'グー';
  else if( num==2 ) cpu = 'チョキ';
  else cpu = 'パー';
  // ここに勝敗の判定を入れる
  // 以下の数行は人間の勝ちの場合の処理なので，
  // 判定に沿ってあいこと負けの処理を追加する
  judgement = '勝ち';
  win += 1;
  total += 1;
  const display = {
    your: hand,
    cpu: cpu,
    judgement: judgement,
    win: win,
    total: total
  }
  res.render( 'janken', display );
});

app.listen(8080, () => console.log("Example app listening on port 8080!"));
