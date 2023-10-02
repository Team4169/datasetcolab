import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = { 
  apiKey: "AIzaSyB32RFyl8TM_n6Dq1oTKo84w1olUu1lWbE", 
  authDomain: "frcdatasetcolab.firebaseapp.com", 
  projectId: "frcdatasetcolab", 
  storageBucket: "frcdatasetcolab.appspot.com", 
  messagingSenderId: "284258934962", 
  appId: "1:284258934962:web:1e421c130c19d7df0fe9ab" 
}; 

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;