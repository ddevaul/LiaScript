import log from '../../liascript/log'

import * as DB from './database'
import * as Base from '../Base/index'
// Ensure the code runs only once
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    // Ensure the message comes from a trusted origin (modify for production)
    if (event.origin !== "http://localhost:3000") return; // Change to your Next.js app's origin

    if (event.data.type === "SET_USERID") {
      console.log("Received userid from parent:", event.data.userid);
      localStorage.setItem("userid", event.data.userid); // ✅ Store it in localStorage
    }
  });

  console.log("Listening for userid messages from parent...");
}


class Connector extends Base.Connector {
  private database: DB.LiaDB

  constructor() {
    super()
    this.database = new DB.LiaDB()
  }

  hasIndex() {
    return true
  }

  async open(uidDB: string, versionDB: number, slide: number) {
    return await this.database.open(uidDB, versionDB, {
      table: 'code',
      id: slide,
    })
  }


  async load(record: Base.Record) {
    console.log("load", record);
    console.log("userid123123123123123123", localStorage.getItem("userid")); // ✅ Should now print the correct userid
    try {
      const response = await fetch(`http://localhost:8080/quiz/123123/${record.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        // Return default data structure if server request fails
        return this.database.load(record)
      }
  
      const result = await response.json();
      
      if (result.data && result.data.quiz_data) {
        console.log("here"); 
        let true_result = await this.database.load(record);
        console.log("true_result", true_result);
        console.log(result.data.quiz_data);
        return result.data.quiz_data;
      }
      console.log("here2");
      return null;
  
    } catch (error) {
      console.error('Error loading quiz data:', error);
      return null;
    }
  }
  
  async store(record: Base.Record) {
    console.log("store", record);
    try {
      // Since record.data is already an array, we'll store it directly as quiz_data
      const dataToStore = {
        quiz_data: JSON.stringify(record.data) // Explicitly stringify the array
      };
  
      console.log("Sending data:", dataToStore);
  
      const response = await fetch(`http://localhost:8080/quiz/123123/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToStore)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("stored result", result);
      return result;
  
    } catch (error) {
      console.error('Error storing quiz data:', error);
      throw error;
    }
  }

  update(record: Base.Record, mapping: (project: any) => any) {
    this.database.transaction(record, mapping)
  }

  slide(id: number) {
    this.database.slide(id)
  }

  async getIndex() {
    return await this.database.listIndex()
  }

  deleteFromIndex(uidDB: string) {
    this.database.deleteIndex(uidDB)
  }

  async storeToIndex(json: any) {
    return this.database.storeIndex(json)
  }

  restoreFromIndex(uidDB: string, versionDB?: number) {
    return this.database.restore(uidDB, versionDB)
  }

  async reset(uidDB?: string, versionDB?: number) {
    if (uidDB && versionDB) {
      await this.database.reset(uidDB, versionDB)

      log.info('DB: reset => ', uidDB, versionDB)
    }
  }

  getFromIndex(uidDB: string) {
    return this.database.getIndex(uidDB)
  }

  async addMisc(
    uidDB: string,
    versionDB: number | null,
    key: string,
    value: any
  ) {
    this.database.addMisc(uidDB, versionDB, key, value)
  }

  async getMisc(uidDB: string, versionDB: number | null, key?: string) {
    return this.database.getMisc(uidDB, versionDB, key)
  }
}

export { Connector }
