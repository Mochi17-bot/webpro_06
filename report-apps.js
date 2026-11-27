"use strict";

const apps = [
  {
    resource: "players",
    title: "サッカー選手管理",
    fields: [
      { name: "name", label: "選手名", required: true },
      { name: "team", label: "所属チーム", required: true },
      { name: "position", label: "ポジション", required: true },
      { name: "number", label: "背番号", type: "number", required: true }
    ],
    records: [
      { id: 1, name: "山田 翔", team: "青葉FC", position: "FW", number: 9 },
      { id: 2, name: "佐藤 晴", team: "青葉FC", position: "GK", number: 1 }
    ]
  },
  {
    resource: "tasks",
    title: "課題管理",
    fields: [
      { name: "title", label: "課題名", required: true },
      { name: "subject", label: "授業名", required: true },
      { name: "dueDate", label: "提出期限", type: "date", required: true },
      { name: "status", label: "進捗", options: ["未着手", "進行中", "完了"], required: true }
    ],
    records: [
      { id: 1, title: "Webアプリの仕様書", subject: "Webプログラミング", dueDate: "2026-12-11", status: "進行中" },
      { id: 2, title: "練習問題", subject: "情報数学", dueDate: "2026-12-14", status: "未着手" }
    ]
  },
  {
    resource: "songs",
    title: "好きな曲管理",
    fields: [
      { name: "title", label: "曲名", required: true },
      { name: "artist", label: "アーティスト名", required: true },
      { name: "album", label: "アルバム名" },
      { name: "genre", label: "ジャンル" },
      { name: "impression", label: "感想", type: "textarea", list: false }
    ],
    records: [
      { id: 1, title: "朝の散歩", artist: "青空バンド", album: "街の音", genre: "ポップ", impression: "朝に聴くと気分が上がる。" },
      { id: 2, title: "帰り道", artist: "灯り", album: "", genre: "フォーク", impression: "" }
    ]
  }
];

function readForm(fields, body = {}) {
  const values = {};
  const errors = [];

  for (const field of fields) {
    const raw = body[field.name];
    const value = typeof raw === "string" ? raw.trim() : "";
    values[field.name] = value;
    if ((field.required && !value) || (raw !== undefined && typeof raw !== "string")) {
      errors.push(field.label + "を入力してください。");
      continue;
    }
    if (field.options && !field.options.includes(value)) {
      errors.push(field.label + "を選択肢から選んでください。");
    }
    if (field.type === "number" && value) {
      const number = Number(value);
      if (!Number.isSafeInteger(number) || number < 0) {
        errors.push(field.label + "は0以上の整数で入力してください。");
      } else {
        values[field.name] = number;
      }
    }
    if (field.type === "date" && value) {
      const date = new Date(value + "T00:00:00Z");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")
          || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        errors.push(field.label + "には実在する日付を入力してください。");
      }
    }
  }
  return { values, errors };
}

function registerReportApps(app) {
  app.get("/report", (req, res) => {
    res.render("report_index", { apps });
  });

  for (const { resource, title, fields, records } of apps) {
    const base = "/" + resource;
    const nameField = fields[0].name;
    const listFields = fields.filter(field => field.list !== false);
    let nextId = Math.max(0, ...records.map(record => record.id)) + 1;

    function findRecordIndex(id) {
      return records.findIndex(record => String(record.id) === id);
    }

    function showForm(res, { record, values, errors = [] }) {
      const edit = Boolean(record);
      const action = edit ? base + "/update/" + record.id : base;
      const back = edit ? base + "/" + record.id : base;
      res.status(errors.length ? 400 : 200).render("report_form", {
        title, base, fields, values, errors, edit, action, back
      });
    }

    app.get(base, (req, res) => {
      res.render("report_list", { title, base, fields: listFields, records });
    });

    app.get(base + "/create", (req, res) => {
      showForm(res, { values: {} });
    });

    app.get(base + "/edit/:id", (req, res) => {
      const record = records[findRecordIndex(req.params.id)];
      if (!record) return res.status(404).send("データが見つかりません。");
      showForm(res, { record, values: record });
    });

    app.get(base + "/:id", (req, res) => {
      const record = records[findRecordIndex(req.params.id)];
      if (!record) return res.status(404).send("データが見つかりません。");
      res.render("report_detail", { title, base, fields, nameField, record });
    });

    app.post(base, (req, res) => {
      const { values, errors } = readForm(fields, req.body);
      if (errors.length) return showForm(res, { values, errors });
      records.push({ id: nextId, ...values });
      nextId += 1;
      res.redirect(303, base);
    });

    app.post(base + "/update/:id", (req, res) => {
      const index = findRecordIndex(req.params.id);
      const record = records[index];
      if (!record) return res.status(404).send("データが見つかりません。");
      const { values, errors } = readForm(fields, req.body);
      if (errors.length) return showForm(res, { record, values, errors });
      records[index] = { id: record.id, ...values };
      res.redirect(303, base + "/" + record.id);
    });

    app.post(base + "/delete/:id", (req, res) => {
      const index = findRecordIndex(req.params.id);
      if (index === -1) return res.status(404).send("データが見つかりません。");
      records.splice(index, 1);
      res.redirect(303, base);
    });
  }
}

module.exports = registerReportApps;
