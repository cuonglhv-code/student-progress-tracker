import fs from "fs";
import path from "path";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Database {
  getData(userEmail: string): Promise<any>;
  createItem(collection: string, item: any): Promise<any>;
  updateItem(collection: string, id: string, item: any): Promise<any>;
  deleteItem(collection: string, id: string): Promise<any>;
}

export class GoogleSheetsDatabase implements Database {
  private doc: GoogleSpreadsheet;
  private localDbPath: string;

  constructor(sheetId: string, email: string, key: string) {
    const jwt = new JWT({
      email,
      key: key.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    this.doc = new GoogleSpreadsheet(sheetId, jwt);
    this.localDbPath = path.join(process.cwd(), "data.json");
  }

  private async load() {
    await this.doc.loadInfo();
  }

  private async getSheet(title: string) {
    await this.load();
    let sheet = this.doc.sheetsByTitle[title];
    if (!sheet) {
      const headersMap: Record<string, string[]> = {
        'Users': ["id", "email", "name", "role", "assignedClassIds"],
        'Students': ["id", "name", "classId", "teacherId", "taId", "currentBand", "targetBand", "startDate", "endDate", "status", "notes"],
        'Classes': ["id", "name", "level", "teacherId", "taId", "startDate", "endDate", "schedule", "status"],
        'Attendance': ["id", "studentId", "classId", "date", "session", "status", "markedById", "notes"],
        'Homework': ["id", "title", "description", "classId", "assignedById", "assignedDate", "dueDate", "skillCategory", "status"],
        'HomeworkSubmissions': ["id", "homeworkId", "studentId", "status", "score", "band", "feedback", "submissionDate", "markedDate"],
        'Tests': ["id", "title", "type", "classId", "assignedById", "date", "skillsAssessed", "maxScore", "notes"],
        'TestResults': ["id", "testId", "studentId", "writing", "speaking", "listening", "reading", "overall", "comments", "markedDate"]
      };
      sheet = await this.doc.addSheet({ title, headerValues: headersMap[title] || ["id"] });
    }
    return sheet;
  }

  private formatRow(row: GoogleSpreadsheetRow, headers: string[]) {
    const obj: any = {};
    headers.forEach((header: string) => {
      let val = row.get(header);
      if (['assignedClassIds', 'skillsAssessed'].includes(header)) {
        val = val ? val.split(',') : [];
      }
      obj[header] = val;
    });
    return obj;
  }

  async getData(userEmail: string) {
    await this.load();
    const sheetTitles = ["Users", "Students", "Classes", "Attendance", "Homework", "HomeworkSubmissions", "Tests", "TestResults"];
    const data: any = {};
    
    for (const title of sheetTitles) {
      const sheet = await this.getSheet(title);
      const key = title.charAt(0).toLowerCase() + title.slice(1);
      if (sheet) {
        const rows = await sheet.getRows();
        data[key] = rows.map(row => this.formatRow(row, sheet.headerValues));
      } else {
        data[key] = [];
      }
    }

    const currentUser = (data.users || []).find((u: any) => u.email === userEmail) || (data.users && data.users[0]);
    return { ...data, currentUser, config: { hasGoogleSheets: true, sheetTitle: this.doc.title } };
  }

  async createItem(collection: string, item: any) {
    const title = this.getSheetTitle(collection);
    const sheet = await this.getSheet(title);
    if (sheet) {
      const rowData = { ...item };
      Object.keys(rowData).forEach(key => {
        if (Array.isArray(rowData[key])) rowData[key] = rowData[key].join(',');
      });
      await sheet.addRow(rowData);
    }
    return item;
  }

  async updateItem(collection: string, id: string, item: any) {
    const title = this.getSheetTitle(collection);
    const sheet = await this.getSheet(title);
    if (sheet) {
      const rows = await sheet.getRows();
      const row = rows.find(r => r.get('id') === id);
      if (row) {
        Object.keys(item).forEach(key => {
          let val = item[key];
          if (Array.isArray(val)) val = val.join(',');
          row.set(key, val);
        });
        await row.save();
      }
    }
    return item;
  }

  async deleteItem(collection: string, id: string) {
    const title = this.getSheetTitle(collection);
    const sheet = await this.getSheet(title);
    if (sheet) {
      const rows = await sheet.getRows();
      const row = rows.find(r => r.get('id') === id);
      if (row) await row.delete();
    }
  }

  private getSheetTitle(collection: string) {
    const map: Record<string, string> = {
      'homeworkSubmissions': 'HomeworkSubmissions',
      'testResults': 'TestResults'
    };
    return map[collection] || (collection.charAt(0).toUpperCase() + collection.slice(1));
  }
}

export class LocalDatabase implements Database {
  private path: string;

  constructor() {
    this.path = path.join(process.cwd(), "data.json");
    this.ensureExists();
  }

  private ensureExists() {
    if (!fs.existsSync(this.path)) {
      const sampleData = {
        users: [
          { id: "u1", email: "admin@school.com", name: "Admin Manager", role: "Admin", assignedClassIds: [] },
          { id: "u2", email: "teacher@school.com", name: "John Smith", role: "Teacher", assignedClassIds: ["c1"] },
          { id: "u3", email: "ta@school.com", name: "Sarah TA", role: "TA", assignedClassIds: ["c1"] }
        ],
        students: [],
        classes: [
          { id: "c1", name: "IELTS Advanced A", level: "Advanced", teacherId: "u2", taId: "u3", startDate: "2024-01-01", endDate: "2024-06-01", schedule: "Mon/Wed 6-8pm", status: "Active" }
        ],
        attendance: [],
        homework: [],
        homeworkSubmissions: [],
        tests: [],
        testResults: []
      };
      fs.writeFileSync(this.path, JSON.stringify(sampleData, null, 2));
    }
  }

  private read() {
    const data = JSON.parse(fs.readFileSync(this.path, "utf-8"));
    return {
      users: data.users || [],
      students: data.students || [],
      classes: data.classes || [],
      attendance: data.attendance || [],
      homework: data.homework || [],
      homeworkSubmissions: data.homeworkSubmissions || [],
      tests: data.tests || [],
      testResults: data.testResults || [],
      ...data
    };
  }

  private write(data: any) {
    fs.writeFileSync(this.path, JSON.stringify(data, null, 2));
  }

  async getData(userEmail: string) {
    const data = this.read();
    const currentUser = data.users.find((u: any) => u.email === userEmail) || data.users[0];
    return { ...data, currentUser, config: { hasGoogleSheets: false, sheetTitle: null } };
  }

  async createItem(collection: string, item: any) {
    const data = this.read();
    if (data[collection]) {
      data[collection].push(item);
      this.write(data);
    }
    return item;
  }

  async updateItem(collection: string, id: string, item: any) {
    const data = this.read();
    if (data[collection]) {
      const index = data[collection].findIndex((i: any) => i.id === id);
      if (index !== -1) {
        data[collection][index] = { ...data[collection][index], ...item };
        this.write(data);
      }
    }
    return item;
  }

  async deleteItem(collection: string, id: string) {
    const data = this.read();
    if (data[collection]) {
      data[collection] = data[collection].filter((i: any) => i.id !== id);
      this.write(data);
    }
  }
}
